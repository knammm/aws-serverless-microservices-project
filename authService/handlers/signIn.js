const {CognitoIdentityProviderClient, InitiateAuthCommand} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({region: 'ap-southeast-2'});

const CLIENT_ID = process.env.CLIENT_ID;

exports.signIn = async (event) => {
    const { email, password } = JSON.parse(event.body);

    const params = {
        ClientId: CLIENT_ID,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        },
    }

    try {
        const command = new InitiateAuthCommand(params);
        const response = await client.send(command);

        return{
            statusCode: 200,
            body: JSON.stringify({
                message: 'User signed in successfully',
                tokens: response.AuthenticationResult, // Return the authentication tokens
            })
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'User sign in failed',
                error: error.message
            })
        };
    }
}