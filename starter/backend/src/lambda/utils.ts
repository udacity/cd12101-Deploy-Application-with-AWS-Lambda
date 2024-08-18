import { APIGatewayProxyEvent } from 'aws-lambda'
import { parseUserId } from '../auth/utils'

export function getUserId(event: APIGatewayProxyEvent) {
  const authorization = event.headers.Authorization

  if (!authorization) {
    throw new Error('No Authorization header provided')
  }

  const split = authorization.split(' ')

  if (split.length !== 2 || split[0].toLowerCase() !== 'bearer') {
    throw new Error('Malformed Authorization header')
  }

  const jwtToken = split[1]

  return parseUserId(jwtToken)
}
