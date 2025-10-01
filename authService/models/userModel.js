// Use DynamoDBClient class to communicate with DynamoDB
// Use PutItemCommand to add an item to a table
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
// const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const TABLE_NAME = "Users"; // DynamoDB table name

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });

// User Model class to represent a user and interact with DynamoDB
class UserModel {
    constructor(email, fullName) {
        this.userId = crypto.randomUUID(); // Generate a unique user ID
        this.email = email;
        this.fullName = fullName;
        this.state = ""; // Default state
        this.locality = ""; // Default locality
        this.city = ""; // Default city
        this.createdAt = new Date().toISOString(); // Timestamp of user creation
    }
    
    // Method to save the user to DynamoDB
    async save() {
        const params = {
            TableName: TABLE_NAME,
            Item: {
                userId: { S: this.userId },
                email: { S: this.email },
                fullName: { S: this.fullName },
                state: { S: this.state },
                locality: { S: this.locality },
                city: { S: this.city },
                createdAt: { S: this.createdAt },
            },
        };

        try {
            // Create the command to put item
            const command = new PutItemCommand(params); 
            await dynamoClient.send(command);
        } catch (error) {
            throw new Error(`Error saving user to DynamoDB: ${error.message}`); // Throw error to be handled by caller
        }
    }
}

// Export the UserModel class
module.exports = UserModel;