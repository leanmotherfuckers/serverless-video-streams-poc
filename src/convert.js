const AWS = require('aws-sdk');
const mediaconvert = new AWS.MediaConvert({ apiVersion: '2017-08-29' });
const database = new AWS.DynamoDB.DocumentClient();
const { v4: uuid } = require('uuid');

const { inputSettings, hlsSettings, outputProfiles } = require('./utils/videoConfig');
const { MEDIA_CONVERT_ROLE, DYNAMODB_TABLE, CLOUDFRONT_DOMAIN } = process.env;

exports.handler = async(event) => {
    // Prep the conversion the job
    const videoId = uuid();
    const job = await createJob(event, videoId);
    const data = {
        conversionStatus: 'created',
        streamingUrl: `https://${CLOUDFRONT_DOMAIN}/${videoId}.m3u8`
    };

    // Set Mediaconvert endpoint & queue
    let { Endpoints } = await mediaconvert.describeEndpoints({ MaxResults: 0, }).promise();
    mediaconvert.endpoint = Endpoints[0].Url;
    let queue = await mediaconvert.getQueue({ Name: 'Default' }).promise();
    job.Queue = queue.Queue.Arn;

    // Send job to Mediaconvert
    try {
        const result = await mediaconvert.createJob(job).promise();
        console.log('Job created! ', result);
        data.conversionLog = JSON.stringify(result);
    } catch (error) {
        data.conversionStatus = 'failed';
        data.conversionLog = error.toString();
    }

    // Save DynamoDB database record
    await storeInDatabase(videoId, data);

    return 'done';
};

const storeInDatabase = (videoId, data) => {
    // Create a database record
    return database.put({
        TableName: DYNAMODB_TABLE,
        Item: {
            id: videoId,
            ...data
        }
    }).promise();
};

const createJob = (event, videoId) => {
    // Create the job with input and output configurations for HLS
    let bucket = event.Records[0].s3.bucket.name;
    let key = event.Records[0].s3.object.key;

    const output = {
        Name: 'HLS',
        Outputs: Object.entries(outputProfiles)
            .map(([NameModifier, Preset]) => ({ Preset, NameModifier })),
        OutputGroupSettings: {
            Type: 'HLS_GROUP_SETTINGS',
            HlsGroupSettings: {
                Destination: `s3://${bucket}/output/${videoId}`,
                ...hlsSettings
            }
        }
    };

    return {
        Queue: '',
        Role: MEDIA_CONVERT_ROLE,
        Settings: {
            OutputGroups: [output],
            AdAvailOffset: 0,
            Inputs: [{
                FileInput: 's3://' + bucket + '/' + key,
                ...inputSettings
            }],
            TimecodeConfig: {
                Source: 'EMBEDDED'
            }
        },
        UserMetadata: {
            videoId
        }
    };
};
