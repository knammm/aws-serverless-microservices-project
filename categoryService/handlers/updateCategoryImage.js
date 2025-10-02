// This is when the image is uploaded to S3, we update the DynamoDB record with the image URL

const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

exports.updateCategoryImage = async (event) => {
    try {
        const record = event.Records[0];

        // Get bucket name from the event
        const bucketName = record.s3.bucket.name;

        // Get object key from the event
        const fileName = record.s3.object.key;

        // Construct the S3 URL
        const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

        const command = new UpdateItemCommand({
            TableName: process.env.TABLE_NAME,
            Key: { fileName: { S: fileName }},
            UpdateExpression: 'SET imageUrl = :imageUrl', // :imageUrl is a placeholder
            ExpressionAttributeValues: {
                ':imageUrl': { S: imageUrl }, // actual value to set
            },
        });

        await dynamoDBClient.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Category image URL updated successfully' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error updating category image', details: error.message }),
        };
    }
}