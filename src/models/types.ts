export interface CaseRecord {
  caseId: string;
  createdAt: string;
  status: string;
  s3Key: string;
  ocrText?: string;
  ocrConfidence?: number;
  requiresManualReview?: boolean;
  clinicalAnalysis?: any;
  riskAssessment?: any;
  fhirBundle?: string;
  outreachStatus?: string;
  auditTrail: any[];
}