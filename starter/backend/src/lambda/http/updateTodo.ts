import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export function handler(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  // @ts-ignore
  const todoId = event.pathParameters.todoId
  // @ts-ignore
  const updatedTodo = JSON.parse(event.body)

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  // @ts-ignore
  return undefined
}
