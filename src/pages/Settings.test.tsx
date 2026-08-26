import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '../api/auth'
import * as billingApi from '../api/billing'
import * as templatesApi from '../api/templates'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import type { AuthUser, TemplateTypeEntry } from '../types'
import Settings from './Settings'

vi.mock('../api/auth', () => ({
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  meRequest: vi.fn(),
  useUpdateSettings: vi.fn(),
}))

vi.mock('../api/billing', () => ({
  useCreateCheckoutSession: vi.fn(),
  useCreateBillingPortalSession: vi.fn(),
}))

vi.mock('../api/templates', () => ({
  useTemplateCatalog: vi.fn(),
  useTemplatePlaceholders: vi.fn(),
  useUploadTemplate: vi.fn(),
  useDeleteTemplate: vi.fn(),
  templateDownloadUrl: vi.fn(),
}))

const mockUseUpdateSettings = vi.mocked(authApi.useUpdateSettings)
const mockUseCreateBillingPortalSession = vi.mocked(billingApi.useCreateBillingPortalSession)
const mockUseCreateCheckoutSession = vi.mocked(billingApi.useCreateCheckoutSession)
const mockUseTemplateCatalog = vi.mocked(templatesApi.useTemplateCatalog)
const mockUseTemplatePlaceholders = vi.mocked(templatesApi.useTemplatePlaceholders)
const mockUseUploadTemplate = vi.mocked(templatesApi.useUploadTemplate)
const mockUseDeleteTemplate = vi.mocked(templatesApi.useDeleteTemplate)
const mockTemplateDownloadUrl = vi.mocked(templatesApi.templateDownloadUrl)

const initialUser: AuthUser = {
  username: 'admin',
  email: 'admin@example.com',
  name: 'Admin',
  groups: ['Test Group'],
  group_settings: [{ name: 'Test Group', operating_state: 'TX', is_subscribed: true }],
  settings: {
    receive_email_alerts_for_offender_status_changes: true,
    receive_offender_summary_report: true,
  },
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
        file_name: 'letter.docx',
        file_size: 2048,
        edited: '2026-08-25T10:00:00Z',
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

const placeholders = [
  { name: 'name', label: 'Offender name' },
  { name: 'tdcj_number', label: 'TDCJ number' },
]

function mockQueryResult(data: unknown, overrides: Record<string, unknown> = {}): any {
  return { data, isLoading: false, isError: false, error: null, ...overrides }
}

function mockMutation(): any {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }
}

