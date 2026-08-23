import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as bulkImportApi from '../api/bulkImport'
import type { BulkImportJob } from '../types'
import { BulkImportModal } from './BulkImportModal'

vi.mock('../api/bulkImport', () => ({
  useCreateBulkImport: vi.fn(),
  useBulkImportJob: vi.fn(),
}))

const mockUseCreateBulkImport = vi.mocked(bulkImportApi.useCreateBulkImport)
const mockUseBulkImportJob = vi.mocked(bulkImportApi.useBulkImportJob)

const runningJob: BulkImportJob = {
  id: 'job-1',
  status: 'running',
  created: '2026-08-23T00:00:00Z',
  completed_at: null,
  summary: { added: 0, already_followed: 0, not_found: 0, failed: 0 },
  items: [
    { tdcj_number: '00637060', status: 'pending', detail: '' },
    { tdcj_number: '01234567', status: 'processing', detail: '' },
  ],
}

const completedJob: BulkImportJob = {
  id: 'job-1',
  status: 'completed',
  created: '2026-08-23T00:00:00Z',
  completed_at: '2026-08-23T00:00:10Z',
  summary: { added: 1, already_followed: 1, not_found: 1, failed: 1 },
  items: [
    { tdcj_number: '00637060', status: 'added', detail: '' },
    { tdcj_number: '00637061', status: 'already_followed', detail: '' },
    { tdcj_number: '01234567', status: 'not_found', detail: 'No offender found for TDCJ number 01234567.' },
    { tdcj_number: '05678901', status: 'failed', detail: 'Could not look up the TDCJ number; try again later.' },
  ],
}

function mockMutation(): any {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }
}

function mockQuery(data: BulkImportJob | null = null, overrides: Record<string, unknown> = {}): any {
  return { data, isLoading: !data, isError: false, error: null, ...overrides }
}

function renderModal(options: { job?: BulkImportJob | null; onSubscriptionError?: () => void } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  const mutate = vi.fn()
  const onClose = vi.fn()
  const onSubscriptionError = options.onSubscriptionError ?? vi.fn()
  mockUseCreateBulkImport.mockReturnValue({ ...mockMutation(), mutate })
  mockUseBulkImportJob.mockReturnValue(mockQuery(options.job ?? null))

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <BulkImportModal onClose={onClose} onSubscriptionError={onSubscriptionError} />
    </QueryClientProvider>,
  )
  return { utils, mutate, onClose, onSubscriptionError, invalidateSpy, queryClient }
}

