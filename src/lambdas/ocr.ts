import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Connect to your AWS Mumbai Region services
const textractClient = new TextractClient({ region: "ap-south-1" });
const dbClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);

const BUCKET_NAME = "nurscribe-uploads-shubham";
const TABLE_NAME = "nurscribe-cases";

export const handler = async (event: any) => {
  try {
    // 1. Get the Case ID sent by the frontend
    const body = JSON.parse(event.body);
    const caseId = body.caseId;
    const fileName = `${caseId}.jpg`;

    console.log(`Starting OCR (Handwriting Reading) for case: ${caseId}`);

    // 2. Ask Amazon Textract to read the image from S3
    const textractCommand = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: BUCKET_NAME,
          Name: fileName,
        },
      },
    });
    const textractResponse = await textractClient.send(textractCommand);

    // 3. Extract the actual words from the Textract response
    let extractedText = "";
    if (textractResponse.Blocks) {
      textractResponse.Blocks.forEach((block) => {
        if (block.BlockType === "LINE") {
          extractedText += block.Text + "\n";
        }
      });
    }

    console.log("Successfully extracted text. Length:", extractedText.length);

    // 4. Save the extracted text to your DynamoDB Ledger
    const dbCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        caseId: caseId,
        createdAt: new Date().toISOString(),
        status: "OCR_COMPLETED",
        s3Key: fileName,
        ocrText: extractedText,
      },
    });
    await docClient.send(dbCommand);

    // 5. Tell the frontend it was successful!
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Handwriting successfully read and saved!",
        caseId: caseId
      }),
    };

  } catch (error) {
    console.error("OCR Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process image with Textract" }),
    };
  }
};