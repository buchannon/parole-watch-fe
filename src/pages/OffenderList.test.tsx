import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as bulkImportApi from '../api/bulkImport'
import * as offendersApi from '../api/offenders'
import * as templatesApi from '../api/templates'
import type { Offender, TemplateTypeEntry } from '../types'
import OffenderList from './OffenderList'

vi.mock('../api/offenders', () => ({
  useOffenders: vi.fn(),
  useOffender: vi.fn(),
  useOffenderStatuses: vi.fn(),
  useCreateOffender: vi.fn(),
  useUnfollowOffender: vi.fn(),
}))

vi.mock('../api/bulkImport', () => ({
  useCreateBulkImport: vi.fn(),
  useBulkImportJob: vi.fn(),
}))

vi.mock('../api/templates', () => ({
  useTemplateCatalog: vi.fn(),
  templateGenerateUrl: vi.fn(),
  triggerDownload: vi.fn(),
}))

vi.mock('./Paywall', () => ({
  default: () => <div>paywall-stub</div>,
}))

const mockUseOffenders = vi.mocked(offendersApi.useOffenders)
const mockUseCreateOffender = vi.mocked(offendersApi.useCreateOffender)
const mockUseUnfollowOffender = vi.mocked(offendersApi.useUnfollowOffender)
const mockUseCreateBulkImport = vi.mocked(bulkImportApi.useCreateBulkImport)
const mockUseBulkImportJob = vi.mocked(bulkImportApi.useBulkImportJob)
const mockUseTemplateCatalog = vi.mocked(templatesApi.useTemplateCatalog)
const mockTemplateGenerateUrl = vi.mocked(templatesApi.templateGenerateUrl)
const mockTriggerDownload = vi.mocked(templatesApi.triggerDownload)

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

function templateCatalog(uploaded: Partial<Record<'LETTER_OF_REPRESENTATION' | 'FEE_AFFIDAVIT', boolean>> = {}): TemplateTypeEntry[] {
  const lor = uploaded.LETTER_OF_REPRESENTATION ?? false
  const fee = uploaded.FEE_AFFIDAVIT ?? false
  return [
    {
      template_type: 'LETTER_OF_REPRESENTATION',
      label: 'Letter of Representation',
      templates: [
        {
          group: { id: 1, name: 'Test Group' },
          template_type: 'LETTER_OF_REPRESENTATION',
          label: 'Letter of Representation',
          uploaded: lor,
          ...(lor ? { id: 'tmpl-lor' } : {}),
        },
      ],
    },
    {
      template_type: 'FEE_AFFIDAVIT',
      label: 'Fee Affidavit',
      templates: [
        {
          group: { id: 1, name: 'Test Group' },
          template_type: 'FEE_AFFIDAVIT',
          label: 'Fee Affidavit',
          uploaded: fee,
          ...(fee ? { id: 'tmpl-fee' } : {}),
        },
      ],
    },
  ]
}

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

function rowNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('tbody tr')).map((row) => row.querySelector('a')?.textContent ?? '')
}

