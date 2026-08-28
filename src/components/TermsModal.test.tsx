import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TERMS_SECTIONS, TERMS_TEXT, TERMS_TITLE, TERMS_UPDATED } from '../terms'
import { TermsModal } from './TermsModal'

describe('TermsModal', () => {
  it('renders nothing when closed', () => {
    render(<TermsModal open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the title, updated date, and all sections when open', () => {
    render(<TermsModal open onClose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: TERMS_TITLE })).toBeInTheDocument()
    expect(screen.getByText(TERMS_UPDATED)).toBeInTheDocument()
    for (const section of TERMS_SECTIONS) {
      expect(screen.getByRole('heading', { name: section.heading })).toBeInTheDocument()
      expect(screen.getByText(section.paragraphs[0])).toBeInTheDocument()
    }
  })

  it('calls onClose from the button and on Escape', () => {
    const onClose = vi.fn()
    render(<TermsModal open onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('builds a plain-text snapshot that covers the same sections', () => {
    expect(TERMS_TEXT).toContain(TERMS_TITLE)
    expect(TERMS_TEXT).toContain('30-day money-back guarantee')
    expect(TERMS_TEXT).toContain('What Parole Watch is')
  })
})
