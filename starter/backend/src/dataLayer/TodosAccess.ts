// import * as AWSXRay from "aws-xray-sdk-core";
const AWSXRay = require("aws-xray-sdk-core");
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";
import { createLogger } from "../utils/logger";

const logger = createLogger("todosAccess");

// Initialize DynamoDB Client with AWS X-Ray
const dynamoDBClient = AWSXRay.captureAWSv3Client(
  new DynamoDBClient({ region: "us-east-1" })
);
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

export class TodosAccess {
  constructor(
    private readonly todosTable = process.env.TODOS_TABLE!,
    private readonly todosByUserIndex = process.env.TODOS_BY_USER_INDEX!
  ) {}

  async getTodoItems(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting all todos for user ${userId} from ${this.todosTable}`);

    const result = await docClient.send(
      new QueryCommand({
        TableName: this.todosTable,
        IndexName: this.todosByUserIndex,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
      })
    );

    return result.Items as TodoItem[] || [];
  }

  async getTodoItem(todoId: string): Promise<TodoItem | null> {
    logger.info(`Getting todo ${todoId} from ${this.todosTable}`);

    const result = await docClient.send(
      new GetCommand({
        TableName: this.todosTable,
        Key: { todoId },
      })
    );

    return result.Item as TodoItem | null;
  }

  async createTodoItem(todoItem: TodoItem): Promise<void> {
    logger.info(`Putting todo ${todoItem.todoId} into ${this.todosTable}`);

    await docClient.send(
      new PutCommand({
        TableName: this.todosTable,
        Item: todoItem,
      })
    );
  }

  async updateTodoItem(todoId: string, todoUpdate: TodoUpdate): Promise<void> {
    logger.info(`Updating todo item ${todoId} in ${this.todosTable}`);

    await docClient.send(
      new UpdateCommand({
        TableName: this.todosTable,
        Key: { todoId },
        UpdateExpression: "SET #name = :name, dueDate = :dueDate, done = :done",
        ExpressionAttributeNames: { "#name": "name" },
        ExpressionAttributeValues: {
          ":name": todoUpdate.name,
          ":dueDate": todoUpdate.dueDate,
          ":done": todoUpdate.done,
        },
      })
    );
  }

  async deleteTodoItem(todoId: string): Promise<void> {
    logger.info(`Deleting todo item ${todoId} from ${this.todosTable}`);

    await docClient.send(
      new DeleteCommand({
        TableName: this.todosTable,
        Key: { todoId },
      })
    );
  }

  async updateAttachmentUrl(todoId: string, attachmentUrl: string): Promise<void> {
    logger.info(`Updating attachment URL for todo ${todoId} in ${this.todosTable}`);

    await docClient.send(
      new UpdateCommand({
        TableName: this.todosTable,
        Key: { todoId },
        UpdateExpression: "SET attachmentUrl = :attachmentUrl",
        ExpressionAttributeValues: {
          ":attachmentUrl": attachmentUrl,
        },
      })
    );
  }
}