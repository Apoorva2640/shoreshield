export interface ReportItem {
  id: string;
  Title: string;
  Lat: string;
  Lng: string;
  Category: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  credibility: number;
  aiHazard: string;
  aiLocation: string;
  type: "report" | "social";
  placeName: string;
  createdAt?: string;
  reason?: string;           
  isSocialSignal?: boolean;  
}

export interface AIAnalysis {
  hazard: string;
  severity: string;
  confidence: number;
  location: string;
  isSocialSignal: boolean;
  reason: string;            
}