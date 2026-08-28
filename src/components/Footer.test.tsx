import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('renders the current-year copyright with a link to the hiring site', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: 'J Showers Digital Consulting LLC' })
    expect(link).toHaveAttribute('href', 'https://hire.jshowers.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText(`© ${new Date().getFullYear()}`)).toBeInTheDocument()
  })
})
