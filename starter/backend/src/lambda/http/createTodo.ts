import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUserId } from '../utils'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '../../utils/logger'
import AWSXRay from 'aws-xray-sdk-core'

const logger = createLogger('createToDo')

const dynamoDbClient = AWSXRay.captureAWSv3Client(new DynamoDB() as any)
const dynamoDb = DynamoDBDocument.from(dynamoDbClient)

const { TODOS_TABLE = '' } = process.env

interface TodoItem {
  userId: string
  todoId: string
  name: string
  dueDate: string
  createdAt: string
  done: boolean
}

async function createTodo(
  newTodo: { name: string; dueDate: string },
  userId: string
): Promise<TodoItem> {
  const todoId = uuidv4()

  const todoItem: TodoItem = {
    userId,
    todoId,
    name: newTodo.name,
    dueDate: newTodo.dueDate,
    createdAt: new Date().toISOString(),
    done: false
  }

  await dynamoDb.put({
    TableName: TODOS_TABLE,
    Item: todoItem
  })
  logger.info('TODO item created in DynamoDB', { userId, todoItem })
  return todoItem
}

async function mainHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    logger.error('Invalid request: No body provided')
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request: No body provided'
      })
    }
  }

  const userId = getUserId(event)

  if (!userId) {
    logger.error('Invalid request: No userId found')
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request: No userId found'
      })
    }
  }

  let newTodo: { name: string; dueDate: string }

  try {
    newTodo = JSON.parse(event.body)
  } catch (error) {
    logger.error('Invalid request: Malformed JSON', { error })
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request: Malformed JSON'
      })
    }
  }

  const createdTodo = await createTodo(newTodo, userId)

  logger.info('TODO item created successfully', { userId, createdTodo })
  return {
    statusCode: 201,
    body: JSON.stringify({
      message: 'New TODO created',
      item: createdTodo
    })
  }
}

export const handler = middy(mainHandler)
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
