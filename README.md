# Serverless Video Streams POC

This is a simple proof-of-concept showing how to set up a serverless infrastructure for automatically converting MP4 videos into a HLS video stream (m3u8) with support for multiple different frame rates.


# Architecture

<p align="center"><img src=".github/stack.png" alt="Cloudformation diagram" height="350" /></p>

1. User drops MP4 file in the directory `input/` in the S3 bucket.
2. This will trigger a Lambda called `convert` that A) initiates a MediaConvert job and B) saves a record in DynamoDB with `conversionStatus = created` and with a `streamUrl` defined.
3. MediaConvert will trigger multiple events along the way that get sent to a SNS topic.
4. A Lambda called `updateDatabase` is subscribed to this SNS topic, and will update the `conversionStatus` value in DynamoDB for the video.
5. MediaConvert finishes the conversion and places all streaming assets (m3u8 files and stream chunks for multiple bitrates0 in the `output/` directory in the S3 bucket.
6. This `output/` directory of the bucket is publicly accessible via CloudFront. The URL for the CloudFront-hosted `m3u8` stream entrypoint can be retrieved from DynamoDB.


# Details

## Video quality
The stream is stored with various sizes/quality settings. More can be added in `src/utils/videoConfig.js`:

```js
const outputProfiles = {
    // View full list here:
    // https://eu-west-1.console.aws.amazon.com/mediaconvert/home?region=eu-west-1#/presets/list
    // (choose 'System presets' instead of 'Custom presets')
    '/1080p': 'System-Avc_16x9_1080p_29_97fps_8500kbps',
    '/720p': 'System-Avc_16x9_720p_29_97fps_3500kbps',
    '/480p': 'System-Avc_4x3_480p_29_97fps_600kbps'
};
```

The video player will automatically detect these and choose the one that best suits the user's network speed.


## Segment length & other HSL settings
These can be customized in the same `videoConfig.js` file. Might be interesting to play around with segment length, which is currently set to 4 seconds. Apple seems to recommend 6 seconds, but this creates rather big files (around 9MB per segment at 1080p quality).

```js
const hlsSettings = {
    ManifestDurationFormat: 'INTEGER',
    SegmentLength: 4,
    TimedMetadataId3Period: 10,
    CaptionLanguageSetting: 'OMIT',
    TimedMetadataId3Frame: 'PRIV',
    CodecSpecification: 'RFC_4281',
    OutputSelection: 'MANIFESTS_AND_SEGMENTS',
    ProgramDateTimePeriod: 600,
    MinSegmentLength: 0,
    DirectoryStructure: 'SINGLE_DIRECTORY',
    ProgramDateTime: 'EXCLUDE',
    SegmentControl: 'SEGMENTED_FILES',
    ManifestCompression: 'NONE',
    ClientCache: 'ENABLED',
    StreamInfResolution: 'INCLUDE'
};
```


## Testing video stream

There are several test-players that can be used to verify a HLS stream is functional, like [this one from Castr](https://castr.io/hlsplayer).

You can use this stream URL to test with: `https://d2e4qh30w42wts.cloudfront.net/0dc46851-a7d3-40ab-9e9e-25e367ed3f2c.m3u8`


# Deploying to your own AWS account

1. Run `yarn`
2. Run `yarn deploy`

This will create all necessary pieces of the architecture. 

_Note: since this includes a Cloudfront distribution, the first deploy might take up to 15 minutes. Subsequent ones should take less than a minute._