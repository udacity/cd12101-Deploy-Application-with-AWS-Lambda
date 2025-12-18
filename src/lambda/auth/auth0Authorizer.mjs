import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

/**
 * REST API Lambda Authorizer (TOKEN)
 * Needs env:
 *  - AUTH0_JWKS_URL  e.g. https://tenant.auth0.com/.well-known/jwks.json
 *  - AUTH0_AUDIENCE
 *  - AUTH0_ISSUER    e.g. https://tenant.auth0.com/
 */
const client = jwksClient({
  jwksUri: process.env.AUTH0_JWKS_URL,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export const handler = async (event) => {
  try {
    const token = extractBearer(event?.authorizationToken);
    const decoded = await verifyJwt(token);
    const principalId = decoded.sub;
    return allow(principalId, event.methodArn, { sub: decoded.sub });
  } catch (e) {
    console.error('Authorizer error:', e?.message || e);
    return deny('anonymous', event.methodArn);
  }
};

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
      {
        algorithms: ['RS256'],
        audience: process.env.AUTH0_AUDIENCE,
        issuer: process.env.AUTH0_ISSUER
      },
      (err, decoded) => (err ? reject(err) : resolve(decoded))
    );
  });
}

function policy(principalId, effect, resource, context = {}) {
  return {
    principalId,
    context,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Action: 'execute-api:Invoke', Effect: effect, Resource: resource }]
    }
  };
}

const allow = (pid, res, ctx) => policy(pid, 'Allow', res, ctx);
const deny = (pid, res) => policy(pid, 'Deny', res);
