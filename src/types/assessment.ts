import type { HealthResult, UserProfile } from "./index";

export interface AssessmentInput {
  title: string;
  /** Calendar date in YYYY-MM-DD format, without a timezone conversion. */
  measuredAt: string;
  profile: UserProfile;
}

export interface Assessment extends AssessmentInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  result: HealthResult;
  /** Identifies the calculation and safety policy used for the stored snapshot. */
  formulaVersion: string;
}

export interface AssessmentList {
  items: Assessment[];
  total: number;
  page: number;
  pageSize: number;
}
