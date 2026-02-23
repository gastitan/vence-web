/** Rule type for due-date calculation (form/UI) */
export type RuleType = 'FixedDay' | 'Range'

/** Weekday preference (0 = Sunday, 6 = Saturday) */
export type PreferredWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** RANGE rule: closing window + offset + optional preferred weekday */
export interface RuleRange {
  type: 'RANGE'
  closingRangeStart: number
  closingRangeEnd: number
  dueOffsetDays: number
  preferredWeekday?: number
}

/** FIXED rule: single day of month */
export interface RuleFixed {
  type: 'FIXED'
  day: number
}

/** Rule sent to backend (discriminated union) */
export type PreviewRule = RuleRange | RuleFixed

/** Request body for POST /api/v1/preview */
export interface PreviewRequest {
  rule: PreviewRule
  referenceDate: string
  months: number
}

/** Request body for POST /api/v1/calculate */
export interface CalculateRequest {
  rule: PreviewRule
  referenceDate: string
  months: number
}

/** Engine response shape */
export interface DueResult {
  dueDate: string
  isEstimated: boolean
  confidence: number
}

/** Single item in timeline (date + result) */
export interface TimelineItem {
  dueDate: string
  isEstimated: boolean
  confidence: number
}

/** Validation error from backend */
export interface ValidationError {
  path?: string
  message: string
}

/** Single result from POST /preview */
export interface PreviewResultItem {
  calculatedDate: string
  isEstimated: boolean
  confidence: number
}

/** Response from POST /api/v1/preview */
export interface PreviewResponse {
  results: PreviewResultItem[]
}
