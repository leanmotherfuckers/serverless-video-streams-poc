const AWS = require('aws-sdk');
const database = new AWS.DynamoDB.DocumentClient();

const { DYNAMODB_TABLE } = process.env;

exports.handler = async(event) => {
    const data = JSON.parse(event.Records[0].Sns.Message);
    console.log(JSON.stringify(event));

    await database.update({
        TableName: DYNAMODB_TABLE,
        Key: { id: data.detail.userMetadata.videoId },
        UpdateExpression: "set conversionStatus = :r",
        ExpressionAttributeValues: {
            ":r": data.detail.status.toLowerCase()
        },
        ReturnValues: "UPDATED_NEW"
    }).promise();

    return 'success';
};
