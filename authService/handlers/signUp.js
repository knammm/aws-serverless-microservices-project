// Import the AWS Cognito SDK
// CognitoIdentityProviderClient is used to interact with the Cognito User Pool
// SignUpCommand: used to send sign-up request to create new user

const {CognitoIdentityProviderClient, SignUpCommand} = require('@aws-sdk/client-cognito-identity-provider');
// Import the UserModel to save user details in DynamoDB
const UserModel = require('../models/userModel');

const client = new CognitoIdentityProviderClient({region: 'ap-southeast-2'});

// Specify the Cognito app Client ID
const CLIENT_ID = process.env.CLIENT_ID;

// Sign Up function
exports.signUp = async (event) => {
    // Parse the request body to get username, password, and email
    const { username, password, email, fullName } = JSON.parse(event.body);

    // Prepare the parameters for the sign-up request
    const params = {
        ClientId: CLIENT_ID,
        Username: username,
        Password: password,
        UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'name', Value: fullName },
        ]
    };

    try {
        // Create a SignUpCommand with the prepared parameters
        const command = new SignUpCommand(params);

        // Send the sign-up request to Cognito
        await client.send(command);

        // If sign-up is successful, save the user details in DynamoDB
        const newUser = new UserModel(email, fullName);
        await newUser.save();

        // Return a success response
        return{
            statusCode: 200,
            body: JSON.stringify({ message: 'User signed up successfully' })
        };
    } catch (error) {
        return{
            statusCode: 500,
            body: JSON.stringify({
                message: 'Unexpected error occurred during sign-up',
                error: error.message
            })
        };
    }
};