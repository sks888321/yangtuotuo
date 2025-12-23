// Storage Layer - 只负责文件读写操作
// 业务逻辑API请使用 api/ 文件夹中的对应接口

// Storage keys - 文件名
export const STORAGE_FILES = {
  TEACHERS: 'teachers.json',
  STUDENTS: 'students.json',
  CLASSROOMS: 'classrooms.json',
  COURSE_TYPES: 'courseTypes.json',
  SCHEDULES: 'schedules.json',
  PAYMENTS: 'payments.json'
} as const

// File System Access API - 使用本地文件存储
let directoryHandle: FileSystemDirectoryHandle | null = null

// 初始化目录句柄
async function initDirectory() {
  if (directoryHandle) return directoryHandle
  
  try {
    // 尝试从indexedDB恢复之前的目录句柄
    const db = await openDB()
    const handle = await getStoredHandle(db)
    if (handle) {
      directoryHandle = handle
      return handle
    }
  } catch (error) {
    console.log('No stored directory handle')
  }
  
  return null
}

// 检查是否已有存储目录
export async function hasStorageDirectory(): Promise<boolean> {
  try {
    await initDirectory()
    return directoryHandle !== null
  } catch (error) {
    return false
  }
}

// 选择存储目录
export async function selectStorageDirectory() {
  try {
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    })
    
    if (handle) {
      directoryHandle = handle
      // 存储目录句柄到indexedDB
      const db = await openDB()
      await saveDirectoryHandle(db, handle)
    }
    
    return true
  } catch (error) {
    console.error('Failed to select directory:', error)
    return false
  }
}

// IndexedDB 操作 - 用于持久化目录句柄
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('YangTuoTuoDB', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles')
      }
    }
  })
}

async function saveDirectoryHandle(db: IDBDatabase, handle: FileSystemDirectoryHandle) {
  const transaction = db.transaction(['handles'], 'readwrite')
  const store = transaction.objectStore('handles')
  await store.put(handle, 'directory')
}

async function getStoredHandle(db: IDBDatabase): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['handles'], 'readonly')
    const store = transaction.objectStore('handles')
    const request = store.get('directory')
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

// Generic storage functions - 本地文件读写
async function getFromStorage<T>(fileName: string, defaultValue: T[] = []): Promise<T[]> {
  try {
    await initDirectory()
    
    if (!directoryHandle) {
      // 降级到localStorage
      return getFromLocalStorage<T>(fileName, defaultValue)
    }

    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true })
    const file = await fileHandle.getFile()
    const text = await file.text()
    
    if (!text) return defaultValue
    return JSON.parse(text)
  } catch (error) {
    console.error(`Error reading file (${fileName}):`, error)
    // 降级到localStorage
    return getFromLocalStorage<T>(fileName, defaultValue)
  }
}

async function saveToStorage<T>(fileName: string, data: T[]): Promise<void> {
  try {
    await initDirectory()
    
    if (!directoryHandle) {
      // 降级到localStorage
      saveToLocalStorage(fileName, data)
      return
    }

    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(JSON.stringify(data, null, 2))
    await writable.close()
    
    console.log(`Saved to file: ${fileName}`)
  } catch (error) {
    console.error(`Error saving file (${fileName}):`, error)
    // 降级到localStorage
    saveToLocalStorage(fileName, data)
  }
}

// 降级方案：使用localStorage
function getFromLocalStorage<T>(key: string, defaultValue: T[] = []): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return defaultValue
  }
}

function saveToLocalStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error)
  }
}

// 导出底层存储API - 只负责读写文件
export const storageAPI = {
  read: getFromStorage,
  write: saveToStorage
}

