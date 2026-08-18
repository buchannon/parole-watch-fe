import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as offendersApi from '../api/offenders'
import type { Offender } from '../types'
import OffenderList from './OffenderList'

vi.mock('../api/offenders', () => ({
  useOffenders: vi.fn(),
  useOffender: vi.fn(),
  useOffenderStatuses: vi.fn(),
  useCreateOffender: vi.fn(),
  useUnfollowOffender: vi.fn(),
}))

const mockUseOffenders = vi.mocked(offendersApi.useOffenders)
const mockUseCreateOffender = vi.mocked(offendersApi.useCreateOffender)
const mockUseUnfollowOffender = vi.mocked(offendersApi.useUnfollowOffender)

const offenders: Offender[] = [
  {
    id: '1',
    display_name: 'Jane Doe',
    tdcj_number: '00637060',
    status: 'In Parole Review',
    parole_eligibility_date: '2026-01-15',
    is_active: true,
    race: '',
    gender: '',
    age: 44,
    profile_url: '',
    date_last_scraped: null,
    sid_number: 'SID1',
    max_sentence_date: null,
    current_facility: '',
    projected_release_date: null,
    parole_details_url: '',
    visitation_eligible: '',
  },
  {
    id: '2',
    display_name: 'John Smith',
    tdcj_number: '01234567',
    status: 'Not in Parole Review',
    parole_eligibility_date: null,
    is_active: false,
    race: '',
    gender: '',
    age: null,
    profile_url: '',
    date_last_scraped: null,
    sid_number: 'SID2',
    max_sentence_date: null,
    current_facility: '',
    projected_release_date: null,
    parole_details_url: '',
    visitation_eligible: '',
  },
]

function mockQueryResult(overrides: Record<string, unknown> = {}): any {
  return { data: offenders, isLoading: false, isError: false, error: null, ...overrides }
}

function mockMutation(): any {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }
}

function renderList() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OffenderList />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OffenderList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOffenders.mockReturnValue(mockQueryResult())
    mockUseCreateOffender.mockReturnValue(mockMutation())
    mockUseUnfollowOffender.mockReturnValue(mockMutation())
  })

  it('renders offender rows with name, TDCJ number, and status badge', () => {
    renderList()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('00637060')).toBeInTheDocument()
    expect(screen.getByText('In Parole Review')).toBeInTheDocument()
    expect(screen.getByText('Not in Parole Review')).toBeInTheDocument()
    expect(screen.getByText('2026-01-15')).toBeInTheDocument()
  })

  it('shows the search box and add-offender button', () => {
    renderList()
    expect(screen.getByLabelText('Search offenders')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add offender' })).toBeInTheDocument()
  })

  it('shows an empty state when there are no offenders', () => {
    mockUseOffenders.mockReturnValue(mockQueryResult({ data: [] }))
    renderList()
    expect(screen.getByText('No offenders yet. Add one to start tracking.')).toBeInTheDocument()
  })
})
