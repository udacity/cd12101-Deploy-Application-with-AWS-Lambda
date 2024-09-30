import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import AWSXRay from 'aws-xray-sdk-core'
import { createLogger } from '../utils/logger.mjs'

const logger = createLogger('TodosAccess')

export class TodosAccess {
  constructor(
    documentClient = AWSXRay.captureAWSv3Client(new DynamoDB()),
    todosTable = process.env.TODOS_TABLE,
    todosIndex = process.env.TODOS_CREATED_AT_INDEXs
  ) {
    this.documentClient = documentClient
    this.todosTable = todosTable
    this.todosIndex = todosIndex
    this.dynamoDbClient = DynamoDBDocument.from(this.documentClient)
  }

  async getAllTodosByUser(userId) {
    try {
      // To query an index you need to use the query() method
      const result = await this.dynamoDbClient
        .query({
          TableName: this.todosTable,
          IndexName: this.todosIndex,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          },
          ScanIndexForward: false
        })
      logger.info(`Found Todos for user ${userId}`, { userId })
      return result.Items
    } catch (error) {
      logger.error(`Error while getting all todos for user ${userId}`, { error, userId })
      throw error
    }
  }

  async createTodo(todo) {
    logger.info(`Received todo before writing at db`, { todo })
    try {
      await this.dynamoDbClient.put({
        TableName: this.todosTable,
        Item: todo
      })
      logger.info(`Created todo with id ${todo.todoId}`, { todo })
      return todo
    } catch (error) {
      logger.error(`Error while creating todo with id ${todo.todoId}`, { todo, error: error.message, todo })
      throw error
    }
  }

  async updateTodo(todo, todoId, userId) {
    try {
      await this.dynamoDbClient.update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: 'set dueDate = :dueDate, done = :done',
        ExpressionAttributeValues: {
          ':dueDate': todo.dueDate,
          ':done': todo.done,
        },
        ReturnValues: 'NONE',
      })
      logger.info(`Updated todo with id ${todoId}`, { todo })
    } catch (error) {
      logger.error(`Error while updating todo with id ${todoId}`, { error: error.message })
      throw error
    }
  }

  async deleteTodo(todoId, userId) {
    try {
      await this.dynamoDbClient.delete({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        }
      })
      logger.info(`Deleted todo with id ${todoId}`)
    } catch (error) {
      logger.error(`Error while deleting todo with id ${todoId}`, { error: error.message })
      throw error
    }
  }

  async todoExistsForUser(todoId, userId) {
    logger.info(`Checking if todo with id ${todoId} belong to user ${userId}`, { todoId, userId })
    try {
      const result = await this.dynamoDbClient.get({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        }
      })
      logger.info(`Found a todo with id ${todoId}`, { todoId, userId, result })
      return !!result.Item
    } catch (error) {
      logger.error(`Error while checking if todo with id ${todoId} belong to user ${userId}`, { error: error.message })
      throw error
    }
  }
}
