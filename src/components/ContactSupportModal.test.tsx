import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as supportApi from '../api/support'
import type { SupportResponse } from '../api/support'
import { ContactSupportModal } from './ContactSupportModal'

vi.mock('../api/support', () => ({
  useSendSupportRequest: vi.fn(),
}))

const mockUseSendSupportRequest = vi.mocked(supportApi.useSendSupportRequest)

function mockMutation(overrides: Record<string, unknown> = {}): any {
  return { mutate: vi.fn(), isPending: false, error: null, ...overrides }
}

const supportResponse: SupportResponse = { id: 'req-1', detail: 'Your support request has been sent.' }

function renderModal(mutation = mockMutation()) {
  mockUseSendSupportRequest.mockReturnValue(mutation)
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const onClose = vi.fn()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ContactSupportModal onClose={onClose} />
    </QueryClientProvider>,
  )
  return { utils, onClose, mutation }
}

describe('ContactSupportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the label, description, textarea and Cancel/Send buttons', () => {
    renderModal()
    expect(screen.getByRole('dialog', { name: 'Contact support' })).toBeInTheDocument()
    expect(screen.getByLabelText('How can we help?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('closes when Cancel is clicked', () => {
    const { onClose } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('submits the trimmed message through the mutation', () => {
    const { mutation } = renderModal()
    fireEvent.change(screen.getByLabelText('How can we help?'), {
      target: { value: '  I cannot see my offenders.  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(mutation.mutate).toHaveBeenCalledWith('I cannot see my offenders.', expect.anything())
  })

  it('does not submit an empty message', () => {
    const { mutation } = renderModal()
    fireEvent.change(screen.getByLabelText('How can we help?'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(mutation.mutate).not.toHaveBeenCalled()
  })

  it('shows a confirmation and Done closes the modal on success', async () => {
    const { mutation, onClose } = renderModal()
    mutation.mutate.mockImplementation((_message: string, opts?: { onSuccess?: (res: SupportResponse) => void }) => {
      opts?.onSuccess?.(supportResponse)
    })
    fireEvent.change(screen.getByLabelText('How can we help?'), {
      target: { value: 'I need help.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Message sent' })).toBeInTheDocument())
    expect(screen.getByText(/Your message has been sent/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders an error banner when the request fails', async () => {
    const { mutation } = renderModal()
    mutation.mutate.mockImplementation((_message: string, opts?: { onError?: (err: unknown) => void }) => {
      opts?.onError?.({ isAxiosError: true, response: { status: 500, data: { detail: 'boom' } } })
    })
    fireEvent.change(screen.getByLabelText('How can we help?'), {
      target: { value: 'I need help.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText(/detail: boom/)).toBeInTheDocument()
  })

  it('disables Send and shows Sending… while pending', () => {
    const { mutation } = renderModal(mockMutation({ isPending: true }))
    const sendButton = screen.getByRole('button', { name: 'Sending…' })
    expect(sendButton).toBeDisabled()
    expect(mutation.mutate).not.toHaveBeenCalled()
  })
})
