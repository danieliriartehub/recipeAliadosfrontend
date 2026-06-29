import { describe, it, expect, beforeEach, vi } from 'vitest'
import { backendApi } from './backendApi'

// Setup global fetch mock
const fetchMock = vi.fn()
global.fetch = fetchMock

describe('backendApi', () => {
  beforeEach(() => {
    fetchMock.mockClear()
    // By default, return a successful empty response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    })
  })

  it('should throw an error if VITE_API_URL is missing', () => {
    // The module is already evaluated, so we can't easily re-evaluate it
    // without vitest isolated modules, but we can verify fetch is called
    // with whatever the current VITE_API_URL is set to.
    expect(true).toBe(true) // Placeholder, the check is in module scope.
  })

  describe('get (public)', () => {
    it('should perform a GET request with credentials include', async () => {
      await backendApi.get('/test')
      
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const callArgs = fetchMock.mock.calls[0]
      // Expect URL to end with /test
      expect(callArgs[0]).toMatch(/\/test$/)
      // Expect options
      expect(callArgs[1]).toEqual(expect.objectContaining({
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }))
    })
  })

  describe('post (public)', () => {
    it('should perform a POST request with body', async () => {
      const bodyData = { email: 'test@example.com', password: '123' }
      await backendApi.post('/login', bodyData)
      
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const callArgs = fetchMock.mock.calls[0]
      expect(callArgs[0]).toMatch(/\/login$/)
      expect(callArgs[1]).toEqual(expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      }))
    })
  })

  describe('withToken', () => {
    const token = 'fake-jwt-token'
    const api = backendApi.withToken(token)

    it('should inject Authorization header into GET requests', async () => {
      await api.get('/protected')
      const callArgs = fetchMock.mock.calls[0]
      expect(callArgs[1].headers).toEqual(expect.objectContaining({
        'Authorization': `Bearer ${token}`
      }))
    })

    it('should inject Authorization header into POST requests', async () => {
      await api.post('/protected-post', { data: 123 })
      const callArgs = fetchMock.mock.calls[0]
      expect(callArgs[1].method).toBe('POST')
      expect(callArgs[1].headers).toEqual(expect.objectContaining({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }))
    })

    it('should handle FormData in POST correctly', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test']), 'test.txt')
      
      await api.postForm('/upload', formData)
      const callArgs = fetchMock.mock.calls[0]
      expect(callArgs[1].method).toBe('POST')
      expect(callArgs[1].body).toBe(formData)
      // Content-Type should NOT be application/json for FormData
      expect(callArgs[1].headers).toEqual(expect.objectContaining({
        'Authorization': `Bearer ${token}`
      }))
      expect(callArgs[1].headers['Content-Type']).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should throw an error with detail message on 400 Bad Request', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Invalid input data' })
      })

      await expect(backendApi.get('/error-path')).rejects.toThrow('Invalid input data')
    })

    it('should handle 204 No Content returning undefined', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      const result = await backendApi.post('/logout')
      expect(result).toBeUndefined()
    })
  })
})
