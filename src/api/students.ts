import { storageAPI, STORAGE_FILES } from '../utils/storage'
import type { Student } from '../types'

// 获取所有学生
export async function getAll(): Promise<Student[]> {
  return await storageAPI.read<Student>(STORAGE_FILES.STUDENTS, [])
}

// 根据状态获取学生
export async function getByStatus(status: 'active' | 'inactive'): Promise<Student[]> {
  const students = await getAll()
  return students.filter(s => s.status === status)
}

// 根据年龄范围获取学生
export async function getByAgeRange(minAge: number, maxAge: number): Promise<Student[]> {
  const students = await getAll()
  return students.filter(s => s.age >= minAge && s.age <= maxAge)
}

// 添加学生
export async function add(student: Student): Promise<void> {
  const students = await getAll()
  students.push(student)
  await storageAPI.write(STORAGE_FILES.STUDENTS, students)
}

// 更新学生
export async function update(id: string, data: Partial<Student>): Promise<void> {
  const students = await getAll()
  const index = students.findIndex(s => s.id === id)
  if (index !== -1) {
    students[index] = { ...students[index], ...data } as Student
    await storageAPI.write(STORAGE_FILES.STUDENTS, students)
  }
}

// 删除学生
export async function remove(id: string): Promise<void> {
  const students = await getAll()
  const filtered = students.filter(s => s.id !== id)
  await storageAPI.write(STORAGE_FILES.STUDENTS, filtered)
}

// 根据ID获取学生
export async function getById(id: string): Promise<Student | undefined> {
  const students = await getAll()
  return students.find(s => s.id === id)
}

// 根据多个ID获取学生
export async function getByIds(ids: string[]): Promise<Student[]> {
  const students = await getAll()
  return students.filter(s => ids.includes(s.id))
}
