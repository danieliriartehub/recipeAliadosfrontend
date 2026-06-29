import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from './dashboard.profile'
import * as auth from '@/lib/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn()
}))
import { toast } from 'sonner'
import * as portalStore from '@/lib/portal-store'

// Mock MobilePreview
vi.mock('@/components/MobilePreview', () => ({
  MobilePreview: () => <div data-testid="mobile-preview" />
}))

// Mock react-router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => config.component
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

describe('Dashboard Profile', () => {
  const mockUpdateCompany = vi.fn()
  const mockMutate = vi.fn()
  const mockInvalidate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(auth, 'useMerchantAuth').mockReturnValue({
      merchantPartner: { id: 'partner1' },
      merchantUser: { id: 'user1' }
    } as any)

    vi.spyOn(portalStore, 'usePortal').mockReturnValue({
      updateCompany: mockUpdateCompany
    } as any)

    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidate
    } as any)

    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false
    } as any)
  })

  it('loads profile data and displays it in the form', async () => {
    vi.spyOn(auth, 'useMerchantAuth').mockReturnValue({
      merchantPartner: { 
        id: 'partner1',
        business_name: 'Mi Empresa',
        tagline: 'Lo mejor',
        contact_email: 'test@empresa.com'
      },
      merchantUser: { id: 'user1' }
    } as any)

    vi.mocked(useQuery).mockReturnValue({
      data: {
        merchant_partners: {
          business_name: 'Mi Empresa',
          tagline: 'Lo mejor',
          contact_email: 'test@empresa.com'
        }
      },
      isLoading: false,
      isError: false
    } as any)

    render(<Route />)

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Tu empresa') as HTMLInputElement
      expect(nameInput.value).toBe('Mi Empresa')
    })
  })

  it('updates profile and submits changes', async () => {
    vi.spyOn(auth, 'useMerchantAuth').mockReturnValue({
      merchantPartner: { 
        id: 'partner1',
        business_name: 'Old Name'
      },
      merchantUser: { id: 'user1' }
    } as any)

    vi.mocked(useQuery).mockReturnValue({
      data: {
        merchant_partners: {
          business_name: 'Old Name',
        }
      },
      isLoading: false,
      isError: false
    } as any)

    render(<Route />)

    // Verify initial load
    let nameInput!: HTMLInputElement
    await waitFor(() => {
      nameInput = screen.getByPlaceholderText('Tu empresa') as HTMLInputElement
      expect(nameInput.value).toBe('Old Name')
    })

    // Change name
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'New Name')

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /guardar cambios/i })
    await userEvent.click(submitBtn)

    // Mutation should be called with only dirty fields
    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
      business_name: 'New Name'
    }))
  })
})
