import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from './login_.operador'
import * as auth from '@/lib/auth'

// Mock react-router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  createFileRoute: () => (config: any) => config.component
}))

describe('LoginPage Operadores', () => {
  const mockSignIn = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(auth, 'signIn').mockImplementation(mockSignIn)
    vi.spyOn(auth, 'signOut').mockResolvedValue()
    vi.spyOn(auth, 'getAccessToken').mockReturnValue(null)
    vi.spyOn(auth, 'getUserRole').mockResolvedValue(null)
  })

  it('renders the operador login form', () => {
    render(<Route />)
    expect(screen.getByPlaceholderText('operador@usil.edu.pe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar como operador/i })).toBeInTheDocument()
  })

  it('handles successful login and redirects to operador dashboard', async () => {
    mockSignIn.mockResolvedValueOnce({ role: 'operador', error: null })
    render(<Route />)
    
    await userEvent.type(screen.getByPlaceholderText('operador@usil.edu.pe'), 'op@test.com')
    await userEvent.type(document.querySelector('input[type="password"]')!, 'password123')
    
    const submitBtn = screen.getByRole('button', { name: /ingresar como operador/i })
    await userEvent.click(submitBtn)

    expect(mockSignIn).toHaveBeenCalledWith('op@test.com', 'password123')
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard/operador', replace: true })
    })
  })

  it('shows error if user is an aliado trying to login as operador', async () => {
    // Si el role devuelto es aliado, el login debería mostrar error de permisos
    mockSignIn.mockResolvedValueOnce({ role: 'aliado', error: null })
    render(<Route />)
    
    await userEvent.type(screen.getByPlaceholderText('operador@usil.edu.pe'), 'aliado@test.com')
    await userEvent.type(document.querySelector('input[type="password"]')!, 'password123')
    
    const submitBtn = screen.getByRole('button', { name: /ingresar como operador/i })
    await userEvent.click(submitBtn)

    expect(await screen.findByText('No tienes acceso a este portal.')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
