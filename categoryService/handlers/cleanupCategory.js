// This is use to clean up a category in DynamoDB if the category lasted more than 1 hours without an image uploaded to S3

const { DynamoDBClient, DeleteItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

// Notification
const {SNSClient, PublishCommand} = require('@aws-sdk/client-sns');
const snsClient = new SNSClient({ region: process.env.REGION });

exports.cleanupCategory = async () => {
    try {
        const tableName = process.env.TABLE_NAME;
        const snsTopicArn = process.env.SNS_TOPIC_ARN;
        // Scan the table for items older than 1 hour without an imageUrl
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: 'createdAt < :oneHourAgo AND attribute_not_exists(imageUrl)', // Check if imageUrl does not exist
            ExpressionAttributeValues: {
                ':oneHourAgo': { S: oneHourAgo }, // Items older than 1 hour
            },
        });

        const { Items } = await dynamoDBClient.send(scanCommand);

        // If no items to delete, return early
        if (!Items || Items.length === 0) {
            // Debug Purpose
            // const snsMessageDebug = `No categories to clean up at ${new Date().toISOString()}.`;
            // const publishCommandDebug = new PublishCommand({
            //     TopicArn: snsTopicArn,
            //     Message: snsMessageDebug,
            //     Subject: 'Category Cleanup Notification'
            // });
            // await snsClient.send(publishCommandDebug);

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No categories to clean up' }),
            };
        }

        let deletedCount = 0;
        // Delete each item found
        for (const item of Items) {
            // Prepare the delete command
            const deleteCommand = new DeleteItemCommand({
                TableName: tableName,
                Key: { fileName: { S: item.fileName.S } }
            });
            // Delete the item
            await dynamoDBClient.send(deleteCommand);
            deletedCount++;
        }

        // Send notification if any items were deleted
        const snsMessage = `Cleaned up ${deletedCount} categories without images older than 1 hour.`;

        const publishCommand = new PublishCommand({
            TopicArn: snsTopicArn,
            Message: snsMessage,
            Subject: 'Category Cleanup Notification'
        });
        await snsClient.send(publishCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Cleaned up ${deletedCount} categories` }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error cleaning up categories', details: error.message }),
        };
    }
}