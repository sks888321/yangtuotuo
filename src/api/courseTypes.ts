import { storageAPI, STORAGE_FILES } from '../utils/storage'
import type { CourseType } from '../types'

// 获取所有课程类型
export async function getAll(): Promise<CourseType[]> {
  return await storageAPI.read<CourseType>(STORAGE_FILES.COURSE_TYPES, [])
}

// 根据类型获取课程
export async function getByType(type: 'one-on-one' | 'group'): Promise<CourseType[]> {
  const courseTypes = await getAll()
  return courseTypes.filter(ct => ct.type === type)
}

// 添加课程类型
export async function add(courseType: CourseType): Promise<void> {
  const courseTypes = await getAll()
  courseTypes.push(courseType)
  await storageAPI.write(STORAGE_FILES.COURSE_TYPES, courseTypes)
}

// 更新课程类型
export async function update(id: string, data: Partial<CourseType>): Promise<void> {
  const courseTypes = await getAll()
  const index = courseTypes.findIndex(ct => ct.id === id)
  if (index !== -1) {
    courseTypes[index] = { ...courseTypes[index], ...data } as CourseType
    await storageAPI.write(STORAGE_FILES.COURSE_TYPES, courseTypes)
  }
}

// 删除课程类型
export async function remove(id: string): Promise<void> {
  const courseTypes = await getAll()
  const filtered = courseTypes.filter(ct => ct.id !== id)
  await storageAPI.write(STORAGE_FILES.COURSE_TYPES, filtered)
}

// 根据ID获取课程类型
export async function getById(id: string): Promise<CourseType | undefined> {
  const courseTypes = await getAll()
  return courseTypes.find(ct => ct.id === id)
}
