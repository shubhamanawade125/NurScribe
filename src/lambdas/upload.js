"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
// Connect to your AWS Mumbai Region
const s3Client = new client_s3_1.S3Client({ region: "ap-south-1" });
const BUCKET_NAME = "nurscribe-uploads-shubham";
const handler = async (event) => {
    try {
        // 1. Generate a unique ID for this patient case
        const caseId = (0, uuid_1.v4)();
        const fileName = `${caseId}.jpg`;
        // 2. Prepare the instructions for S3
        const command = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            ContentType: "image/jpeg"
        });
        // 3. Get the "Pre-signed URL" (The temporary 5-minute VIP pass)
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 300 });
        // 4. Send the URL and Case ID back to the frontend
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Allows your web app to talk to this API
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                message: "Upload URL generated successfully",
                uploadUrl: uploadUrl,
                caseId: caseId
            }),
        };
    }
    catch (error) {
        console.error("Error generating upload URL:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to generate upload URL" }),
        };
    }
};
exports.handler = handler;
