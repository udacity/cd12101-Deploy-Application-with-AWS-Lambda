import { decode, JwtPayload } from 'jsonwebtoken'
import { createLogger } from '../utils/logger'

const logger = createLogger('utils')

/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken: string): string | null {
  const decodedJwt = decode(jwtToken) as JwtPayload | null

  if (!decodedJwt || typeof decodedJwt.sub !== 'string') {
    logger.error('Failed to parse user ID from JWT token')
    return null
  }

  logger.info('parseUserId')
  return decodedJwt.sub
}
