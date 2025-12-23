import { storageAPI, STORAGE_FILES } from '../utils/storage'
import type { ScheduleItem } from '../types'

// 获取所有排课
export async function getAll(): Promise<ScheduleItem[]> {
  return await storageAPI.read<ScheduleItem>(STORAGE_FILES.SCHEDULES, [])
}

// 根据日期范围获取排课
export async function getByDateRange(startDate: string, endDate: string): Promise<ScheduleItem[]> {
  const schedules = await getAll()
  return schedules.filter(s => s.date >= startDate && s.date <= endDate)
}

// 根据日期获取排课
export async function getByDate(date: string): Promise<ScheduleItem[]> {
  const schedules = await getAll()
  return schedules.filter(s => s.date === date)
}

// 根据老师ID获取排课
export async function getByTeacher(teacherId: string): Promise<ScheduleItem[]> {
  const schedules = await getAll()
  return schedules.filter(s => s.teacherId === teacherId)
}

// 根据学生ID获取排课
export async function getByStudent(studentId: string): Promise<ScheduleItem[]> {
  const schedules = await getAll()
  return schedules.filter(s => s.students.includes(studentId))
}

// 根据教室ID获取排课
export async function getByClassroom(classroomId: string): Promise<ScheduleItem[]> {
  const schedules = await getAll()
  return schedules.filter(s => s.classroomId === classroomId)
}

// 根据状态获取排课
export async function getByStatus(status: 'scheduled' | 'completed' | 'cancelled'): Promise<ScheduleItem[]> {
  const schedules = await getAll()
  return schedules.filter(s => s.status === status)
}

// 检查时间冲突
export async function checkConflict(schedule: Partial<ScheduleItem>): Promise<{
  hasConflict: boolean
  conflictType?: 'teacher' | 'classroom' | 'student'
  conflictSchedule?: ScheduleItem
}> {
  const schedules = await getAll()
  
  for (const existing of schedules) {
    // 跳过自己
    if (schedule.id && existing.id === schedule.id) continue
    // 跳过非同一天的排课
    if (existing.date !== schedule.date) continue
    // 跳过已取消的排课
    if (existing.status === 'cancelled') continue
    
    // 检查时间是否重叠
    const existingStart = existing.startTime
    const existingEnd = existing.endTime
    const scheduleStart = schedule.startTime!
    const scheduleEnd = schedule.endTime!
    
    const isOverlap = 
      (scheduleStart >= existingStart && scheduleStart < existingEnd) ||
      (scheduleEnd > existingStart && scheduleEnd <= existingEnd) ||
      (scheduleStart <= existingStart && scheduleEnd >= existingEnd)
    
    if (!isOverlap) continue
    
    // 检查老师冲突
    if (schedule.teacherId && existing.teacherId === schedule.teacherId) {
      return { hasConflict: true, conflictType: 'teacher', conflictSchedule: existing }
    }
    
    // 检查教室冲突
    if (schedule.classroomId && existing.classroomId === schedule.classroomId) {
      return { hasConflict: true, conflictType: 'classroom', conflictSchedule: existing }
    }
    
    // 检查学生冲突
    if (schedule.students) {
      const hasStudentConflict = schedule.students.some(sid => existing.students.includes(sid))
      if (hasStudentConflict) {
        return { hasConflict: true, conflictType: 'student', conflictSchedule: existing }
      }
    }
  }
  
  return { hasConflict: false }
}

// 添加排课
export async function add(schedule: ScheduleItem): Promise<{ success: boolean, message?: string }> {
  // 检查冲突
  const conflict = await checkConflict(schedule)
  if (conflict.hasConflict) {
    const typeMap = {
      teacher: '老师',
      classroom: '教室',
      student: '学生'
    }
    return {
      success: false,
      message: `${typeMap[conflict.conflictType!]}在该时间段已有排课`
    }
  }
  
  const schedules = await getAll()
  schedules.push(schedule)
  await storageAPI.write(STORAGE_FILES.SCHEDULES, schedules)
  return { success: true }
}

// 更新排课
export async function update(id: string, data: Partial<ScheduleItem>): Promise<{ success: boolean, message?: string }> {
  const schedules = await getAll()
  const index = schedules.findIndex(s => s.id === id)
  if (index === -1) {
    return { success: false, message: '排课不存在' }
  }
  
  const updatedSchedule = { ...schedules[index], ...data }
  
  // 检查冲突
  const conflict = await checkConflict(updatedSchedule)
  if (conflict.hasConflict) {
    const typeMap = {
      teacher: '老师',
      classroom: '教室',
      student: '学生'
    }
    return {
      success: false,
      message: `${typeMap[conflict.conflictType!]}在该时间段已有排课`
    }
  }
  
  schedules[index] = updatedSchedule as ScheduleItem
  await storageAPI.write(STORAGE_FILES.SCHEDULES, schedules)
  return { success: true }
}

// 删除排课
export async function remove(id: string): Promise<void> {
  const schedules = await getAll()
  const filtered = schedules.filter(s => s.id !== id)
  await storageAPI.write(STORAGE_FILES.SCHEDULES, filtered)
}

// 根据ID获取排课
export async function getById(id: string): Promise<ScheduleItem | undefined> {
  const schedules = await getAll()
  return schedules.find(s => s.id === id)
}
