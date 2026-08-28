import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('renders the current-year copyright with a link to the hiring site', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: 'J Showers Digital Consulting LLC' })
    expect(link).toHaveAttribute('href', 'https://hire.jshowers.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()}`))).toBeInTheDocument()
  })

  it('opens the Terms & Conditions modal from the footer', () => {
    render(<Footer />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Terms & Conditions' }))
    expect(screen.getByRole('dialog', { name: 'Parole Watch Terms & Conditions' })).toBeInTheDocument()
    expect(screen.getByText(/30-day money-back guarantee/)).toBeInTheDocument()
  })

  it('closes the Terms & Conditions modal', () => {
    render(<Footer />)
    fireEvent.click(screen.getByRole('button', { name: 'Terms & Conditions' }))
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
