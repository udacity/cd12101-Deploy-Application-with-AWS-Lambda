import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export function handler(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  const todoId = event.pathParameters?.todoId

  if (!todoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request: No todoId provided'
      })
    }
  }

  // TODO: Remove a TODO item by id

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `TODO item with id ${todoId} removed`
    })
  }
}
