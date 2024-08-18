import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export function handler(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request: No body provided'
      })
    }
  }

  const newTodo = JSON.parse(event.body)

  // TODO: Implement creating a new TODO item

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'New TODO created',
      newTodo
    })
  }
}
