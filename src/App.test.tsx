import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the M0 baseline', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'StayOnBeat' })).toBeInTheDocument()
    expect(screen.getByText(/M0 工程基线已就绪/)).toBeInTheDocument()
  })
})
