import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Connect to your AWS Mumbai Region
const s3Client = new S3Client({ region: "ap-south-1" });
const BUCKET_NAME = "nurscribe-uploads-shubham"; 

export const handler = async (event: any) => {
  try {
    // 1. Generate a unique ID for this patient case
    const caseId = uuidv4();
    const fileName = `${caseId}.jpg`;

    // 2. Prepare the instructions for S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      ContentType: "image/jpeg"
    });

    // 3. Get the "Pre-signed URL" (The temporary 5-minute VIP pass)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

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
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate upload URL" }),
    };
  }
};