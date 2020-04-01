const outputProfiles = {
    // View full list here:
    // https://eu-west-1.console.aws.amazon.com/mediaconvert/home?region=eu-west-1#/presets/list
    // (choose 'System presets' instead of 'Custom presets')
    '/1080p': 'System-Avc_16x9_1080p_29_97fps_8500kbps',
    '/720p': 'System-Avc_16x9_720p_29_97fps_3500kbps',
    '/480p': 'System-Avc_4x3_480p_29_97fps_600kbps'
};

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

const inputSettings = {
    AudioSelectors: {
        'Audio Selector 1': {
            Offset: 0,
            DefaultSelection: 'NOT_DEFAULT',
            ProgramSelection: 1,
            SelectorType: 'TRACK',
            Tracks: [1]
        }
    },
    VideoSelector: {
        ColorSpace: 'FOLLOW'
    },
    FilterEnable: 'AUTO',
    PsiControl: 'USE_PSI',
    FilterStrength: 0,
    DeblockFilter: 'DISABLED',
    DenoiseFilter: 'DISABLED',
    TimecodeSource: 'EMBEDDED'
};

module.exports = {
    outputProfiles,
    hlsSettings,
    inputSettings
};
