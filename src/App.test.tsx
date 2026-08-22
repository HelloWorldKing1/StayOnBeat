import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the metronome home', () => {
    render(<App />)

    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始训练' })).toBeInTheDocument()
    expect(screen.getAllByTestId('beat-light')).toHaveLength(4)
  })
})
