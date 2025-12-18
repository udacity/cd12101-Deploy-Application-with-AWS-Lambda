const { v4: uuid } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.TODOS_TABLE;
const cors = () => ({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': true });

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

module.exports.handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.principalId;
    if (!userId) return { statusCode: 401, headers: cors(), body: 'Unauthorized' };

    const data = JSON.parse(event.body || '{}');
    if (!data.name || !data.dueDate)
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'name and dueDate required' }) };

    const item = {
      userId,
      todoId: uuid(),
      createdAt: new Date().toISOString(),
      name: data.name,
      dueDate: data.dueDate,
      done: false
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    return { statusCode: 201, headers: cors(), body: JSON.stringify({ item }) };
  } catch (e) {
    console.error('createTodo error', e);
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message }) };
  }
};
