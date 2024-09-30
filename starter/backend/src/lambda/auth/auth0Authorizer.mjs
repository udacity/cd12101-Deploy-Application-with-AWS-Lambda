// import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { getToken } from './utils.mjs'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')

// const jwksUrl = 'https://test-endpoint.auth0.com/.well-known/jwks.json'

// try {
//   const options = {
//     method: 'POST',
//     url: 'https://dev-omd21w14uk2r7iea.us.auth0.com/oauth/token',
//     headers: { 'content-type': 'application/json' },
//     body: '{"client_id":"Nnd3vyjnLcPu7Eex7iBLv9Vtjp9uUVM5","client_secret":"DpcH5zBlxYl9vBXWyuq3Jfkdo1hjQ6gY2-aJ-IOC1OR0vlpJUyuPE_LeJLuMNSTM","audience":"https://dev-omd21w14uk2r7iea.us.auth0.com/api/v2/","grant_type":"client_credentials"}'
//   };
//   const response = await axios.request(options);
//   console.log(response);
// } catch (error) {
//   console.error(error);
// }


// axios.request(options).then(function (response) {
//   console.log(response.data);
// }).catch(function (error) {
//   console.error(error);
// });

const certificate = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJR46emMWtBizrMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi1vbWQyMXcxNHVrMnI3aWVhLnVzLmF1dGgwLmNvbTAeFw0yNDA5Mjkx
NjIxNDdaFw0zODA2MDgxNjIxNDdaMCwxKjAoBgNVBAMTIWRldi1vbWQyMXcxNHVr
MnI3aWVhLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBALX85EahC09JCuuCrJrbajwcTI6B+0cU2KEUyedj/lWYI6yAITJw9szdelnZ
+6GmBMWw4yHlZI78F9gixjicgfFkBb0hEGYlTtFeo6M/BUvKdnQvaj7bxs6Km4T9
Q9t72PzhrAgN+IWx19gvb2u8oYf9MhudqsIZxlGvv9zZN7wHAewGlGcJUjGGTGWQ
/sQw2n4YzpY9Fg5/IMdYexvBOJM4p9Y8VtQbcjy4wkVHLb3k0pAli88o/prpa9DM
BFnBqeaRgC7ivmWgZ0Eg3MmpopJjE+i/S7/TR6KS5NjcPrX64hzeWeQG4STyIJJ8
D6A9g9qpVYbrWvHgDH6IiFxXZ40CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQU6Hp9lC4sWSn+hnI6ArjHbUMYs+owDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQBcghtNOpmE6gz9QWiNcJLgiM7iIHjhpchqmafO/kwg
/MWYcFsgqTcgVwoukwGkpWpqxg9Sf9bQQmtPr3YJXbjYPSVSWRvmb+h670maBFfq
nVh70fXIrxkXKO6PcugDH0UpnX6HG1AEB1Id7hWpeNGH2WqINVV7JVbVo78J0o4S
IOjTay0NLCN+ojWgy92fAiIhHLt1aLW6nyf+00MMovs2Ij6ynK58BoRz5FJcELnD
FP9wLk5qlpyS3Icj4zKHrXbi2ypZLSENsl/GtP7ocJQX5/CtTzp2weIJp6jN2k3e
Y8QOS2TlFt7tVmfnlq2/GKAv9g73FAS8nuqZIOuO4rTP
-----END CERTIFICATE-----`


export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    logger.info('User authorized', { jwtToken, userId: jwtToken.sub })
    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (error) {
    logger.error('User not authorized', { error: error.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  if (!authHeader) throw new Error('No authorization header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authorization header')

  const token = getToken(authHeader)
  const jwt = jsonwebtoken.decode(token, { complete: true })

  jsonwebtoken.verify(token, certificate, { algorithms: ['RS256'] })
  logger.info(`Token verified.`, { jwt })

  return jwt
}
