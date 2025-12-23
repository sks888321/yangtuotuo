// 数据缓存管理 - 减少重复加载
import { ref } from 'vue'
import type { Teacher, Student, Classroom, CourseType, ScheduleItem, Payment } from '../types'

// 缓存数据
const cachedTeachers = ref<Teacher[]>([])
const cachedStudents = ref<Student[]>([])
const cachedClassrooms = ref<Classroom[]>([])
const cachedCourseTypes = ref<CourseType[]>([])
const cachedSchedules = ref<ScheduleItem[]>([])
const cachedPayments = ref<Payment[]>([])

// 缓存状态
const cacheStatus = {
  teachers: { loaded: false, loading: false },
  students: { loaded: false, loading: false },
  classrooms: { loaded: false, loading: false },
  courseTypes: { loaded: false, loading: false },
  schedules: { loaded: false, loading: false },
  payments: { loaded: false, loading: false }
}

// 缓存时间戳
const cacheTimestamps = {
  teachers: 0,
  students: 0,
  classrooms: 0,
  courseTypes: 0,
  schedules: 0,
  payments: 0
}

// 缓存过期时间（5分钟）
const CACHE_EXPIRE_TIME = 5 * 60 * 1000

// 检查缓存是否过期
function isCacheExpired(key: keyof typeof cacheTimestamps): boolean {
  const timestamp = cacheTimestamps[key]
  return Date.now() - timestamp > CACHE_EXPIRE_TIME
}

// 更新缓存时间戳
function updateTimestamp(key: keyof typeof cacheTimestamps) {
  cacheTimestamps[key] = Date.now()
}

export const dataCache = {
  // 老师缓存
  getTeachers: () => cachedTeachers.value,
  setTeachers: (data: Teacher[]) => {
    cachedTeachers.value = data
    cacheStatus.teachers.loaded = true
    updateTimestamp('teachers')
  },
  isTeachersLoaded: () => cacheStatus.teachers.loaded && !isCacheExpired('teachers'),
  isTeachersLoading: () => cacheStatus.teachers.loading,
  setTeachersLoading: (loading: boolean) => { cacheStatus.teachers.loading = loading },

  // 学生缓存
  getStudents: () => cachedStudents.value,
  setStudents: (data: Student[]) => {
    cachedStudents.value = data
    cacheStatus.students.loaded = true
    updateTimestamp('students')
  },
  isStudentsLoaded: () => cacheStatus.students.loaded && !isCacheExpired('students'),
  isStudentsLoading: () => cacheStatus.students.loading,
  setStudentsLoading: (loading: boolean) => { cacheStatus.students.loading = loading },

  // 教室缓存
  getClassrooms: () => cachedClassrooms.value,
  setClassrooms: (data: Classroom[]) => {
    cachedClassrooms.value = data
    cacheStatus.classrooms.loaded = true
    updateTimestamp('classrooms')
  },
  isClassroomsLoaded: () => cacheStatus.classrooms.loaded && !isCacheExpired('classrooms'),
  isClassroomsLoading: () => cacheStatus.classrooms.loading,
  setClassroomsLoading: (loading: boolean) => { cacheStatus.classrooms.loading = loading },

  // 课程类型缓存
  getCourseTypes: () => cachedCourseTypes.value,
  setCourseTypes: (data: CourseType[]) => {
    cachedCourseTypes.value = data
    cacheStatus.courseTypes.loaded = true
    updateTimestamp('courseTypes')
  },
  isCourseTypesLoaded: () => cacheStatus.courseTypes.loaded && !isCacheExpired('courseTypes'),
  isCourseTypesLoading: () => cacheStatus.courseTypes.loading,
  setCourseTypesLoading: (loading: boolean) => { cacheStatus.courseTypes.loading = loading },

  // 排课缓存
  getSchedules: () => cachedSchedules.value,
  setSchedules: (data: ScheduleItem[]) => {
    cachedSchedules.value = data
    cacheStatus.schedules.loaded = true
    updateTimestamp('schedules')
  },
  isSchedulesLoaded: () => cacheStatus.schedules.loaded && !isCacheExpired('schedules'),
  isSchedulesLoading: () => cacheStatus.schedules.loading,
  setSchedulesLoading: (loading: boolean) => { cacheStatus.schedules.loading = loading },

  // 缴费缓存
  getPayments: () => cachedPayments.value,
  setPayments: (data: Payment[]) => {
    cachedPayments.value = data
    cacheStatus.payments.loaded = true
    updateTimestamp('payments')
  },
  isPaymentsLoaded: () => cacheStatus.payments.loaded && !isCacheExpired('payments'),
  isPaymentsLoading: () => cacheStatus.payments.loading,
  setPaymentsLoading: (loading: boolean) => { cacheStatus.payments.loading = loading },

  // 清除所有缓存
  clearAll: () => {
    cachedTeachers.value = []
    cachedStudents.value = []
    cachedClassrooms.value = []
    cachedCourseTypes.value = []
    cachedSchedules.value = []
    cachedPayments.value = []
    Object.keys(cacheStatus).forEach(key => {
      const k = key as keyof typeof cacheStatus
      cacheStatus[k].loaded = false
      cacheStatus[k].loading = false
    })
    Object.keys(cacheTimestamps).forEach(key => {
      cacheTimestamps[key as keyof typeof cacheTimestamps] = 0
    })
  },

  // 清除特定缓存
  invalidate: (key: 'teachers' | 'students' | 'classrooms' | 'courseTypes' | 'schedules' | 'payments') => {
    cacheStatus[key].loaded = false
    cacheTimestamps[key] = 0
  }
}
