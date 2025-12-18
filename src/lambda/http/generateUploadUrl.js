const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const TABLE = process.env.TODOS_TABLE;
const BUCKET = process.env.ATTACHMENTS_BUCKET;
const EXP = parseInt(process.env.SIGNED_URL_EXPIRATION || '300', 10);

const cors = () => ({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': true });

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

module.exports.handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.principalId;
    if (!userId) return { statusCode: 401, headers: cors(), body: 'Unauthorized' };

    const todoId = event.pathParameters?.todoId;
    if (!todoId) return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Missing todoId' }) };

    // ensure item exists
    const getRes = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId, todoId } }));
    if (!getRes.Item) {
      return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: 'Todo not found' }) };
    }

    const key = todoId;
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: EXP });
    const attachmentUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;

    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { userId, todoId },
      UpdateExpression: 'SET attachmentUrl = :u',
      ExpressionAttributeValues: { ':u': attachmentUrl }
    }));

    return { statusCode: 200, headers: cors(), body: JSON.stringify({ uploadUrl }) };
  } catch (e) {
    console.error('generateUploadUrl error', e);
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message }) };
  }
};
