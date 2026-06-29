import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Route } from './dashboard.index'
import * as auth from '@/lib/auth'
import { useQuery } from '@tanstack/react-query'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn()
}))

// Mock react-router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  createFileRoute: () => (config: any) => config.component
}))

describe('Dashboard Index Aliados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(auth, 'useMerchantAuth').mockReturnValue({
      merchantPartner: {
        id: 'partner1',
        business_name: 'Empresa Test',
      }
    } as any)
  })

  it('renders greeting with company name and loading state initially', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [],
      isLoading: true
    } as any)

    render(<Route />)
    expect(screen.getByText('Hola, Empresa Test 👋')).toBeInTheDocument()
    
    // Check loading state of stats
    const loaders = document.querySelectorAll('.animate-spin')
    expect(loaders.length).toBeGreaterThan(0)
  })

  it('calculates and renders stats based on products', async () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [
        { id: 'p1', points: 2000 },
        { id: 'p2', points: 8000 }
      ],
      isLoading: false
    } as any)

    render(<Route />)
    
    // Total products = 2 (checked via getAllByText)
    
    // Total points = 10000 (might be formatted with commas, dots, spaces, or none in jsdom)
    expect(screen.getByText(/10[.,\s]*000/)).toBeInTheDocument()
    
    // Estimated redemptions = 2
    const statCards = screen.getAllByText('2')
    expect(statCards.length).toBeGreaterThanOrEqual(2)
  })
})
