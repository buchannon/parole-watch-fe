import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface TurnstileHandle {
  execute: () => Promise<string>
}

interface TurnstileOptions {
  sitekey: string
  size: 'invisible'
  execution: 'execute'
  action?: string
  callback: (token: string) => void
  'error-callback': () => void
  'expired-callback': () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: TurnstileOptions) => string
      execute: (widgetId: string, options?: { action?: string }) => void
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      const poll = (attempts: number) => {
        if (window.turnstile) {
          resolve()
        } else if (attempts > 0) {
          setTimeout(() => poll(attempts - 1), 50)
        } else {
          reject(new Error('Turnstile script loaded without defining window.turnstile'))
        }
      }
      poll(40)
    }
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Turnstile script'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

interface TurnstileProps {
  sitekey: string
  action?: string
  onError?: () => void
}

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { sitekey, action, onError },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const tokenRef = useRef('')
  const pendingRef = useRef<Array<(token: string) => void>>([])
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useImperativeHandle(
    ref,
    () => ({
      execute: () => {
        const existing = tokenRef.current
        if (existing) return Promise.resolve(existing)
        if (!window.turnstile || !widgetIdRef.current) {
          // Script blocked or widget never rendered — degrade and let the
          // backend decide (it only enforces when a secret is configured).
          return Promise.resolve('')
        }
        return new Promise<string>((resolve) => {
          pendingRef.current.push(resolve)
          window.turnstile?.execute(widgetIdRef.current as string)
        })
      },
    }),
    [],
  )

  useEffect(() => {
    let mounted = true
    loadTurnstileScript()
      .then(() => {
        if (!mounted || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          size: 'invisible',
          execution: 'execute',
          ...(action ? { action } : {}),
          callback: (token: string) => {
            tokenRef.current = token
            pendingRef.current.splice(0).forEach((resolve) => resolve(token))
          },
          'error-callback': () => {
            tokenRef.current = ''
            pendingRef.current.splice(0).forEach((resolve) => resolve(''))
            onErrorRef.current?.()
          },
          'expired-callback': () => {
            tokenRef.current = ''
          },
        })
      })
      .catch(() => {
        if (mounted) onErrorRef.current?.()
      })
    return () => {
      mounted = false
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
      tokenRef.current = ''
    }
  }, [sitekey, action])

  return <div ref={containerRef} className="cf-turnstile" />
})
