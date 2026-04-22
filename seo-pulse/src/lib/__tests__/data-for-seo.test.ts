import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDomainOverview } from '../data-for-seo'

describe('getDomainOverview', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls /api/dataforseo/domain with domain and type=overview query params', async () => {
    const mockData = {
      domain: 'example.com',
      organicTraffic: 1000,
      organicKeywords: 200,
      backlinks: 500,
      referringDomains: 50,
      domainRank: 30,
    }

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response)

    await getDomainOverview('example.com')

    expect(globalThis.fetch).toHaveBeenCalledOnce()
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/dataforseo/domain')
    expect(calledUrl).toContain('domain=example.com')
    expect(calledUrl).toContain('type=overview')
  })

  it('returns parsed JSON data on success', async () => {
    const mockData = {
      domain: 'example.com',
      organicTraffic: 1000,
      organicKeywords: 200,
      backlinks: 500,
      referringDomains: 50,
      domainRank: 30,
    }

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response)

    const result = await getDomainOverview('example.com')

    expect(result).toEqual(mockData)
  })

  it('throws an error with "Rate limit" in the message on 429 response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
    } as Response)

    await expect(getDomainOverview('example.com')).rejects.toThrow('Rate limit')
  })
})
