const {DynamoDBClient, PutItemCommand} = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION});

exports.confirmUpload = async (event) => {
    try {
        const tableName = process.env.TABLE_NAME;
        const bucketName = process.env.BUCKET_NAME;
        // Get the uploaded file information from the S3 event
        const record = event.Records[0];

        const fileName = record.s3.object.key;
        const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`; // Construct the S3 URL of the uploaded image

        const params = {
            TableName: tableName,
            Item: {
                fileName: { S: fileName },
                imageUrl: { S: imageUrl },
                uploadedAt: { S: new Date().toISOString() },
            },
        };
        
        const command = new PutItemCommand(params);
        await dynamoDbClient.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({message: 'Upload confirmed!', imageUrl}),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({message: 'Error confirming upload', error: error.message}),
        };
    }
}