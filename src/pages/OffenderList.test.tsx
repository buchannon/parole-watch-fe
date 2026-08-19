import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
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
    next_parole_review_date: '2027-03-01',
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
    last_parole_decision: 'denied',
    last_parole_decision_date: '2026-01-15',
    last_parole_decision_note: 'NEXT REVIEW (12/2026)- Deny favorable parole action.',
    denial_reasons: '1D, 3D, 5D',
  },
  {
    id: '2',
    display_name: 'John Smith',
    tdcj_number: '01234567',
    status: 'Not in Parole Review',
    parole_eligibility_date: null,
    next_parole_review_date: null,
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
    last_parole_decision: '',
    last_parole_decision_date: null,
    last_parole_decision_note: '',
    denial_reasons: '',
  },
  {
    id: '3',
    display_name: 'Alicia Ruiz',
    tdcj_number: '05678901',
    status: 'Approved',
    parole_eligibility_date: null,
    next_parole_review_date: null,
    is_active: true,
    race: '',
    gender: '',
    age: null,
    profile_url: '',
    date_last_scraped: null,
    sid_number: 'SID3',
    max_sentence_date: null,
    current_facility: '',
    projected_release_date: null,
    parole_details_url: '',
    visitation_eligible: '',
    last_parole_decision: 'approved',
    last_parole_decision_date: null,
    last_parole_decision_note: '',
    denial_reasons: '',
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
    expect(screen.getByText('Alicia Ruiz')).toBeInTheDocument()
    expect(screen.getByText('00637060')).toBeInTheDocument()
    expect(screen.getByText('In Parole Review')).toBeInTheDocument()
    expect(screen.getByText('Not in Parole Review')).toBeInTheDocument()
    expect(screen.getByText('Alicia Ruiz')).toBeInTheDocument()
    expect(
      screen.getByText('Approved', { selector: '.bg-green-100.text-green-800' }),
    ).toHaveTextContent('Approved')
  })

  it('renders the next parole review date as month/year and a dash when unknown', () => {
    renderList()
    expect(screen.getByText('03/2027')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('columnheader', { name: /Next review/i })).toBeInTheDocument()
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

  it('sorts by status ascending by default so approved offenders are on top', () => {
    renderList()
    expect(mockUseOffenders.mock.calls[0][0]).toMatchObject({ ordering: 'status' })
    expect(screen.getByRole('columnheader', { name: /Status/i })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('toggles between sortable columns on header clicks', () => {
    renderList()
    const nameHeader = screen.getByRole('button', { name: /Name/i })
    fireEvent.click(nameHeader)
    expect(mockUseOffenders).toHaveBeenLastCalledWith(expect.objectContaining({ ordering: 'display_name' }))
    fireEvent.click(nameHeader)
    expect(mockUseOffenders).toHaveBeenLastCalledWith(expect.objectContaining({ ordering: '-display_name' }))
    fireEvent.click(screen.getByRole('button', { name: /TDCJ #/i }))
    expect(mockUseOffenders).toHaveBeenLastCalledWith(expect.objectContaining({ ordering: 'tdcj_number' }))
  })

  it('sorts by next parole review date on header click', () => {
    renderList()
    const reviewHeader = screen.getByRole('button', { name: /Next review/i })
    fireEvent.click(reviewHeader)
    expect(mockUseOffenders).toHaveBeenLastCalledWith(expect.objectContaining({ ordering: 'next_parole_review_date' }))
    fireEvent.click(reviewHeader)
    expect(mockUseOffenders).toHaveBeenLastCalledWith(expect.objectContaining({ ordering: '-next_parole_review_date' }))
  })
})
