import {APIGatewayProxyEvent, APIGatewayProxyResultV2, Context} from "aws-lambda";

const bucketName = process.env.PHOTO_BUCKET_NAME;

async function getPhotos(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResultV2> {
    return {
        statusCode: 200,
        body: 'test'
    }
}

export {getPhotos}