describe('BulkImportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('counts valid numbers and dropped entries while typing', () => {
    renderModal()
    const textarea = screen.getByLabelText('TDCJ numbers')
    fireEvent.change(textarea, { target: { value: '00637060, 01234567\nbad, 00637060' } })
    expect(screen.getByText('2 valid numbers · 2 entries ignored (not 8 digits or duplicate)')).toBeInTheDocument()
  })

  it('disables Continue until at least one valid number is entered', () => {
    renderModal()
    const textarea = screen.getByLabelText('TDCJ numbers')
    const continueButton = screen.getByRole('button', { name: 'Continue' })
    expect(continueButton).toBeDisabled()
    fireEvent.change(textarea, { target: { value: '00637060' } })
    expect(continueButton).toBeEnabled()
  })

  it('shows the numbers to import on the confirmation step', () => {
    renderModal()
    fireEvent.change(screen.getByLabelText('TDCJ numbers'), { target: { value: '00637060, 01234567' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText(/The following 2 TDCJ numbers will be imported/)).toBeInTheDocument()
    expect(screen.getByText('00637060')).toBeInTheDocument()
    expect(screen.getByText('01234567')).toBeInTheDocument()
  })

  it('starts the import and shows live progress', () => {
    const { mutate } = renderModal()
    fireEvent.change(screen.getByLabelText('TDCJ numbers'), { target: { value: '00637060, 01234567' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    mockUseBulkImportJob.mockReturnValue(mockQuery(runningJob))
    mutate.mockImplementation((_valid: string[], opts?: { onSuccess?: (job: BulkImportJob) => void }) => {
      opts?.onSuccess?.(runningJob)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Import 2' }))
    expect(mutate).toHaveBeenCalledWith(['00637060', '01234567'], expect.anything())
    expect(screen.getByText(/Importing 1 of 2…/)).toBeInTheDocument()
    expect(screen.getByText('Queued')).toBeInTheDocument()
    expect(screen.getByText('Importing…')).toBeInTheDocument()
  })

  it('renders processed items above queued items in the progress list', () => {
    const shuffledJob: BulkImportJob = {
      id: 'job-2',
      status: 'running',
      created: '2026-08-23T00:00:00Z',
      completed_at: null,
      summary: { added: 0, already_followed: 0, not_found: 0, failed: 0 },
      items: [
        { tdcj_number: '11111111', status: 'pending', detail: '' },
        { tdcj_number: '00637060', status: 'added', detail: '' },
        { tdcj_number: '22222222', status: 'pending', detail: '' },
        { tdcj_number: '01234567', status: 'processing', detail: '' },
      ],
    }
    const { mutate, utils } = renderModal()
    fireEvent.change(screen.getByLabelText('TDCJ numbers'), {
      target: { value: '00637060, 01234567, 11111111, 22222222' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    mockUseBulkImportJob.mockReturnValue(mockQuery(shuffledJob))
    mutate.mockImplementation((_valid: string[], opts?: { onSuccess?: (job: BulkImportJob) => void }) => {
      opts?.onSuccess?.(shuffledJob)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Import 4' }))

    const numbers = Array.from(utils.container.querySelectorAll('li span.font-mono')).map(
      (el) => el.textContent,
    )
    expect(numbers).toEqual(['00637060', '01234567', '11111111', '22222222'])
  })

  it('shows a grouped report and invalidates offender queries when completed', async () => {
    const { utils, mutate, onClose, onSubscriptionError, invalidateSpy, queryClient } = renderModal()
    fireEvent.change(screen.getByLabelText('TDCJ numbers'), { target: { value: '00637060, 00637061, 01234567, 05678901' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    mockUseBulkImportJob.mockReturnValue(mockQuery(runningJob))
    mutate.mockImplementation((_valid: string[], opts?: { onSuccess?: (job: BulkImportJob) => void }) => {
      opts?.onSuccess?.(runningJob)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Import 4' }))

    mockUseBulkImportJob.mockReturnValue(mockQuery(completedJob))
    utils.rerender(
      <QueryClientProvider client={queryClient}>
        <BulkImportModal onClose={onClose} onSubscriptionError={onSubscriptionError} />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(screen.getByText('Import finished.')).toBeInTheDocument())
    expect(screen.getByText('Added (1)')).toBeInTheDocument()
    expect(screen.getByText('Already followed (1)')).toBeInTheDocument()
    expect(screen.getByText('Not found (1)')).toBeInTheDocument()
    expect(screen.getByText('Failed (1)')).toBeInTheDocument()
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['offenders'] }))
  })

  it('shows an error banner when the create request fails', async () => {
    const { mutate } = renderModal()
    fireEvent.change(screen.getByLabelText('TDCJ numbers'), { target: { value: '00637060' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    mutate.mockImplementation((_valid: string[], opts?: { onError?: (err: unknown) => void }) => {
      opts?.onError?.({ isAxiosError: true, response: { status: 400, data: { detail: 'Group "X" is already following the maximum of 120 offenders.' } } })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Import 1' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('calls onSubscriptionError when the create request returns a subscription 403', async () => {
    const onSubscriptionError = vi.fn()
    const { mutate } = renderModal({ onSubscriptionError })
    fireEvent.change(screen.getByLabelText('TDCJ numbers'), { target: { value: '00637060' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    mutate.mockImplementation((_valid: string[], opts?: { onError?: (err: unknown) => void }) => {
      opts?.onError?.({ isAxiosError: true, response: { status: 403, data: { detail: 'Your group subscription is not active.' } } })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Import 1' }))
    await waitFor(() => expect(onSubscriptionError).toHaveBeenCalled())
  })
})
