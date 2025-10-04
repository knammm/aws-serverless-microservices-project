const {CognitoIdentityProviderClient, ConfirmForgotPasswordCommand} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({region: 'ap-southeast-2'});

const CLIENT_ID = process.env.CLIENT_ID;

exports.confirmForgotPassword = async (event) => {
    const { email, verificationCode, newPassword } = JSON.parse(event.body);    
    
    if (!email || !verificationCode || !newPassword) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Email, verification code, and new password are required." }),
        };
    }

    const params = {
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: verificationCode,
        Password: newPassword,
    };

    try {
        // Create a ConfirmForgotPasswordCommand with the prepared parameters
        const confirmForgotPasswordCommand = new ConfirmForgotPasswordCommand(params);
        await client.send(confirmForgotPasswordCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Password reset successful." }),
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error confirming password reset.", error: error.message }),
        };
    }
};