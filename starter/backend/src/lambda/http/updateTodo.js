// src/lambda/http/updateTodo.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.TODOS_TABLE;
const ORIGIN = process.env.WEB_ORIGIN; // e.g. https://ubiquitous-fishstick-...app.github.dev

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const cors = () => ({
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Credentials': false, // must match serverless.yml
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PATCH,DELETE'
});

function getUserId(event) {
  // REST API + Lambda authorizer
  const restPrincipal = event?.requestContext?.authorizer?.principalId;
  if (restPrincipal) return restPrincipal;

  // HTTP API + (JWT/custom) authorizer variants
  const sub =
    event?.requestContext?.authorizer?.jwt?.claims?.sub ||
    event?.requestContext?.authorizer?.claims?.sub;
  return sub || null;
}

exports.handler = async (event) => {
  try {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: cors(), body: '' };
    }

    const userId = getUserId(event);
    if (!userId) {
      return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const todoId = event.pathParameters?.todoId;
    if (!todoId) {
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Missing todoId' }) };
    }

    let patch;
    try {
      patch = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    // Build SET expression dynamically
    const names = {};
    const values = {};
    const sets = [];

    if (patch.name !== undefined) {
      const n = String(patch.name).trim();
      if (!n) {
        return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'name cannot be empty' }) };
      }
      names['#n'] = 'name';
      values[':n'] = n;
      sets.push('#n = :n');
    }

    if (patch.dueDate !== undefined) {
      // basic YYYY-MM-DD check (same as request schema)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(patch.dueDate))) {
        return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'dueDate must be YYYY-MM-DD' }) };
      }
      names['#d'] = 'dueDate';
      values[':d'] = patch.dueDate;
      sets.push('#d = :d');
    }

    if (patch.done !== undefined) {
      names['#done'] = 'done';
      values[':done'] = !!patch.done;
      sets.push('#done = :done');
    }

    if (sets.length === 0) {
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'No valid fields to update' }) };
    }

    const result = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'SET ' + sets.join(', '),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW'
      })
    );

    return { statusCode: 200, headers: cors(), body: JSON.stringify({ item: result.Attributes }) };
  } catch (e) {
    if (e?.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: 'Todo not found' }) };
    }
    console.error('updateTodo error', e);
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
