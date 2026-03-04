# NurScribe — AI Clinical Bridge for Rural India
### AWS AI for Bharat Hackathon 2026 | Student Track | Problem 6

## 🏥 Problem
Rural patients discharged with handwritten English summaries 
that ASHA workers cannot read — causing 34% medication error rate.

## 💡 Solution
NurScribe converts handwritten discharge summaries into 
Marathi/Hindi instructions for ASHA workers automatically.

## 🔴 Live Demo
👉 http://nurscribe-frontend-shubham.s3-website.ap-south-1.amazonaws.com

## ☁️ AWS Services Used
- Amazon Textract — Handwriting OCR
- Amazon Bedrock (Meta Llama 3 70B) — Clinical AI Reasoning
- AWS Lambda — Serverless Backend
- Amazon S3 — Storage + Frontend Hosting
- Amazon DynamoDB — Case Records
- Amazon API Gateway — REST API
- FHIR R4 — ABDM Compliant Records

## 🔄 How It Works
Nurse scans paper → S3 → Textract OCR → Bedrock AI → 
Risk Score → ASHA Alert in Marathi → FHIR Record Created

## 📊 Impact
- 34% medication error rate addressed
- 1M+ ASHA workers can be reached
- Zero training needed — works on basic phones
