export type OffenderStatus = 'In Parole Review' | 'Not in Parole Review' | 'Unknown'

export interface UserSettings {
  receive_email_alerts_for_offender_status_changes: boolean
  receive_offender_summary_report: boolean
}

export interface AuthUser {
  username: string
  email: string
  name: string
  groups: string[]
  settings: UserSettings
}

export interface Offender {
  id: string
  display_name: string
  race: string
  gender: string
  age: number | null
  profile_url: string
  is_active: boolean
  date_last_scraped: string | null
  sid_number: string
  tdcj_number: string
  max_sentence_date: string | null
  current_facility: string
  projected_release_date: string | null
  parole_eligibility_date: string | null
  next_parole_review_date: string | null
  parole_details_url: string
  visitation_eligible: string
  status: OffenderStatus
  last_parole_decision: string
  last_parole_decision_date: string | null
  last_parole_decision_note: string
  denial_reasons: string
}

export interface OffenderStatusHistoryItem {
  id: string
  status: OffenderStatus
  created: string
  edited: string
}

export interface OffenderFilters {
  q?: string
  status?: string
  active?: string
  ordering?: string
}
