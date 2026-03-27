import { describe, it, expect, beforeEach } from 'vitest'
import { dbPut, dbGet, dbGetAll, dbDelete, dbCount, dbClear, STORES } from '@/lib/storage'

// Note: IndexedDB tests require a browser-like environment.
// jsdom provides a basic IndexedDB polyfill via fake-indexeddb.
// These tests verify the API contracts work correctly.

describe('IndexedDB Storage', () => {
  beforeEach(async () => {
    await dbClear(STORES.documents)
  })

  it('stores and retrieves a document', async () => {
    const doc = { id: 'test-1', title: 'Test Document', type: 'doc', data: {} }
    await dbPut(STORES.documents, doc)
    const retrieved = await dbGet(STORES.documents, 'test-1')
    expect(retrieved).toEqual(doc)
  })

  it('updates an existing document', async () => {
    const doc = { id: 'test-2', title: 'Original', type: 'doc', data: {} }
    await dbPut(STORES.documents, doc)
    const updated = { ...doc, title: 'Updated' }
    await dbPut(STORES.documents, updated)
    const retrieved = await dbGet(STORES.documents, 'test-2')
    expect(retrieved?.title).toBe('Updated')
  })

  it('returns undefined for missing documents', async () => {
    const retrieved = await dbGet(STORES.documents, 'nonexistent')
    expect(retrieved).toBeUndefined()
  })

  it('lists all documents', async () => {
    await dbPut(STORES.documents, { id: 'a', title: 'A', type: 'doc', data: {} })
    await dbPut(STORES.documents, { id: 'b', title: 'B', type: 'doc', data: {} })
    await dbPut(STORES.documents, { id: 'c', title: 'C', type: 'doc', data: {} })
    const all = await dbGetAll(STORES.documents)
    expect(all).toHaveLength(3)
    expect(all.map((d: any) => d.id).sort()).toEqual(['a', 'b', 'c'])
  })

  it('deletes a document', async () => {
    await dbPut(STORES.documents, { id: 'del-1', title: 'Delete Me', type: 'doc', data: {} })
    await dbDelete(STORES.documents, 'del-1')
    const retrieved = await dbGet(STORES.documents, 'del-1')
    expect(retrieved).toBeUndefined()
  })

  it('counts documents', async () => {
    expect(await dbCount(STORES.documents)).toBe(0)
    await dbPut(STORES.documents, { id: 'c1', title: 'C1', type: 'doc', data: {} })
    await dbPut(STORES.documents, { id: 'c2', title: 'C2', type: 'doc', data: {} })
    expect(await dbCount(STORES.documents)).toBe(2)
  })

  it('clears all documents', async () => {
    await dbPut(STORES.documents, { id: 'x1', title: 'X1', type: 'doc', data: {} })
    await dbPut(STORES.documents, { id: 'x2', title: 'X2', type: 'doc', data: {} })
    await dbClear(STORES.documents)
    expect(await dbCount(STORES.documents)).toBe(0)
  })
})
