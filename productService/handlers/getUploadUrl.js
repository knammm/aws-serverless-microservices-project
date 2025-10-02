const { S3Client, PutObjectCommand } = require ('@aws-sdk/client-s3');
const { getSignedUrl } = require ('@aws-sdk/s3-request-presigner');
const { DynamoDBClient, PutItemCommand } = require ('@aws-sdk/client-dynamodb');
const crypto = require('crypto');

const s3Client = new S3Client({ region: process.env.REGION });
const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

exports.getUploadUrl = async (event) => {

    try {
        const bucketName = process.env.BUCKET_NAME;
        const tableName = process.env.TABLE_NAME;

        const { fileName, fileType, productName, productPrice, description, quantity, category, email } = JSON.parse(event.body);

        if (!fileName || !fileType || !productName || !productPrice || !description || !quantity || !category || !email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields' }),
            };
        }

        const params = {
            Bucket: bucketName,
            Key: fileName,
            ContentType: fileType,
        }

        const uploadUrl = await getSignedUrl(s3Client, new PutObjectCommand(params), { expiresIn: 3600 });

        // Store product details (metadata) in DynamoDB
        const productId = crypto.randomUUID();
        const putItemCommand = new PutItemCommand({
            TableName: tableName,
            Item: {
                id: { S: productId },
                fileName: { S: fileName },
                productName: { S: productName },
                productPrice: { N: productPrice.toString() },
                description: { S: description },
                quantity: { N: quantity.toString() },
                category: { S: category },
                email: { S: email },
                isApproved: { BOOL: false }, // will be approved by admin later => UPDATE
                createdAt: { S: new Date().toISOString() },
            },
        });

        await dynamoDBClient.send(putItemCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ presignedUploadUrl: uploadUrl }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to get upload URL', error: error.message }),
        };
    }
}