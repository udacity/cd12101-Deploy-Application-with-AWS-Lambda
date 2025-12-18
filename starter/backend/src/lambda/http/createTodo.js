// backend/src/lambda/http/createTodo.js
const { v4: uuid } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Environment variables
const TABLE = process.env.TODOS_TABLE;
const ORIGIN = process.env.WEB_ORIGIN || '*';

// DynamoDB client
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// CORS helper
const cors = () => ({
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Credentials': true, 
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PATCH,DELETE'
});

// Extract user ID from the authorizer (works for both REST and HTTP APIs)
function getUserId(event) {
  const restPrincipal = event?.requestContext?.authorizer?.principalId;
  if (restPrincipal) return restPrincipal;

  const jwtSub =
    event?.requestContext?.authorizer?.jwt?.claims?.sub ||
    event?.requestContext?.authorizer?.claims?.sub;
  return jwtSub || null;
}

// Lambda handler
module.exports.handler = async (event) => {
  try {
    // Handle preflight requests directly
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: cors(), body: '' };
    }

    const userId = getUserId(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: cors(),
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const data = JSON.parse(event.body || '{}');
    if (!data.name || !data.dueDate) {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({ error: 'name and dueDate are required' }),
      };
    }

    const newItem = {
      userId,
      todoId: uuid(),
      createdAt: new Date().toISOString(),
      name: data.name,
      dueDate: data.dueDate,
      done: false,
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: newItem }));

    return {
      statusCode: 201,
      headers: cors(),
      body: JSON.stringify(newItem),
    };
  } catch (err) {
    console.error('createTodo error', err);
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: err.message }),
    };
  }
};
