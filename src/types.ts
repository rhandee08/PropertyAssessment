export interface MarketKPIItem {
  id: string;
  kpi: string;
  acceptableRegion: string;
  measuredValue: string;
  meetsBenchmark: boolean;
  status: 'PASS' | 'FAIL' | 'WARNING';
  sourceTitle: string;
  sourceUrl: string;
  notes?: string;
}

export interface QuickMarketKPIItem {
  id: string;
  kpi: string;
  radius: string; // '5-Mile Radius'
  benchmark: string;
  measuredValue: string;
  meetsBenchmark: boolean;
  status: 'PASS' | 'FAVORABLE' | 'HEALTHY' | 'COMPETITIVE' | 'WARNING' | 'FAIL';
  sourceTitle: string;
  sourceUrl: string;
  notes?: string;
}

export interface MarketAssessmentResult {
  propertyAddress: string;
  assessedAt: string;
  city?: string;
  state?: string;
  zipCode?: string;
  overallScore: {
    passedCount: number;
    totalCount: number;
    summaryText: string;
    verdict: 'Viable' | 'Caution' | 'Unfavorable';
  };
  kpis: MarketKPIItem[];
  quickMarketView?: QuickMarketKPIItem[];
}

export interface GoogleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
