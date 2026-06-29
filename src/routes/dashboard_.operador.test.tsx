import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from './dashboard_.operador'
import * as auth from '@/lib/auth'
import * as api from '@/lib/api'
import { backendApi } from '@/lib/backendApi'

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  createFileRoute: () => (config: any) => config.component
}))

// Mock API calls
vi.mock('@/lib/api', () => ({
  createDeliverySession: vi.fn(),
  addDeliveryItem: vi.fn(),
  removeDeliveryItem: vi.fn(),
  getSessionSummary: vi.fn(),
  validateQrForOperator: vi.fn(),
  confirmDelivery: vi.fn(),
}))

// Mock backendApi for validator me
vi.mock('@/lib/backendApi', () => ({
  backendApi: {
    withToken: vi.fn().mockReturnValue({
      get: vi.fn()
    })
  }
}))

// Mock QrScanner to avoid dealing with media devices in integration tests
vi.mock('@/components/QrScanner', () => ({
  QrScanner: ({ onScan }: any) => (
    <div data-testid="mock-scanner">
      <button onClick={() => onScan('mocked-qr-token')}>Simular Escaneo</button>
    </div>
  )
}))

describe('OperadorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(auth, 'getAccessToken').mockReturnValue('mock-token')
    vi.spyOn(auth, 'signOut').mockResolvedValue()
    
    // Default valid operator
    vi.mocked(backendApi.withToken('mock-token').get).mockResolvedValue({
      id: 'val1',
      center_id: 'c1',
      full_name: 'Test Val',
      centers: { name: 'Centro Test' }
    })
    
    vi.mocked(api.createDeliverySession).mockResolvedValue('session-123')
  })

  it('initializes session and displays cart', async () => {
    render(<Route />)
    
    // Wait for init
    await waitFor(() => {
      expect(screen.getByText('Centro Test')).toBeInTheDocument()
    })
    
    expect(api.createDeliverySession).toHaveBeenCalledWith('val1', 'c1')
    
    // Check if materials are rendered
    expect(screen.getByText('Plástico')).toBeInTheDocument()
    expect(screen.getByText('Papel')).toBeInTheDocument()
    expect(screen.getByText('Vidrio')).toBeInTheDocument()
    expect(screen.getByText('Aluminio')).toBeInTheDocument()
  })

  it('adds an item to cart and transitions to scan', async () => {
    render(<Route />)
    
    await waitFor(() => expect(screen.getByText('Centro Test')).toBeInTheDocument())
    
    // Click on plastic
    await userEvent.click(screen.getByText('Plástico'))
    
    // Type 2.5 kg
    const input = screen.getByPlaceholderText('0.0')
    await userEvent.type(input, '2.5')
    
    // Add to cart
    vi.mocked(api.addDeliveryItem).mockResolvedValue(undefined as never)
    vi.mocked(api.getSessionSummary).mockResolvedValue({
      items: [
        { id: 'i1', material: 'plastico', kg: 2.5, points_to_award: 125, co2_saved_kg: 3.75, trees_equivalent: 0.17 }
      ]
    })
    
    await userEvent.click(screen.getByText('Agregar al carrito'))
    
    // Wait for cart to update
    await waitFor(() => {
      expect(screen.getByText('Confirmar entrega (1 material)')).toBeInTheDocument()
    })
    
    // Click to go to scan
    await userEvent.click(screen.getByText('Confirmar entrega (1 material)'))
    
    // Should show scanner
    expect(screen.getByText('Escanear QR')).toBeInTheDocument()
    expect(screen.getByTestId('mock-scanner')).toBeInTheDocument()
  })

  it('scans QR and confirms delivery', async () => {
    // Setup state where cart has items and we are in scan mode
    // We achieve this by running the flow
    render(<Route />)
    await waitFor(() => expect(screen.getByText('Centro Test')).toBeInTheDocument())
    
    await userEvent.click(screen.getByText('Plástico'))
    await userEvent.type(screen.getByPlaceholderText('0.0'), '1')
    vi.mocked(api.getSessionSummary).mockResolvedValue({ items: [{ id: '1', material: 'plastico', kg: 1, points_to_award: 50 }] })
    await userEvent.click(screen.getByText('Agregar al carrito'))
    
    await waitFor(() => expect(screen.getByText('Confirmar entrega (1 material)')).toBeInTheDocument())
    await userEvent.click(screen.getByText('Confirmar entrega (1 material)'))
    
    // In scanner step
    vi.mocked(api.validateQrForOperator).mockResolvedValue({
      valid: true,
      full_name: 'Estudiante Test',
      qr_code: '12345',
      points: 500
    })
    
    // Click scan mock button
    await userEvent.click(screen.getByText('Simular Escaneo'))
    
    // Check confirmation screen
    await waitFor(() => {
      expect(screen.getByText('Confirmar entrega')).toBeInTheDocument()
      expect(screen.getByText('Estudiante Test')).toBeInTheDocument()
    })
    
    // Confirm delivery
    vi.mocked(api.confirmDelivery).mockResolvedValue({
      success: true,
      total_points: 50,
      total_kg: 1,
      total_co2: 1.5,
      total_trees: 0.06
    })
    
    await userEvent.click(screen.getByText('Confirmar ✓'))
    
    // Check success screen
    await waitFor(() => {
      expect(screen.getByText('¡Entrega registrada!')).toBeInTheDocument()
    })
  })
})
