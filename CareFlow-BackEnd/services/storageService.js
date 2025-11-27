import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION || 'us-east-1';
const ENDPOINT = process.env.S3_ENDPOINT || undefined; // e.g. http://localhost:9000 for MinIO
const ACCESS_KEY = process.env.S3_KEY;
const SECRET_KEY = process.env.S3_SECRET;

console.log('storageService config ->', { BUCKET, ENDPOINT, ACCESS_KEY: !!ACCESS_KEY, SECRET_KEY: !!SECRET_KEY });

if (!BUCKET || !ACCESS_KEY || !SECRET_KEY) {
    console.warn('storageService: S3_BUCKET / S3_KEY / S3_SECRET not set. Uploads will fail if used.');
}

const s3 = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    forcePathStyle: !!ENDPOINT, // required for MinIO
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
});

const uploadBuffer = async (key, buffer, contentType) => {
    const cmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    await s3.send(cmd);
    return key;
};

const getPresignedUrl = async (key, expiresIn = 600) => {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return await getSignedUrl(s3, cmd, { expiresIn });
};

const deleteObject = async (key) => {
    const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
    await s3.send(cmd);
    return true;
};

export default { uploadBuffer, getPresignedUrl, deleteObject };