describe('OffenderList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOffenders.mockReturnValue(mockQueryResult())
    mockUseCreateOffender.mockReturnValue(mockMutation())
    mockUseUnfollowOffender.mockReturnValue(mockMutation())
    mockUseCreateBulkImport.mockReturnValue(mockMutation())
    mockUseBulkImportJob.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null } as any)
    mockUseTemplateCatalog.mockReturnValue(mockQueryResult({ data: templateCatalog() }))
    mockTemplateGenerateUrl.mockImplementation((type, id) => `/api/templates/${type}/generate/?offender=${id}`)
    mockTriggerDownload.mockReturnValue(undefined as never)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders active offender rows (In Review / Not in Review) and hides approved offenders', () => {
    renderList()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.queryByText('Alicia Ruiz')).not.toBeInTheDocument()
    expect(screen.getByText('00637060')).toBeInTheDocument()
    expect(screen.getByText('In Parole Review')).toBeInTheDocument()
    expect(screen.getByText('Not in Parole Review')).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'Follow new offender' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bulk follow' })).toBeInTheDocument()
  })

  it('opens the bulk import modal from the bulk follow button', () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: 'Bulk follow' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Bulk import offenders')
    expect(screen.getByLabelText('TDCJ numbers')).toBeInTheDocument()
  })

  it('shows an empty state when there are no offenders', () => {
    mockUseOffenders.mockReturnValue(mockQueryResult({ data: [] }))
    renderList()
    expect(screen.getByText('No offenders yet. Add one to start tracking.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Offenders approved for parole/ })).not.toBeInTheDocument()
  })

  it('renders the paywall when the offender query returns a subscription 403', () => {
    mockUseOffenders.mockReturnValue(
      mockQueryResult({
        data: undefined,
        isError: true,
        error: {
          isAxiosError: true,
          response: { status: 403, data: { detail: 'Your group subscription is not active.' } },
        },
      }),
    )
    renderList()
    expect(screen.getByText('paywall-stub')).toBeInTheDocument()
  })

  it('shows counts on the section toggles', () => {
    renderList()
    expect(screen.getByRole('heading', { name: /^Offenders$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Offenders in progress/ })).toHaveTextContent('2')
    expect(screen.getByRole('button', { name: /Offenders approved for parole/ })).toHaveTextContent('1')
  })

  it('keeps the approved section collapsed by default and expands it on click', () => {
    renderList()
    const toggle = screen.getByRole('button', { name: /Offenders approved for parole/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Alicia Ruiz')).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Alicia Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Approved', { selector: '.bg-green-100.text-green-800' })).toHaveTextContent('Approved')
  })

  it('keeps the main section expanded by default and collapses it on click', () => {
    renderList()
    const toggle = screen.getByRole('button', { name: /Offenders in progress/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('John Smith')).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('hides offenders with an unknown status', () => {
    const withUnknown: Offender[] = [
      ...offenders,
      { ...offenders[0], id: '4', display_name: 'Ghost Person', tdcj_number: '99999999', status: 'Unknown' },
    ]
    mockUseOffenders.mockReturnValue(mockQueryResult({ data: withUnknown }))
    renderList()
    expect(screen.queryByText('Ghost Person')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Offenders$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Offenders in progress/ })).toHaveTextContent('2')
  })

  it('shows a search-results count line', () => {
    vi.useFakeTimers()
    renderList()
    fireEvent.change(screen.getByLabelText('Search offenders'), { target: { value: 'jane' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.getByText('3 results for "jane"')).toBeInTheDocument()
  })

  it('does not send status or ordering filters and defaults to ascending next-review sort', () => {
    renderList()
    const filters = mockUseOffenders.mock.calls[0][0]
    expect(filters).toMatchObject({ active: 'true' })
    expect(filters).not.toHaveProperty('status')
    expect(filters).not.toHaveProperty('ordering')
    expect(screen.getByRole('columnheader', { name: /Next review/i })).toHaveAttribute('aria-sort', 'ascending')
    expect(screen.getByRole('columnheader', { name: /Name/i })).not.toHaveAttribute('aria-sort')
  })

  it('sorts the active table client-side on header clicks', () => {
    const { container } = renderList()
    const nameHeader = screen.getByRole('button', { name: /Name/i })
    expect(rowNames(container)).toEqual(['Jane Doe', 'John Smith'])

    fireEvent.click(nameHeader)
    expect(rowNames(container)).toEqual(['Jane Doe', 'John Smith'])
    expect(screen.getByRole('columnheader', { name: /Name/i })).toHaveAttribute('aria-sort', 'ascending')

    fireEvent.click(nameHeader)
    expect(rowNames(container)).toEqual(['John Smith', 'Jane Doe'])
    expect(screen.getByRole('columnheader', { name: /Name/i })).toHaveAttribute('aria-sort', 'descending')

    fireEvent.click(nameHeader)
    expect(rowNames(container)).toEqual(['Jane Doe', 'John Smith'])
  })

  it('sorts by next parole review date on header click', () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Next review/i }))
    expect(screen.getByRole('columnheader', { name: /Next review/i })).toHaveAttribute('aria-sort', 'descending')
    fireEvent.click(screen.getByRole('button', { name: /Next review/i }))
    expect(screen.getByRole('columnheader', { name: /Next review/i })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('keeps the approved table sort independent from the active table', () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Offenders approved for parole/ }))

    fireEvent.click(screen.getAllByRole('button', { name: /Name/i })[1])
    const nameHeaders = screen.getAllByRole('columnheader', { name: /Name/i })
    expect(nameHeaders[0]).not.toHaveAttribute('aria-sort')
    expect(nameHeaders[1]).toHaveAttribute('aria-sort', 'ascending')
  })

  it('opens the row kebab menu with download and unfollow actions', () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Actions for Jane Doe/ }))
    expect(screen.getByRole('menuitem', { name: /Download letter of representation/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Download fee affidavit/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Unfollow' })).toBeInTheDocument()
  })

  it('closes the kebab menu on Escape', () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Actions for Jane Doe/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('disables document download actions when no template is uploaded', () => {
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Actions for Jane Doe/ }))
    expect(screen.getByRole('menuitem', { name: /Download letter of representation/i })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: /Download fee affidavit/i })).toBeDisabled()
  })

  it('downloads the letter of representation when its template is uploaded', () => {
    mockUseTemplateCatalog.mockReturnValue(mockQueryResult({ data: templateCatalog({ LETTER_OF_REPRESENTATION: true }) }))
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Actions for Jane Doe/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Download letter of representation/i }))
    expect(mockTriggerDownload).toHaveBeenCalledWith('/api/templates/LETTER_OF_REPRESENTATION/generate/?offender=1')
  })

  it('downloads the fee affidavit when its template is uploaded', () => {
    mockUseTemplateCatalog.mockReturnValue(mockQueryResult({ data: templateCatalog({ FEE_AFFIDAVIT: true }) }))
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Actions for Jane Doe/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Download fee affidavit/i }))
    expect(mockTriggerDownload).toHaveBeenCalledWith('/api/templates/FEE_AFFIDAVIT/generate/?offender=1')
  })

  it('unfollows the offender after confirmation', () => {
    const mutation = mockMutation()
    mockUseUnfollowOffender.mockReturnValue(mutation)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Actions for Jane Doe/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Unfollow' }))
    expect(window.confirm).toHaveBeenCalled()
    expect(mutation.mutate).toHaveBeenCalledWith('1', expect.any(Object))
  })

  it('does not unfollow when confirmation is cancelled', () => {
    const mutation = mockMutation()
    mockUseUnfollowOffender.mockReturnValue(mutation)
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderList()
    fireEvent.click(screen.getByRole('button', { name: /Actions for Jane Doe/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Unfollow' }))
    expect(mutation.mutate).not.toHaveBeenCalled()
  })
})
