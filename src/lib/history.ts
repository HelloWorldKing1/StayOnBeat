import type { SessionResult } from '../store/useTrainingStore'

/** 持久化的训练记录：M3 结果 + id 与 wall-clock 时间戳。 */
export interface HistoryRecord extends SessionResult {
  id: string
  startedAt: number
  endedAt: number
}

/** 历史存储抽象：生产用 IndexedDB，测试用内存实现。 */
export interface HistoryStorage {
  add(record: HistoryRecord): Promise<void>
  getAll(): Promise<HistoryRecord[]>
  clear(): Promise<void>
}

export interface HistoryStore {
  save(record: HistoryRecord): Promise<void>
  list(): Promise<HistoryRecord[]>
  clear(): Promise<void>
}

const DB_NAME = 'stayonbeat'
const STORE_NAME = 'sessions'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 原生 IndexedDB 薄适配（db `stayonbeat` / store `sessions`，keyPath `id`）。 */
export function createIndexedDbHistoryStorage(): HistoryStorage {
  return {
    async add(record) {
      const db = await openDb()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).put(record)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
      db.close()
    },
    async getAll() {
      const db = await openDb()
      const records = await new Promise<HistoryRecord[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).getAll()
        req.onsuccess = () => resolve(req.result as HistoryRecord[])
        req.onerror = () => reject(req.error)
      })
      db.close()
      return records.sort((a, b) => b.endedAt - a.endedAt)
    },
    async clear() {
      const db = await openDb()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
      db.close()
    },
  }
}

/** 内存实现（测试用）。 */
export function createMemoryHistoryStorage(): HistoryStorage {
  const records: HistoryRecord[] = []
  return {
    async add(record) {
      records.push(record)
    },
    async getAll() {
      return [...records].sort((a, b) => b.endedAt - a.endedAt)
    },
    async clear() {
      records.length = 0
    },
  }
}

export function createHistoryStore(
  storage: HistoryStorage = createIndexedDbHistoryStorage(),
): HistoryStore {
  return {
    save: (record) => storage.add(record),
    list: () => storage.getAll(),
    clear: () => storage.clear(),
  }
}

/** 应用单例（IndexedDB）。 */
export const historyStore = createHistoryStore()
