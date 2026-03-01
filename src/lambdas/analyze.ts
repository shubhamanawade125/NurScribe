import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

// Connect to your AWS Mumbai Region
const bedrockClient = new BedrockRuntimeClient({ region: "ap-south-1" });
const dbClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);

const TABLE_NAME = "nurscribe-cases";

export const handler = async (event: any) => {
  try {
    // 1. Get the Case ID
    const body = JSON.parse(event.body);
    const caseId = body.caseId;

    console.log(`Starting AI Analysis for case: ${caseId}`);

    // 2. Fetch the OCR text (Handwriting) from the database
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { caseId: caseId },
    });
    const dbRecord = await docClient.send(getCommand);
    
    if (!dbRecord.Item || !dbRecord.Item.ocrText) {
      return { statusCode: 400, body: JSON.stringify({ error: "No OCR text found for this case." }) };
    }

    const ocrText = dbRecord.Item.ocrText;

    // 3. Prepare the prompt for Claude 3.5 Sonnet v2
    const prompt = `You are NurScribe, an AI clinical triage assistant for rural India. 
    Analyze this handwritten discharge summary text:
    "${ocrText}"
    
    Perform the following tasks:
    1. Identify any sepsis risk markers based on standard Dakshata guidelines.
    2. Assign a risk score (Low, Medium, High).
    3. Generate simple, life-saving instructions for an ASHA worker in a vernacular context (English script, but simple terms).
    
    Output your response in strict JSON format with the keys: riskScore, sepsisMarkers, and ashaInstructions. Do not include any other text.`;

    // 4. Call Claude 3.5 Sonnet v2
    const bedrockCommand = new InvokeModelCommand({
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          { role: "user", content: prompt }
        ]
      }),
    });

    const bedrockResponse = await bedrockClient.send(bedrockCommand);
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    
    // Claude's response text
    const clinicalAnalysis = responseBody.content[0].text;
    console.log("Claude Analysis Complete!");

    // 5. Save the AI Analysis back to DynamoDB
    const updateCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...dbRecord.Item,
        status: "ANALYSIS_COMPLETED",
        clinicalAnalysis: JSON.parse(clinicalAnalysis), // Saving the JSON output
        updatedAt: new Date().toISOString()
      },
    });
    await docClient.send(updateCommand);

    // 6. Return success to the frontend
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Clinical analysis complete!",
        caseId: caseId,
        analysis: JSON.parse(clinicalAnalysis)
      }),
    };

  } catch (error) {
    console.error("Analysis Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to analyze with Claude" }) };
  }
};