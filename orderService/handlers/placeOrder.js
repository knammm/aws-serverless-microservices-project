const { DynamoDBClient, PutItemCommand } = require ('@aws-sdk/client-dynamodb');
const {v4: uuid} = require('uuid');

// This is to communicate with GET request to fetch product details
const axios = require('axios');

const dynamoDBClient = new DynamoDBClient({region: process.env.REGION});

exports.placeOrder = async (event) => {
    try {
        const { id, quantity, email } = JSON.parse(event.body);

        if (!id || !quantity || !email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields: id, quantity, email' }),
            };
        }

        // Fetch the product details using Axios
        const productResponse = await axios.get(
            `https://82uiosfvt4.execute-api.ap-southeast-2.amazonaws.com/approved-products`
        );

        // Retrieve the product list and find the product by id
        const productList = productResponse.data.products || [];
        const product = productList.find(p => p.id?.S === id) //p.id?.S => to access the id value from DynamoDB response

        if (!product){
            return {
                statusCode: 404,
                body: JSON.stringify ({ message: 'Product not found' }),
            };
        }

        // Check available stock
        const availableStock = parseInt(product.quantity?.N || "0");
        if (quantity > availableStock) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Insufficient stock available' }),
            };
        }

        const orderId = uuid();
        const params = {
            TableName: process.env.TABLE_NAME,
            Item: {
                id: { S: orderId },
                productId: { S: id },
                productName: { S: product.productName.S },
                productPrice: { N: product.productPrice.N },
                quantity: { N: quantity.toString() },
                email: { S: email },
                status: { S: 'PENDING' },
                createdAt: { S: new Date().toISOString() },
            }
        }

        const putCommand = new PutItemCommand(params);
        await dynamoDBClient.send(putCommand);

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Order placed successfully', orderId }),
        };
    } catch (error) {
        console.error('Error placing order:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error placing order' }),
        };
    }
}



