import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MerchantAuthProvider, useMerchantAuth, getAccessToken, signIn, signOut } from './auth'
import { backendApi } from './backendApi'
import { supabase } from './supabase'

// Mock backendApi
vi.mock('./backendApi', () => ({
  backendApi: {
    post: vi.fn(),
    postAuth: vi.fn(),
    withToken: vi.fn().mockReturnValue({
      get: vi.fn()
    })
  }
}))

// Mock Supabase SDK
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    }
  }
}))

describe('Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset global access token by calling signOut, which clears it
    // but we can't await it easily in sync beforeEach, so we mock the backendApi
    // to just return success and call it.
    vi.mocked(backendApi.postAuth).mockResolvedValueOnce(undefined)
  })

  describe('signIn standalone', () => {
    it('should authenticate user and return role', async () => {
      // Mock successful login
      vi.mocked(backendApi.post).mockResolvedValueOnce({
        session: { access_token: 'test-token', user: { id: 'u1' } }
      })

      // Mock whoami check
      const mockGet = vi.fn().mockResolvedValueOnce({ role: 'aliado' })
      vi.mocked(backendApi.withToken).mockReturnValueOnce({ get: mockGet } as any)

      const result = await signIn('test@example.com', 'password123')
      
      expect(backendApi.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      })
      expect(supabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'test-token',
        refresh_token: 'dummy-refresh-token'
      })
      expect(getAccessToken()).toBe('test-token')
      expect(result).toEqual({ role: 'aliado', error: null })
    })

    it('should return error if whoami fails or returns null', async () => {
      vi.mocked(backendApi.post).mockResolvedValueOnce({
        session: { access_token: 'test-token', user: { id: 'u1' } }
      })

      const mockGet = vi.fn().mockRejectedValueOnce(new Error('Network error'))
      vi.mocked(backendApi.withToken).mockReturnValueOnce({ get: mockGet } as any)

      const result = await signIn('test@example.com', 'password123')
      expect(result).toEqual({ role: null, error: 'No tienes acceso a este portal.' })
    })
  })

  describe('MerchantAuthProvider', () => {
    it('should initialize with loading state and attempt bootstrap', async () => {
      // Mock silent refresh failing (no token)
      vi.mocked(backendApi.post).mockRejectedValueOnce(new Error('No cookie'))

      const { result } = renderHook(() => useMerchantAuth(), {
        wrapper: ({ children }) => <MerchantAuthProvider>{children}</MerchantAuthProvider>
      })

      // Initially loading
      expect(result.current.loading).toBe(true)

      // Wait for bootstrap to finish
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.session).toBeNull()
      expect(result.current.merchantUser).toBeNull()
    })
  })
})
