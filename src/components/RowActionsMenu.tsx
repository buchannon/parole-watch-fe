import { useEffect, useRef, useState } from 'react'
import { cn } from '../utils'

export interface RowAction {
  label: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
}

export function RowActionsMenu({ ariaLabel, actions }: { ariaLabel: string; actions: RowAction[] }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((open) => !open)}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ⋮
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 min-w-[13rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false)
                action.onClick?.()
              }}
              className={cn(
                'block w-full px-3 py-2 text-left text-sm disabled:cursor-not-allowed',
                action.danger ? 'text-red-700' : 'text-gray-700',
                action.disabled ? 'text-gray-400' : 'hover:bg-gray-50',
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
