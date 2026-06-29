import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from './login'
import * as auth from '@/lib/auth'

// Mock react-router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  createFileRoute: () => (config: any) => config.component
}))

describe('LoginPage Aliados', () => {
  const mockSignIn = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(auth, 'useMerchantAuth').mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      session: null,
      merchantUser: null,
      merchantPartner: null,
      signOut: vi.fn()
    })
  })

  it('renders the login form', () => {
    render(<Route />)
    expect(screen.getByPlaceholderText('hola@miempresa.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    render(<Route />)
    const emailInput = screen.getByPlaceholderText('hola@miempresa.com')
    
    await userEvent.type(emailInput, 'invalid-email')
    
    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument()
    // Submit button should be disabled if email is not fully typed or invalid? 
    // The component disables if !email || !password. Since email has text, we just check validation text.
  })

  it('handles successful login and redirects to dashboard', async () => {
    mockSignIn.mockResolvedValueOnce({ role: 'aliado', error: null })
    render(<Route />)
    
    await userEvent.type(screen.getByPlaceholderText('hola@miempresa.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123')
    
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i })
    await userEvent.click(submitBtn)

    expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123')
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard', replace: true })
    })
  })

  it('handles login error and displays message', async () => {
    mockSignIn.mockResolvedValueOnce({ role: null, error: 'Credenciales inválidas' })
    render(<Route />)
    
    await userEvent.type(screen.getByPlaceholderText('hola@miempresa.com'), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i })
    await userEvent.click(submitBtn)

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('blocks login after 5 failed attempts', async () => {
    // Return error 5 times
    mockSignIn.mockResolvedValue({ role: null, error: 'Error' })
    render(<Route />)
    
    const emailInput = screen.getByPlaceholderText('hola@miempresa.com')
    const passInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i })

    await userEvent.type(emailInput, 'test@test.com')
    await userEvent.type(passInput, 'wrong')

    for (let i = 0; i < 5; i++) {
      await userEvent.click(submitBtn)
    }

    // After 5 attempts, the countdown should appear
    expect(await screen.findByText('Demasiados intentos')).toBeInTheDocument()
    expect(submitBtn).toBeDisabled()
  })
})
