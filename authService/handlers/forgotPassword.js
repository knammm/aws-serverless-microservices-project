const { CognitoIdentityProviderClient, ForgotPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-2" });

const clientId = process.env.CLIENT_ID;

exports.forgotPassword = async (event) => {
    const { email } = JSON.parse(event.body);

    if (!email) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Email is required." }),
        };
    }

    // Prepare the parameters for the forgot password request => 2 required: ClientId, Username
    const params = {
        ClientId: clientId,
        Username: email,
    };

    try {
        // Create a ForgotPasswordCommand with the prepared parameters
        const forgotPasswordCommand = new ForgotPasswordCommand(params);
        await client.send(forgotPasswordCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Password reset initiated. Check your email for the verification code." }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error initiating password reset.", error: error.message }),
        };
    }
};