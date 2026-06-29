import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from './ProtectedRoute'
import * as auth from '@/lib/auth'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading spinner when loading is true', () => {
    vi.spyOn(auth, 'useMerchantAuth').mockReturnValue({
      loading: true,
      session: null,
      merchantUser: null,
      merchantPartner: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    const { container } = render(<ProtectedRoute>Protected Content</ProtectedRoute>)
    
    // Check if spinner is rendered (by checking the class animate-spin)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should navigate to /login when loading is false and no session exists', () => {
    vi.spyOn(auth, 'useMerchantAuth').mockReturnValue({
      loading: false,
      session: null,
      merchantUser: null,
      merchantPartner: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    render(<ProtectedRoute>Protected Content</ProtectedRoute>)
    
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login', replace: true })
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should render children when session exists', () => {
    vi.spyOn(auth, 'useMerchantAuth').mockReturnValue({
      loading: false,
      session: { user: { id: 'test' } } as any,
      merchantUser: null,
      merchantPartner: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    render(<ProtectedRoute>Protected Content</ProtectedRoute>)
    
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
