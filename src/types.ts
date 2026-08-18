export type OffenderStatus = 'In Parole Review' | 'Not in Parole Review' | 'Unknown'

export interface AuthUser {
  username: string
  email: string
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
  parole_details_url: string
  visitation_eligible: string
  status: OffenderStatus
}

export interface OffenderStatusHistoryItem {
  id: string
  status: OffenderStatus
  created: string
  edited: string
}

export interface Subscriber {
  id: string
  name: string
  email: string
  is_active: boolean
  created: string
}

export interface OffenderFilters {
  q?: string
  status?: string
  active?: string
}
