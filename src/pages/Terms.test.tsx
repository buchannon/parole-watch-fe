import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TERMS_TEXT, TERMS_TITLE } from '../terms'
import Terms from './Terms'

describe('Terms', () => {
  it('renders the title, key sections, and back link', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: TERMS_TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What Parole Watch is' })).toBeInTheDocument()
    expect(screen.getByText(/30-day money-back guarantee/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to sign up' })).toHaveAttribute('href', '/signup')
  })

  it('builds a plain-text snapshot that covers the same sections', () => {
    expect(TERMS_TEXT).toContain(TERMS_TITLE)
    expect(TERMS_TEXT).toContain('30-day money-back guarantee')
    expect(TERMS_TEXT).toContain('What Parole Watch is')
  })
})
