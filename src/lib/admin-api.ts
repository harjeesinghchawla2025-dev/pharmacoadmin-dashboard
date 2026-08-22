/**
 * Admin data service.
 *
 * Single abstraction layer for all admin dashboard data. Today every getter
 * resolves to clearly-labelled development fallback data (`source: "mock"`).
 * When the MySQL-backed API exists, set VITE_ADMIN_API_URL and each getter
 * will fetch from it, falling back to the mock payload on failure.
 */

export type DataSource = "api" | "mock";

export interface Result<T> {
  data: T;
  source: DataSource;
  error?: string;
}

export interface AdminStats {
  users: number;
  patients: number;
  doctors: number;
  drugs: number;
  genes: number;
  variants: number;
  recommendations: number;
  prescriptions: number;
}

export interface CountItem {
  name: string;
  count: number;
}

export interface RecommendationRow {
  patient: string;
  drug: string;
  gene: string;
  variant: string;
  type: "Recommended" | "Avoid" | "Dose Adjustment" | "Alternative";
  recommendation: string;
  source: string;
  status: "Active" | "Draft" | "Archived";
}

export interface Guideline {
  consortium: "CPIC" | "DPWG";
  title: string;
  drug: string;
  genes: string[];
}

export const RECOMMENDATION_TYPES = [
  "Recommended",
  "Avoid",
  "Dose Adjustment",
  "Alternative",
] as const;

/* ------------------------------------------------------------------ */
/* Development fallback data (mirrors the current database snapshot)   */
/* ------------------------------------------------------------------ */

const MOCK_STATS: AdminStats = {
  users: 0,
  patients: 1,
  doctors: 0,
  drugs: 3762,
  genes: 25041,
  variants: 7615,
  recommendations: 1,
  prescriptions: 0,
};

const MOCK_RECOMMENDATIONS_BY_TYPE: CountItem[] = [
  { name: "Recommended", count: 0 },
  { name: "Avoid", count: 0 },
  { name: "Dose Adjustment", count: 0 },
  { name: "Alternative", count: 1 },
];

const MOCK_TOP_DRUGS: CountItem[] = [
  { name: "fluorouracil", count: 617 },
  { name: "methotrexate", count: 444 },
  { name: "opioids", count: 338 },
  { name: "cisplatin", count: 332 },
  { name: "cyclophosphamide", count: 330 },
  { name: "capecitabine", count: 326 },
  { name: "methadone", count: 290 },
  { name: "doxorubicin", count: 263 },
  { name: "antipsychotics", count: 254 },
  { name: "risperidone", count: 249 },
];

const MOCK_TOP_GENES: CountItem[] = [
  { name: "ABCB1", count: 885 },
  { name: "RYR1", count: 402 },
  { name: "DPYD", count: 385 },
  { name: "CYP3A4", count: 370 },
  { name: "CYP2D6", count: 369 },
  { name: "CYP2C19", count: 365 },
  { name: "OPRM1", count: 330 },
  { name: "SLCO1B1", count: 295 },
  { name: "CFTR", count: 285 },
  { name: "CYP2C9", count: 268 },
];

const MOCK_RECENT_RECOMMENDATIONS: RecommendationRow[] = [
  {
    patient: "TEST-P001",
    drug: "rosuvastatin",
    gene: "SLCO1B1",
    variant: "rs4149056",
    type: "Alternative",
    recommendation:
      "Consider an alternative statin or a reduced rosuvastatin dose; decreased SLCO1B1 function increases systemic exposure and myopathy risk.",
    source: "PharmGKB",
    status: "Active",
  },
];

const MOCK_GUIDELINES: Guideline[] = [
  {
    consortium: "CPIC",
    title: "Annotation of CPIC Guideline for rosuvastatin and ABCG2, SLCO1B1",
    drug: "rosuvastatin",
    genes: ["ABCG2", "SLCO1B1"],
  },
  {
    consortium: "DPWG",
    title: "Annotation of DPWG Guideline for rosuvastatin and SLCO1B1",
    drug: "rosuvastatin",
    genes: ["SLCO1B1"],
  },
];

/* ------------------------------------------------------------------ */
/* Transport                                                          */
/* ------------------------------------------------------------------ */

export const BASE_URL = (import.meta.env["VITE_ADMIN_API_URL"] as string | undefined) ?? "";

export const isApiConfigured = () => BASE_URL.length > 0;

async function get<T>(path: string, fallback: T): Promise<Result<T>> {
  if (!isApiConfigured()) {
    // Simulated latency so loading states are exercised during development.
    await new Promise((r) => setTimeout(r, 250));
    return { data: fallback, source: "mock" };
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return { data: (await res.json()) as T, source: "api" };
  } catch (err) {
    return {
      data: fallback,
      source: "mock",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export const adminApi = {
  getStats: () => get<AdminStats>("/admin/stats", MOCK_STATS),
  getRecommendationsByType: () =>
    get<CountItem[]>("/admin/analytics/recommendations-by-type", MOCK_RECOMMENDATIONS_BY_TYPE),
  getTopDrugs: () => get<CountItem[]>("/admin/analytics/top-drugs", MOCK_TOP_DRUGS),
  getTopGenes: () => get<CountItem[]>("/admin/analytics/top-genes", MOCK_TOP_GENES),
  getRecentRecommendations: () =>
    get<RecommendationRow[]>("/admin/recommendations/recent", MOCK_RECENT_RECOMMENDATIONS),
  getGuidelines: () => get<Guideline[]>("/admin/guidelines?drug=rosuvastatin", MOCK_GUIDELINES),
};

export interface DashboardData {
  stats: AdminStats;
  recommendationsByType: CountItem[];
  topDrugs: CountItem[];
  topGenes: CountItem[];
  recentRecommendations: RecommendationRow[];
  guidelines: Guideline[];
  source: DataSource;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [stats, byType, drugs, genes, recent, guidelines] = await Promise.all([
    adminApi.getStats(),
    adminApi.getRecommendationsByType(),
    adminApi.getTopDrugs(),
    adminApi.getTopGenes(),
    adminApi.getRecentRecommendations(),
    adminApi.getGuidelines(),
  ]);

  const results = [stats, byType, drugs, genes, recent, guidelines];

  return {
    stats: stats.data,
    recommendationsByType: byType.data,
    topDrugs: drugs.data,
    topGenes: genes.data,
    recentRecommendations: recent.data,
    guidelines: guidelines.data,
    source: results.every((r) => r.source === "api") ? "api" : "mock",
  };
}
