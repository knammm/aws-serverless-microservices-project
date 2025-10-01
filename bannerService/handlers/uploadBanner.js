const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
// Import the getSignedUrl function from the S3 request presigner package to generate pre-signed URLs
const {getSignedUrl} = require('@aws-sdk/s3-request-presigner'); 

const s3Client = new S3Client({ region: process.env.REGION });

exports.getUploadUrl = async (event) => {
    try {
        const bucketName = process.env.BUCKET_NAME;
        const {fileName, fileType} = JSON.parse(event.body);

        if (!fileName || !fileType){
            return {
                statusCode: 400,
                body: JSON.stringify({message: 'fileName and fileType are required'}),
            };
        }

        // Create a command to put an object in the specified S3 bucket
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            ContentType: fileType,
        });

        // Generate a pre-signed URL valid for 1 hour (3600 seconds)
        const signedUrl = await getSignedUrl(s3Client, command, {expiresIn: 3600});

        return {
            statusCode: 200,
            body: JSON.stringify({uploadUrl: signedUrl}),
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({message: 'Error generating upload URL'}),
        };
    }
}