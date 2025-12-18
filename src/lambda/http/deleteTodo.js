const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.TODOS_TABLE;
const cors = () => ({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': true });

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

module.exports.handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.principalId;
    if (!userId) return { statusCode: 401, headers: cors(), body: 'Unauthorized' };

    const todoId = event.pathParameters?.todoId;
    if (!todoId) return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Missing todoId' }) };

    await ddb.send(new DeleteCommand({
      TableName: TABLE,
      Key: { userId, todoId },
      ConditionExpression: 'attribute_exists(todoId)'
    }));

    return { statusCode: 204, headers: cors(), body: '' };
  } catch (e) {
    if (e && e.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: 'Todo not found' }) };
    }
    console.error('deleteTodo error', e);
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message }) };
  }
};
