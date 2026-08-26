import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as offendersApi from '../api/offenders'
import * as templatesApi from '../api/templates'
import type { Offender, TemplateTypeEntry } from '../types'
import OffenderDetail from './OffenderDetail'

vi.mock('../api/offenders', () => ({
  useOffender: vi.fn(),
  useOffenderStatuses: vi.fn(),
}))

vi.mock('../api/templates', () => ({
  useTemplateCatalog: vi.fn(),
  templateGenerateUrl: vi.fn(),
  triggerDownload: vi.fn(),
}))

vi.mock('./Paywall', () => ({
  default: () => <div>paywall-stub</div>,
}))

const mockUseOffender = vi.mocked(offendersApi.useOffender)
const mockUseOffenderStatuses = vi.mocked(offendersApi.useOffenderStatuses)
const mockUseTemplateCatalog = vi.mocked(templatesApi.useTemplateCatalog)
const mockTemplateGenerateUrl = vi.mocked(templatesApi.templateGenerateUrl)
const mockTriggerDownload = vi.mocked(templatesApi.triggerDownload)

const offender: Offender = {
  id: 'off-1',
  display_name: 'Jane Doe',
  race: 'White',
  gender: 'Female',
  age: 44,
  profile_url: 'https://offender.tdcj.texas.gov/profile/123',
  is_active: true,
  date_last_scraped: '2026-08-01',
  sid_number: 'SID1',
  tdcj_number: '00637060',
  max_sentence_date: '2030-01-15',
  current_facility: 'Some Unit',
  projected_release_date: '2029-01-15',
  parole_eligibility_date: '2026-01-15',
  next_parole_review_date: '2027-03-01',
  parole_details_url: 'https://offender.tdcj.texas.gov/details/123',
  visitation_eligible: 'Yes',
  status: 'In Parole Review',
  last_parole_decision: 'denied',
  last_parole_decision_date: '2026-01-15',
  last_parole_decision_note: '',
  denial_reasons: '',
}

const catalog: TemplateTypeEntry[] = [
  {
    template_type: 'LETTER_OF_REPRESENTATION',
    label: 'Letter of Representation',
    templates: [
      {
        group: { id: 1, name: 'Test Group' },
        template_type: 'LETTER_OF_REPRESENTATION',
        label: 'Letter of Representation',
        uploaded: true,
        id: 'tmpl-1',
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
        uploaded: false,
      },
    ],
  },
]

function mockQueryResult(data: unknown, overrides: Record<string, unknown> = {}): any {
  return { data, isLoading: false, isError: false, error: null, ...overrides }
}

function renderDetail(catalogResult?: any) {
  mockUseOffender.mockReturnValue(mockQueryResult(offender))
  mockUseOffenderStatuses.mockReturnValue(mockQueryResult([]))
  mockUseTemplateCatalog.mockReturnValue(catalogResult ?? mockQueryResult(catalog))
  mockTemplateGenerateUrl.mockImplementation((type, id) => `/api/templates/${type}/generate/?offender=${id}`)
  mockTriggerDownload.mockReturnValue(undefined as never)

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/offenders/off-1']}>
        <Routes>
          <Route path="/offenders/:id" element={<OffenderDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OffenderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a generate button only for uploaded template types', () => {
    renderDetail()
    expect(screen.getByRole('button', { name: 'Generate Letter of Representation' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Generate Fee Affidavit' })).not.toBeInTheDocument()
  })

  it('triggers the generated document download with the offender id', () => {
    renderDetail()
    fireEvent.click(screen.getByRole('button', { name: 'Generate Letter of Representation' }))
    expect(mockTemplateGenerateUrl).toHaveBeenCalledWith('LETTER_OF_REPRESENTATION', 'off-1')
    expect(mockTriggerDownload).toHaveBeenCalledWith('/api/templates/LETTER_OF_REPRESENTATION/generate/?offender=off-1')
  })

  it('shows a hint when no templates are uploaded', () => {
    renderDetail(
      mockQueryResult(
        catalog.map((entry) => ({
          ...entry,
          templates: entry.templates.map((template) => ({ ...template, uploaded: false })),
        })),
      ),
    )
    expect(screen.queryByRole('button', { name: /Generate/i })).not.toBeInTheDocument()
    expect(screen.getByText(/No document templates uploaded for your group/i)).toBeInTheDocument()
  })

  it('renders the paywall when the catalog query is a subscription 403', () => {
    renderDetail(
      mockQueryResult(undefined, {
        data: undefined,
        isError: true,
        error: {
          isAxiosError: true,
          response: { status: 403, data: { detail: 'Your group subscription is not active.' } },
        },
      }),
    )
    expect(screen.getByText('paywall-stub')).toBeInTheDocument()
  })
})
