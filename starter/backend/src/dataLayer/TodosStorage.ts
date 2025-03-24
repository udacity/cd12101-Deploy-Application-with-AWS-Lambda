//import 'source-map-support/register'

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { captureAWSv3Client } from "aws-xray-sdk";

const s3Client = captureAWSv3Client(
  new S3Client({ region: process.env.AWS_REGION })
);

export class TodosStorage {
  private readonly bucketName = process.env.ATTACHMENTS_S3_BUCKET;
  private readonly urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION || "300"); // Default to 300s

  async getAttachmentUrl(attachmentId: string): Promise<string> {
    return `https://${this.bucketName}.s3.amazonaws.com/${attachmentId}`;
  }

  async getUploadUrl(attachmentId: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: attachmentId,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: this.urlExpiration });
  }
}