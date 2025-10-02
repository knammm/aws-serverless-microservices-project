// This is when we want to upload a new category image, we generate a signed URL for S3 and store metadata in DynamoDB

const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const s3Client = new S3Client({ region: process.env.REGION });
const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

exports.uploadCategory = async (event) => {
    try {
        const { fileName, fileType, categoryName } = JSON.parse(event.body);

        if (!fileName || !fileType || !categoryName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing fileName, fileType, or categoryName' }),
            };
        }

        const s3Params = {
            Bucket: process.env.BUCKET_NAME,
            Key: fileName,
            ContentType: fileType,
        };

        const command = new PutObjectCommand(s3Params);
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        // Store category metadata in DynamoDB
        const dbParams = {
            TableName: process.env.TABLE_NAME,
            Item: {
                createdAt: { S: new Date().toISOString() },
                categoryName: { S: categoryName },
                fileName: { S: fileName },
                // fileType: { S: fileType },
                // imageUrl: { S: `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${fileName}` }, // not updated yet
            },
        };

        await dynamoDBClient.send(new PutItemCommand(dbParams));

        return {
            statusCode: 200,
            body: JSON.stringify({ signedUrl: url }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error uploading category' }),
        };
    }
}