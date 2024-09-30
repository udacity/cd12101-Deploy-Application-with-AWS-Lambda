import { createLogger } from '../../utils/logger.mjs'
import jsonwebtoken from 'jsonwebtoken'

const logger = createLogger('utils')
/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken) {
  const decodedJwt = jsonwebtoken.decode(jwtToken)
  logger.info(`Decoded jwt token`, { decodedJwt })
  return decodedJwt.sub
}

export function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  logger.info('Token found in the auth header', { token })

  return token
}

export function getUserId(authHeader) {
  const jwtToken = getToken(authHeader)
  const userId = parseUserId(jwtToken)
  logger.info(`Parsed user ${userId} from token`, { userId })
  return userId
}