function renderSettings(user: AuthUser = initialUser) {
  const mutate = vi.fn()

  function Harness() {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(user)
    const value: AuthContextValue = {
      user: currentUser,
      isAuthenticated: Boolean(currentUser),
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: setCurrentUser,
      refreshUser: vi.fn().mockResolvedValue(user),
    }
    return (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthContext.Provider value={value}>
          <Settings />
        </AuthContext.Provider>
      </QueryClientProvider>
    )
  }

  mockUseUpdateSettings.mockReturnValue({
    mutate,
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  } as any)

  const portalMutate = vi.fn()
  mockUseCreateBillingPortalSession.mockReturnValue({
    mutate: portalMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  } as any)

  mockUseCreateCheckoutSession.mockReturnValue(mockMutation() as any)

  const uploadMutate = vi.fn()
  mockUseUploadTemplate.mockReturnValue({
    mutate: uploadMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  } as any)

  const deleteMutate = vi.fn()
  mockUseDeleteTemplate.mockReturnValue({
    mutate: deleteMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  } as any)

  mockUseTemplateCatalog.mockReturnValue(mockQueryResult(catalog))
  mockUseTemplatePlaceholders.mockReturnValue(mockQueryResult(placeholders))
  mockTemplateDownloadUrl.mockImplementation((id) => `/api/templates/${id}/`)

  render(<Harness />)
  return { mutate, portalMutate, uploadMutate, deleteMutate }
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('renders account details and the email alert toggles', () => {
    renderSettings()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /receive email alerts/i })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /weekly offender summary report/i })).toBeInTheDocument()
  })

  it('renders the operating state with its state flag below the group name', () => {
    renderSettings()
    expect(screen.getByText('Test Group')).toBeInTheDocument()
    expect(screen.getByText('Operating State: Texas')).toBeInTheDocument()
    expect(screen.getByAltText('Texas flag')).toHaveAttribute('src', '/flags/tx.svg')
  })

  it('omits the operating state when the group has no setting', () => {
    renderSettings({ ...initialUser, group_settings: [] })
    expect(screen.getByText('Test Group')).toBeInTheDocument()
    expect(screen.queryByText(/operating state/i)).not.toBeInTheDocument()
  })

  it('reflects the enabled setting and fires the mutation when toggled off', () => {
    const { mutate } = renderSettings()
    const toggle = screen.getByRole('switch', { name: /receive email alerts/i })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggle)

    expect(mutate).toHaveBeenCalledWith(
      { receive_email_alerts_for_offender_status_changes: false },
      expect.anything(),
    )
    expect(screen.getByRole('switch', { name: /receive email alerts/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('reflects the enabled summary report setting and fires the mutation when toggled off', () => {
    const { mutate } = renderSettings()
    const toggle = screen.getByRole('switch', { name: /weekly offender summary report/i })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggle)

    expect(mutate).toHaveBeenCalledWith(
      { receive_offender_summary_report: false },
      expect.anything(),
    )
    expect(screen.getByRole('switch', { name: /weekly offender summary report/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('reflects disabled settings on load', () => {
    renderSettings({
      ...initialUser,
      settings: {
        receive_email_alerts_for_offender_status_changes: false,
        receive_offender_summary_report: false,
      },
    })
    expect(screen.getByRole('switch', { name: /receive email alerts/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('switch', { name: /weekly offender summary report/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('shows the manage subscription button for a subscribed group', () => {
    renderSettings()
    expect(
      screen.getByRole('button', { name: /manage subscription & billing/i }),
    ).toBeInTheDocument()
  })

  it('hides the manage subscription button when unsubscribed', () => {
    renderSettings({
      ...initialUser,
      group_settings: [{ name: 'Test Group', operating_state: 'TX', is_subscribed: false }],
    })
    expect(
      screen.queryByRole('button', { name: /manage subscription & billing/i }),
    ).not.toBeInTheDocument()
  })

  it('redirects to the portal when manage subscription is clicked', () => {
    const { portalMutate } = renderSettings()
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { assign },
      writable: true,
    })

    fireEvent.click(screen.getByRole('button', { name: /manage subscription & billing/i }))

    expect(portalMutate).toHaveBeenCalledWith(undefined, expect.anything())
    const options = portalMutate.mock.calls[0][1]
    options.onSuccess({ url: 'https://billing.stripe.com/session/test' })
    expect(assign).toHaveBeenCalledWith('https://billing.stripe.com/session/test')
  })

  it('shows an error banner when opening billing management fails', async () => {
    const { portalMutate } = renderSettings()
    fireEvent.click(screen.getByRole('button', { name: /manage subscription & billing/i }))
    const options = portalMutate.mock.calls[0][1]
    options.onError(new Error('billing unconfigured'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  describe('document templates', () => {
    it('renders each document type with its upload state', () => {
      renderSettings()
      expect(screen.getByText('Letter of Representation')).toBeInTheDocument()
      expect(screen.getByText('Fee Affidavit')).toBeInTheDocument()
      expect(screen.getByText(/letter\.docx/)).toBeInTheDocument()
      expect(screen.getByText(/2 KB/)).toBeInTheDocument()
      expect(screen.getAllByText('Not uploaded')).toHaveLength(1)
    })

    it('shows the group name per row when the user belongs to multiple groups', () => {
      renderSettings({
        ...initialUser,
        groups: ['Test Group', 'Second Firm'],
        group_settings: [
          { name: 'Test Group', operating_state: 'TX', is_subscribed: true },
          { name: 'Second Firm', operating_state: 'CA', is_subscribed: true },
        ],
      })
      expect(screen.getAllByText('Test Group').length).toBeGreaterThan(1)
    })

    it('fires the upload mutation with type, file, and group when a file is picked', () => {
      const { uploadMutate } = renderSettings()
      const file = new File(['docx'], 'affidavit.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const input = screen.getAllByLabelText('Upload .docx')[1]
      fireEvent.change(input, { target: { files: [file] } })

      expect(uploadMutate).toHaveBeenCalledWith(
        { templateType: 'FEE_AFFIDAVIT', file, groupId: 1 },
        expect.anything(),
      )
    })

    it('links the download to the uploaded template URL', () => {
      renderSettings()
      const link = screen.getByRole('link', { name: 'Download' })
      expect(link).toHaveAttribute('href', '/api/templates/tmpl-1/')
    })

    it('removes the template after confirmation', () => {
      const { deleteMutate } = renderSettings()
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
      expect(window.confirm).toHaveBeenCalled()
      expect(deleteMutate).toHaveBeenCalledWith('tmpl-1', expect.anything())
    })

    it('does not remove without confirmation', () => {
      const { deleteMutate } = renderSettings()
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
      expect(deleteMutate).not.toHaveBeenCalled()
    })

    it('shows a field error banner when an upload fails', async () => {
      const { uploadMutate } = renderSettings()
      uploadMutate.mockImplementation((_input: unknown, opts?: { onError?: (err: unknown) => void }) => {
        opts?.onError?.({
          isAxiosError: true,
          response: { status: 400, data: { file: ['Only .docx template files are supported.'] } },
        })
      })
      fireEvent.change(screen.getAllByLabelText('Upload .docx')[1], {
        target: { files: [new File(['x'], 'bad.txt')] },
      })
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent('file: Only .docx template files are supported.'),
      )
    })

    it('shows the paywall in the templates section when unsubscribed', () => {
      renderSettings({
        ...initialUser,
        group_settings: [{ name: 'Test Group', operating_state: 'TX', is_subscribed: false }],
      })
      expect(screen.getByText('Your subscription is inactive')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument()
    })

    it('expands the available fields list to show placeholders', () => {
      renderSettings()
      const toggle = screen.getByRole('button', { name: /Available fields/i })
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      fireEvent.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('{{name}}')).toBeInTheDocument()
      expect(screen.getByText(/Offender name/)).toBeInTheDocument()
      expect(screen.getByText('{{tdcj_number}}')).toBeInTheDocument()
    })
  })
})
