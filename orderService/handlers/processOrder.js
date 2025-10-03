const { DynamoDBClient, PutItemCommand } = require ('@aws-sdk/client-dynamodb');

const dynamoDBCLient = new DynamoDBClient({ region: process.env.REGION });

exports.processOrder = async (event) => {
    try {
        const { Records } = event;
        // Process each record in the SQS event
        for (const record of Records) {
            const { body } = record;
            const order = JSON.parse(body);

            const params = {
                TableName: process.env.TABLE_NAME,
                Item: {
                    id: { S: order.orderId },
                    productId: { S: order.productId },
                    productName: { S: order.productName },
                    productPrice: { N: order.productPrice.toString() },
                    quantity: { N: order.quantity.toString() },
                    email: { S: order.email },
                    status: { S: order.status },
                    createdAt: { S: order.createdAt },
                }
            }
            // Save order to DynamoDB
            const putCommand = new PutItemCommand(params);
            await dynamoDBCLient.send(putCommand);

            return { statusCode: 200, body: JSON.stringify({ message: 'Order processed successfully' }) };
        }

    } catch (error) {
        console.error('Error processing order:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error processing order' }) };
    }
}