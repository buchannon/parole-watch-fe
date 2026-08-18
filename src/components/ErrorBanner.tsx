export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <div className="flex items-start justify-between gap-3">
        <span className="whitespace-pre-line">{message}</span>
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="text-red-400 hover:text-red-600">
            ×
          </button>
        )}
      </div>
    </div>
  )
}
