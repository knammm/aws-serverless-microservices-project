const { DynamoDBClient, DeleteItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

// Notification
const {SNSClient, PublishCommand} = require('@aws-sdk/client-sns');
const snsClient = new SNSClient({ region: process.env.REGION });

exports.cleanUpProduct = async () => {
    try {
        const tableName = process.env.TABLE_NAME;
        const snsTopicArn = process.env.SNS_TOPIC_ARN;
        // Scan the table for items older than 5 minutes without an imageUrl
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: 'createdAt < :fiveMinutesAgo AND attribute_not_exists(imageUrl)', // Check if imageUrl does not exist
            ExpressionAttributeValues: {
                ':fiveMinutesAgo': { S: fiveMinutesAgo }, // Items older than 5 minutes
            },
        });

        const { Items } = await dynamoDBClient.send(scanCommand);

        // If no items to delete, return early
        if (!Items || Items.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No products to clean up' }),
            };
        }

        let deletedCount = 0;
        // Delete each item found
        for (const item of Items) {
            // Prepare the delete command
            const deleteCommand = new DeleteItemCommand({
                TableName: tableName,
                Key: { id: { S: item.id.S } }
            });
            // Delete the item
            await dynamoDBClient.send(deleteCommand);
            deletedCount++;
        }

        // Send notification if any items were deleted
        const snsMessage = `Cleaned up ${deletedCount} products without images older than 5 minutes.`;

        const publishCommand = new PublishCommand({
            TopicArn: snsTopicArn,
            Message: snsMessage,
            Subject: 'Product Cleanup Notification'
        });
        await snsClient.send(publishCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Cleaned up ${deletedCount} products` }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error cleaning up products', details: error.message }),
        };
    }
}