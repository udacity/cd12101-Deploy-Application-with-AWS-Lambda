const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.TODOS_TABLE;
const INDEX = process.env.TODOS_INDEX_NAME;
const cors = () => ({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': true });

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

module.exports.handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.principalId;
    if (!userId) return { statusCode: 401, headers: cors(), body: 'Unauthorized' };

    const resp = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: INDEX,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false
    }));

    return { statusCode: 200, headers: cors(), body: JSON.stringify({ items: resp.Items || [] }) };
  } catch (e) {
    console.error('getTodos error', e);
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message }) };
  }
};
