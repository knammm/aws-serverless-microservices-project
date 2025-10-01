const {CognitoIdentityProviderClient, GlobalSignOutCommand} = require('@aws-sdk/client-cognito-identity-provider');

// Note: We don't need to use Client here as GlobalSignOutCommand only requires AccessToken
// const client = new CognitoIdentityProviderClient({region: 'us-east-1'}); 

const CLIENT_ID = process.env.CLIENT_ID;

exports.signOut = async (event) => {
    const { accessToken } = JSON.parse(event.body);

    const params = {
        AccessToken: accessToken,
    };
    
    try {
        const command = new GlobalSignOutCommand(params);
        // const response = await client.send(command);

        return{
            statusCode: 200,
            body: JSON.stringify({
                message: 'User signed out successfully',
            })
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Error signing out user',
                error: error.message,
            })
        };
    }
};
