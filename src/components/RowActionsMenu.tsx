import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils'

export interface RowAction {
  label: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
}

const MENU_GAP = 4
const VIEWPORT_MARGIN = 8

export function RowActionsMenu({ ariaLabel, actions }: { ariaLabel: string; actions: RowAction[] }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRectRef = useRef<DOMRect | null>(null)

  const close = () => {
    setOpen(false)
    setCoords(null)
    triggerRectRef.current = null
  }

  const toggle = () => {
    if (open) {
      close()
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    triggerRectRef.current = rect
    setCoords(null)
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open || !menuRef.current) return
    const rect = triggerRectRef.current
    const menu = menuRef.current
    if (!rect) return
    const menuWidth = menu.offsetWidth
    const menuHeight = menu.offsetHeight
    const opensBelow = rect.bottom + MENU_GAP + menuHeight <= window.innerHeight
    const top = opensBelow ? rect.bottom + MENU_GAP : Math.max(VIEWPORT_MARGIN, rect.top - MENU_GAP - menuHeight)
    const left = Math.min(rect.right - menuWidth, Math.max(VIEWPORT_MARGIN, window.innerWidth - menuWidth - VIEWPORT_MARGIN))
    setCoords({ top, left })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      close()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const handleScroll = () => close()
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [open])

  const menuStyle: CSSProperties | undefined = coords ? { top: coords.top, left: coords.left } : undefined

  return (
    <div className="inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ⋮
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className={cn(
              'fixed z-50 min-w-[13rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg',
              !coords && 'invisible',
            )}
            style={menuStyle}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                onClick={() => {
                  close()
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
          </div>,
          document.body,
        )}
    </div>
  )
}
