import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import AWSXRay from 'aws-xray-sdk-core'
import { createLogger } from '../utils/logger.mjs'

const logger = createLogger('ImagesAccess')

export class ImagesAccess {
  constructor(
    documentClient = AWSXRay.captureAWSv3Client(new DynamoDB()),
    todosTable = process.env.TODOS_TABLE,
    bucketName = process.env.IMAGES_S3_BUCKET,
    urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)
  ) {
    this.documentClient = documentClient
    this.todosTable = todosTable
    this.bucketName = bucketName
    this.urlExpiration = urlExpiration
    this.dynamoDbClient = DynamoDBDocument.from(this.documentClient)
    this.s3Client = new S3Client()
  }

  async getUploadUrl(imageId) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: imageId
      })
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.urlExpiration
      })
      logger.info(`Created signed url for image with id ${imageId}`, { url })
      return url
    } catch (error) {
      logger.error(`Error while creating signed url for image with id ${imageId}`, { imageId, error: error.message })
      throw error
    }
  }

  async updateTodoAttachmentUrl(imageId, todoId, userId) {
    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${imageId}`
    try {
      await this.dynamoDbClient.update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl,
        },
        ReturnValues: 'NONE',
      })
      logger.info(`Updated todo with id ${todoId}`, { attachmentUrl })
    } catch (error) {
      logger.error(`Error while updating todo with id ${todoId}`, { error: error.message })
      throw error
    }
  }
}
