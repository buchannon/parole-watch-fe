import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MaintenanceScreen from './MaintenanceScreen'

describe('MaintenanceScreen', () => {
  it('renders the maintenance message', () => {
    render(<MaintenanceScreen />)
    expect(screen.getByRole('heading', { name: 'Parole Watch' })).toBeInTheDocument()
    expect(screen.getByText(/currently unable to receive new data from the state/)).toBeInTheDocument()
  })

  it('renders no forms, inputs, or navigation links', () => {
    render(<MaintenanceScreen />)
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /offenders|login|signup/i })).not.toBeInTheDocument()
  })

  it('renders the footer and opens Terms & Conditions in place', () => {
    render(<MaintenanceScreen />)
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Terms & Conditions' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
