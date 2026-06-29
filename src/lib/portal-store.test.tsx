import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { PortalProvider, usePortal } from './portal-store'
import { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <PortalProvider>{children}</PortalProvider>
)

describe('Portal Store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with default state when localStorage is empty', () => {
    const { result } = renderHook(() => usePortal(), { wrapper })

    expect(result.current.session).toBeNull()
    expect(result.current.company).toEqual({
      name: "",
      tagline: "",
      description: "",
      logo: "",
      cover: "",
      brandColor: "#2f7d4f",
      category: "",
      email: "",
      website: "",
    })
    expect(result.current.products).toEqual([])
  })

  it('should load data from localStorage on mount', () => {
    const persistedState = {
      session: { email: 'test@example.com' },
      company: {
        name: "Test Company",
        tagline: "",
        description: "",
        logo: "",
        cover: "",
        brandColor: "#000000",
        category: "",
        email: "",
        website: "",
      },
      products: []
    }
    
    localStorage.setItem('portal-aliados-v1', JSON.stringify(persistedState))

    const { result } = renderHook(() => usePortal(), { wrapper })

    expect(result.current.session).toEqual({ email: 'test@example.com' })
    expect(result.current.company.name).toBe('Test Company')
  })

  it('should update company and save to localStorage', () => {
    const { result } = renderHook(() => usePortal(), { wrapper })

    act(() => {
      result.current.updateCompany({ name: 'New Name' })
    })

    expect(result.current.company.name).toBe('New Name')
    
    const saved = JSON.parse(localStorage.getItem('portal-aliados-v1') || '{}')
    expect(saved.company.name).toBe('New Name')
  })

  it('should add, update, and remove products', () => {
    const { result } = renderHook(() => usePortal(), { wrapper })

    // Add
    act(() => {
      result.current.addProduct({
        name: 'Product 1',
        description: 'Desc 1',
        points: 100,
        stock: 10,
        image: '',
        category: 'Food'
      })
    })

    expect(result.current.products).toHaveLength(1)
    const product = result.current.products[0]
    expect(product.name).toBe('Product 1')
    expect(product.id).toBeDefined()

    // Update
    act(() => {
      result.current.updateProduct(product.id, { points: 200 })
    })
    
    expect(result.current.products[0].points).toBe(200)

    // Remove
    act(() => {
      result.current.removeProduct(product.id)
    })

    expect(result.current.products).toHaveLength(0)
  })

  it('should handle login and logout', () => {
    const { result } = renderHook(() => usePortal(), { wrapper })

    act(() => {
      result.current.login('test@test.com')
    })
    expect(result.current.session).toEqual({ email: 'test@test.com' })

    act(() => {
      result.current.logout()
    })
    expect(result.current.session).toBeNull()
  })
})
