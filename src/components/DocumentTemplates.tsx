import { useMemo, useState, type ChangeEvent } from 'react'
import { isSubscribed, isSubscriptionError } from '../auth/subscription'
import { useAuth } from '../auth/AuthContext'
import {
  templateDownloadUrl,
  useDeleteTemplate,
  useTemplateCatalog,
  useTemplatePlaceholders,
  useUploadTemplate,
} from '../api/templates'
import type { UploadedTemplate } from '../types'
import {
  buttonSecondaryClass,
  buttonSmallDangerClass,
  buttonSmallSecondaryClass,
  extractErrorMessage,
  formatBytes,
  formatDateTime,
} from '../utils'
import { ErrorBanner } from './ErrorBanner'
import { Spinner } from './Spinner'
import Paywall from '../pages/Paywall'

interface TemplateRow {
  key: string
  label: string
  template: UploadedTemplate
}

export function DocumentTemplates() {
  const { user } = useAuth()
  const subscribed = isSubscribed(user)
  const catalog = useTemplateCatalog(subscribed)
  const placeholders = useTemplatePlaceholders(subscribed)
  const uploadTemplate = useUploadTemplate()
  const deleteTemplate = useDeleteTemplate()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPlaceholders, setShowPlaceholders] = useState(false)
  const [paywall, setPaywall] = useState(false)

  const rows = useMemo<TemplateRow[]>(
    () =>
      (catalog.data ?? []).flatMap((entry) =>
        entry.templates.map((template) => ({
          key: `${template.template_type}:${template.group.id}`,
          label: entry.label,
          template,
        })),
      ),
    [catalog.data],
  )

  const multiGroup = (user?.groups?.length ?? 0) > 1

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, row: TemplateRow) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setErrors((previous) => ({ ...previous, [row.key]: '' }))
    uploadTemplate.mutate(
      { templateType: row.template.template_type, file, groupId: row.template.group.id },
      {
        onSuccess: () => setErrors((previous) => ({ ...previous, [row.key]: '' })),
        onError: (err) => {
          if (isSubscriptionError(err)) {
            setPaywall(true)
            return
          }
          setErrors((previous) => ({ ...previous, [row.key]: extractErrorMessage(err, 'Failed to upload template') }))
        },
      },
    )
  }

  const handleRemove = (row: TemplateRow) => {
    if (!row.template.id) return
    if (
      !window.confirm(
        `Remove the ${row.label} template for ${row.template.group.name}? Any uploaded file will be deleted.`,
      )
    )
      return
    setErrors((previous) => ({ ...previous, [row.key]: '' }))
    deleteTemplate.mutate(row.template.id, {
      onSuccess: () => setErrors((previous) => ({ ...previous, [row.key]: '' })),
      onError: (err) => {
        if (isSubscriptionError(err)) {
          setPaywall(true)
          return
        }
        setErrors((previous) => ({ ...previous, [row.key]: extractErrorMessage(err, 'Failed to remove template') }))
      },
    })
  }

  if (paywall || !subscribed || isSubscriptionError(catalog.error)) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Document Templates</h2>
        <div className="mt-3">
          <Paywall />
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Document Templates</h2>
      <p className="mt-2 text-sm text-gray-500">
        Upload a .docx template for each document type to generate a filled document for any offender.
      </p>

      {catalog.isLoading ? (
        <Spinner label="Loading templates…" />
      ) : catalog.isError ? (
        <div className="mt-3">
          <ErrorBanner message={extractErrorMessage(catalog.error, 'Failed to load templates')} />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No document templates available for your account.</p>
      ) : (
        <div className="mt-3 divide-y divide-gray-200">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{row.label}</p>
                {multiGroup && <p className="text-xs text-gray-500">{row.template.group.name}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  {row.template.uploaded
                    ? `${row.template.file_name} · ${formatBytes(row.template.file_size ?? 0)} · ${formatDateTime(row.template.edited)}`
                    : 'Not uploaded'}
                </p>
                {errors[row.key] && (
                  <div className="mt-2">
                    <ErrorBanner message={errors[row.key]} onDismiss={() => setErrors((previous) => ({ ...previous, [row.key]: '' }))} />
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <input
                  id={`template-file-${row.key}`}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  disabled={uploadTemplate.isPending}
                  onChange={(event) => handleFileChange(event, row)}
                />
                <label
                  htmlFor={`template-file-${row.key}`}
                  className={`${buttonSecondaryClass} cursor-pointer ${uploadTemplate.isPending ? 'opacity-50' : ''}`}
                >
                  Upload .docx
                </label>
                {row.template.uploaded && row.template.id && (
                  <>
                    <a href={templateDownloadUrl(row.template.id)} className={buttonSmallSecondaryClass}>
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemove(row)}
                      disabled={deleteTemplate.isPending}
                      className={buttonSmallDangerClass}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-gray-200 pt-3">
        <button
          type="button"
          onClick={() => setShowPlaceholders((open) => !open)}
          aria-expanded={showPlaceholders}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-600"
        >
          <span aria-hidden="true" className="text-[10px]">
            {showPlaceholders ? '▼' : '▶'}
          </span>
          Available fields
        </button>
        {placeholders.isError && (
          <div className="mt-2">
            <ErrorBanner message={extractErrorMessage(placeholders.error, 'Failed to load available fields')} />
          </div>
        )}
        {showPlaceholders && (
          <ul className="mt-2 grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {(placeholders.data ?? []).map((placeholder) => (
              <li key={placeholder.name} className="text-xs text-gray-600">
                <code className="font-mono text-gray-800">{`{{${placeholder.name}}}`}</code> — {placeholder.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
