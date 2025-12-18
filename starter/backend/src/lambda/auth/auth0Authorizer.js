// src/lambda/auth/auth0Authorizer.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: process.env.AUTH0_JWKS_URL,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

function extractBearer(header) {
  if (!header) throw new Error('Missing Authorization token');
  const [type, token] = header.split(' ');
  if (!token || type.toLowerCase() !== 'bearer') throw new Error('Invalid Authorization header');
  return token;
}

function verifyJwt(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      { algorithms: ['RS256'], audience: process.env.AUTH0_AUDIENCE, issuer: process.env.AUTH0_ISSUER },
      (err, decoded) => (err ? reject(err) : resolve(decoded))
    );
  });
}

const policy = (principalId, effect, resource, context = {}) => ({
  principalId,
  context,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [{ Action: 'execute-api:Invoke', Effect: effect, Resource: resource }],
  },
});

const allow = (pid, res, ctx) => policy(pid, 'Allow', res, ctx);
const deny = (pid, res) => policy(pid, 'Deny', res);

module.exports.handler = async (event) => {
  try {
    const token = extractBearer(event?.authorizationToken);
    const decoded = await verifyJwt(token);
    const principalId = decoded.sub || 'user';
    // Allow access to all methods and resources in this API
    const resource = event.methodArn.split('/').slice(0, 2).join('/') + '/*';
    return allow(principalId, resource, { sub: decoded.sub || '' });
  } catch (e) {
    console.error('Authorizer error:', e?.message || e);
    return deny('anonymous', event.methodArn);
  }
};
