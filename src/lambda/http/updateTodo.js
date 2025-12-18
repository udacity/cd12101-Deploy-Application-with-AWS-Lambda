const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.TODOS_TABLE;
const cors = () => ({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': true });

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

module.exports.handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.principalId;
    if (!userId) return { statusCode: 401, headers: cors(), body: 'Unauthorized' };
    const todoId = event.pathParameters?.todoId;
    if (!todoId) return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Missing todoId' }) };

    const patch = JSON.parse(event.body || '{}');

    const names = {};
    const values = {};
    const sets = [];
    if (patch.name !== undefined) { names['#n'] = 'name'; values[':n'] = patch.name; sets.push('#n = :n'); }
    if (patch.dueDate !== undefined) { names['#d'] = 'dueDate'; values[':d'] = patch.dueDate; sets.push('#d = :d'); }
    if (patch.done !== undefined) { names['#done'] = 'done'; values[':done'] = patch.done; sets.push('#done = :done'); }
    if (!sets.length) return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'No valid fields to update' }) };

    const res = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { userId, todoId },
      ConditionExpression: 'attribute_exists(todoId)',
      UpdateExpression: 'SET ' + sets.join(', '),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW'
    }));

    return { statusCode: 200, headers: cors(), body: JSON.stringify({ item: res.Attributes }) };
  } catch (e) {
    if (e && e.name === 'ConditionalCheckFailedException') {
      return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: 'Todo not found' }) };
    }
    console.error('updateTodo error', e);
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message }) };
  }
};
