import { storageAPI, STORAGE_FILES } from '../utils/storage'
import type { Classroom } from '../types'

// 获取所有教室
export async function getAll(): Promise<Classroom[]> {
  return await storageAPI.read<Classroom>(STORAGE_FILES.CLASSROOMS, [])
}

// 根据状态获取教室
export async function getByStatus(status: 'available' | 'occupied' | 'maintenance'): Promise<Classroom[]> {
  const classrooms = await getAll()
  return classrooms.filter(c => c.status === status)
}

// 根据容量获取教室
export async function getByCapacity(minCapacity: number): Promise<Classroom[]> {
  const classrooms = await getAll()
  return classrooms.filter(c => c.capacity >= minCapacity)
}

// 添加教室
export async function add(classroom: Classroom): Promise<void> {
  const classrooms = await getAll()
  classrooms.push(classroom)
  await storageAPI.write(STORAGE_FILES.CLASSROOMS, classrooms)
}

// 更新教室
export async function update(id: string, data: Partial<Classroom>): Promise<void> {
  const classrooms = await getAll()
  const index = classrooms.findIndex(c => c.id === id)
  if (index !== -1) {
    classrooms[index] = { ...classrooms[index], ...data } as Classroom
    await storageAPI.write(STORAGE_FILES.CLASSROOMS, classrooms)
  }
}

// 删除教室
export async function remove(id: string): Promise<void> {
  const classrooms = await getAll()
  const filtered = classrooms.filter(c => c.id !== id)
  await storageAPI.write(STORAGE_FILES.CLASSROOMS, filtered)
}

// 根据ID获取教室
export async function getById(id: string): Promise<Classroom | undefined> {
  const classrooms = await getAll()
  return classrooms.find(c => c.id === id)
}
