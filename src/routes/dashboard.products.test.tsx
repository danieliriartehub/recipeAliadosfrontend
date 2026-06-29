import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, fileToDataUrl } from './dashboard.products'
import * as auth from '@/lib/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn()
}))
import { toast } from 'sonner'

// Mock react-router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => config.component
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock Chatbot component to isolate form tests vs chatbot tests
vi.mock('@/components/ChatbotProductCreator', () => ({
  ChatbotProductCreator: () => <div data-testid="mock-chatbot" />
}))

describe('Dashboard Products', () => {
  const mockInvalidate = vi.fn()
  const mockMutateCreate = vi.fn()
  const mockMutateUpdate = vi.fn()
  const mockMutateDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(auth, 'useMerchantAuth').mockReturnValue({
      merchantPartner: { id: 'partner1' }
    } as any)

    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidate
    } as any)

    vi.mocked(useMutation).mockImplementation(({ mutationFn }: any) => {
      // Retornar un mock dinámico para que coincida con create, update o delete
      return {
        mutate: (vars: any, opts: any) => {
          if (typeof vars === 'string') {
            // is delete
            mockMutateDelete(vars, opts)
            opts?.onSuccess?.()
          } else if (vars.id) {
            // is update
            mockMutateUpdate(vars, opts)
            opts?.onSuccess?.()
          } else {
            // is create
            mockMutateCreate(vars, opts)
            opts?.onSuccess?.()
          }
        },
        isPending: false
      } as any
    })
  })

  it('renders empty state when no products', () => {
    vi.mocked(useQuery).mockReturnValue({ data: [], isLoading: false } as any)
    render(<Route />)
    
    expect(screen.getByText('Aún no tienes productos')).toBeInTheDocument()
  })

  it('renders a list of products', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [
        { id: 'p1', name: 'Botella de Agua', description: 'Desc 1', points: 100, stock: 10, category: 'Hogar' }
      ],
      isLoading: false
    } as any)

    render(<Route />)
    
    expect(screen.getByText('Botella de Agua')).toBeInTheDocument()
    expect(screen.getByText('Desc 1')).toBeInTheDocument()
  })

  it('opens edit modal and submits update', async () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [
        { id: 'p1', name: 'Botella de Agua', description: 'Desc 1', points: 100, stock: 10, category: 'Hogar' }
      ],
      isLoading: false
    } as any)

    render(<Route />)
    
    // Click edit
    const editBtn = screen.getByRole('button', { name: /editar/i })
    await userEvent.click(editBtn)
    
    // Dialog should open
    expect(screen.getByText('Editar producto')).toBeInTheDocument()
    
    // Change name
    const nameInput = screen.getByDisplayValue('Botella de Agua')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Botella Eco')
    
    // Submit
    const submitBtn = screen.getByRole('button', { name: /guardar cambios/i })
    await userEvent.click(submitBtn)
    
    await waitFor(() => {
      expect(mockMutateUpdate).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Producto actualizado')
    })
  })

  it('deletes a product with confirmation', async () => {
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    vi.mocked(useQuery).mockReturnValue({
      data: [{ id: 'p1', name: 'Botella', description: '', points: 100, stock: 10, category: '' }],
      isLoading: false
    } as any)

    render(<Route />)
    
    // Since Trash2 is just an icon, we can find the button by getting all buttons and picking the last one, 
    // or by aria-label/role if it had one. We'll find it by looking for the icon component or button index.
    const btns = screen.getAllByRole('button')
    const deleteBtn = btns.find(b => b.className.includes('text-destructive'))!
    
    await userEvent.click(deleteBtn)
    
    expect(window.confirm).toHaveBeenCalledWith('¿Seguro que deseas eliminar este producto?')
    expect(mockMutateDelete).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Producto eliminado')
  })

  it('validates required fields when editing a product', async () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [{ id: 'p1', name: 'Botella', description: 'Desc', points: 100, stock: 10, category: 'Cat' }],
      isLoading: false
    } as any)
    render(<Route />)
    
    // Open edit
    await userEvent.click(screen.getByRole('button', { name: /editar/i }))
    
    // Clear name field
    const nameInput = screen.getByDisplayValue('Botella')
    await userEvent.clear(nameInput)
    
    // Submit
    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))
    
    // Check validation error
    expect(await screen.findByText('El nombre es requerido')).toBeInTheDocument()
    expect(mockMutateUpdate).not.toHaveBeenCalled()
  })
})

describe('fileToDataUrl', () => {
  it('converts a File to data url using FileReader mock', async () => {
    // Mock FileReader global
    class MockFileReader {
      result: string = ''
      onload: any
      onerror: any
      readAsDataURL(file: File) {
        this.result = 'data:image/png;base64,mockbase64'
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 10)
      }
    }
    vi.stubGlobal('FileReader', MockFileReader)

    const file = new File([''], 'test.png', { type: 'image/png' })
    const result = await fileToDataUrl(file)
    expect(result).toBe('data:image/png;base64,mockbase64')
  })
})
