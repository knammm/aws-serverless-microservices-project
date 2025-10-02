const {DynamoDBClient, ScanCommand } = require ('@aws-sdk/client-dynamodb');
const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION })

exports.getApprovedProduct = async () => {
    try {
        const tableName = process.env.TABLE_NAME;
        
        const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: 'isApproved = :trueVal',
            ExpressionAttributeValues: {
                ':trueVal': { BOOL: true }
            }
        });

        const { Items } = await dynamoDBClient.send(scanCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ products: Items || [] }),
        };
    } catch (error) {
        console.error('Error getting approved products:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get approved products' }),
        };
    }
}
