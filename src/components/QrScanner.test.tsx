import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QrScanner } from './QrScanner'
import { BrowserQRCodeReader } from '@zxing/browser'

// Mock ZXing
vi.mock('@zxing/browser', () => {
  class MockBrowserQRCodeReader {
    static listVideoInputDevices = vi.fn().mockResolvedValue([])
    decodeFromVideoDevice = vi.fn().mockResolvedValue({
      stop: vi.fn()
    })
  }
  return {
    BrowserQRCodeReader: MockBrowserQRCodeReader
  }
})

describe('QrScanner', () => {
  let mockOnScan: ReturnType<typeof vi.fn>
  let mockOnError: ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnScan = vi.fn()
    mockOnError = vi.fn()
    
    // Default MediaDevices mock
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      },
      configurable: true,
      writable: true
    })
  })

  it('shows unavailable state if mediaDevices is undefined', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      configurable: true,
      writable: true
    })

    render(<QrScanner onScan={mockOnScan} onError={mockOnError} />)
    
    await waitFor(() => {
      expect(screen.getByText('Cámara no disponible')).toBeInTheDocument()
    })
    expect(mockOnError).toHaveBeenCalledWith('Cámara no disponible en este dispositivo')
  })

  it('shows denied state if user denies permission', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue({ name: 'NotAllowedError' })
      },
      configurable: true,
      writable: true
    })

    render(<QrScanner onScan={mockOnScan} onError={mockOnError} />)
    
    await waitFor(() => {
      expect(screen.getByText('Cámara bloqueada')).toBeInTheDocument()
    })
  })

  it('allows manual input when camera is unavailable', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      configurable: true,
      writable: true
    })

    render(<QrScanner onScan={mockOnScan} onError={mockOnError} />)
    
    const input = await screen.findByPlaceholderText('Pega el código aquí...')
    const btn = screen.getByText('Verificar código')
    
    await userEvent.type(input, '123456')
    await userEvent.click(btn)
    
    expect(mockOnScan).toHaveBeenCalledWith('123456')
  })

  it('initializes camera successfully', async () => {
    // Mock static method
    vi.spyOn(BrowserQRCodeReader, 'listVideoInputDevices').mockResolvedValue([
      { deviceId: '1', kind: 'videoinput', label: 'Cam 1', groupId: 'g1' },
      { deviceId: '2', kind: 'videoinput', label: 'Cam 2', groupId: 'g2' }
    ] as any)

    render(<QrScanner onScan={mockOnScan} onError={mockOnError} />)
    
    await waitFor(() => {
      expect(screen.getByText('Apunta al código QR del estudiante')).toBeInTheDocument()
    })
  })
})
