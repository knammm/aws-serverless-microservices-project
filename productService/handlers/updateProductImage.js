const { DynamoDBClient, UpdateItemCommand, ScanCommand } = require ('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

exports.updateProductImage = async (event) => {
    try {
        const tableName = process.env.TABLE_NAME;
        record = event.Records[0];
        const bucketName = record.s3.bucket.name;
        const fileName = record.s3.object.key;

        const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

        // Find the product by fileName
        const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: 'fileName = :fileName',
            ExpressionAttributeValues: {
                ':fileName': { S: fileName },
            },
        });

        const scanResult = await dynamoDBClient.send(scanCommand);

        if (!scanResult.Items || scanResult.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Product not found' }),
            };
        }

        const productId = scanResult.Items[0].id.S; // 'id' is the primary key, we only filter one by fileName
        const updateCommand = new UpdateItemCommand({
            TableName: tableName,
            Key: {
                id: { S: productId },
            },
            UpdateExpression: 'SET imageUrl = :imageUrl',
            ExpressionAttributeValues: {
                ':imageUrl': { S: imageUrl },
                // ':isApproved': { BOOL: true },
            },
        });

        await dynamoDBClient.send(updateCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Product image updated successfully' }),
        };
    } catch (error) {
        
    }
}