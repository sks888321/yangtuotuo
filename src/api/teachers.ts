import { storageAPI, STORAGE_FILES } from '../utils/storage'
import type { Teacher } from '../types'

// 获取所有老师
export async function getAll(): Promise<Teacher[]> {
  return await storageAPI.read<Teacher>(STORAGE_FILES.TEACHERS, [])
}

// 根据状态获取老师
export async function getByStatus(status: 'active' | 'inactive'): Promise<Teacher[]> {
  const teachers = await getAll()
  return teachers.filter(t => t.status === status)
}

// 根据级别获取老师
export async function getByLevel(level: 'junior' | 'intermediate' | 'senior'): Promise<Teacher[]> {
  const teachers = await getAll()
  return teachers.filter(t => t.level === level)
}

// 添加老师
export async function add(teacher: Teacher): Promise<void> {
  const teachers = await getAll()
  teachers.push(teacher)
  await storageAPI.write(STORAGE_FILES.TEACHERS, teachers)
}

// 更新老师
export async function update(id: string, data: Partial<Teacher>): Promise<void> {
  const teachers = await getAll()
  const index = teachers.findIndex(t => t.id === id)
  if (index !== -1) {
    teachers[index] = { ...teachers[index], ...data } as Teacher
    await storageAPI.write(STORAGE_FILES.TEACHERS, teachers)
  }
}

// 删除老师
export async function remove(id: string): Promise<void> {
  const teachers = await getAll()
  const filtered = teachers.filter(t => t.id !== id)
  await storageAPI.write(STORAGE_FILES.TEACHERS, filtered)
}

// 根据ID获取老师
export async function getById(id: string): Promise<Teacher | undefined> {
  const teachers = await getAll()
  return teachers.find(t => t.id === id)
}
