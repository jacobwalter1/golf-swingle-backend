import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ 
  region: "us-east-2" 
});

export const s3 = {
  async listVideoFolders(bucket) {
    try {
      const result = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'videos/',
        Delimiter: '/'
      }));
      
      return (result.CommonPrefixes || [])
        .map(prefix => prefix.Prefix.replace('videos/', '').replace('/', ''));
    } catch (error) {
      console.error("Error listing video folders:", error);
      throw error;
    }
  },

  async getGolfersJson(bucket) {
    try {
      const result = await s3Client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: 'golfers/golfers.json'
      }));
      
      const body = await result.Body.transformToString();
      return JSON.parse(body);
    } catch (error) {
      console.error("Error getting golfers.json:", error);
      throw error;
    }
  }
};