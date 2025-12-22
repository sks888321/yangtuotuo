import type { User, Course, ScheduleItem, Payment } from '../types'

// Storage keys
const STORAGE_KEYS = {
  USERS: 'yangtuotuo_users',
  COURSES: 'yangtuotuo_courses',
  SCHEDULES: 'yangtuotuo_schedules',
  PAYMENTS: 'yangtuotuo_payments'
}

// Generic storage functions
function getFromStorage<T>(key: string, defaultValue: T[] = []): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error(`Error reading from storage (${key}):`, error)
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error)
  }
}

// Initialize with sample data if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const sampleUsers: User[] = [
      {
        id: '1',
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '13800138000',
        role: 'student',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '李老师',
        email: 'liteacher@example.com',
        phone: '13900139000',
        role: 'teacher',
        createdAt: new Date().toISOString()
      }
    ]
    saveToStorage(STORAGE_KEYS.USERS, sampleUsers)
  }

  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    const sampleCourses: Course[] = [
      {
        id: '1',
        name: '数学基础',
        description: '小学数学基础课程',
        teacherId: '2',
        teacherName: '李老师',
        price: 100,
        duration: 60,
        capacity: 20,
        createdAt: new Date().toISOString()
      }
    ]
    saveToStorage(STORAGE_KEYS.COURSES, sampleCourses)
  }

  if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
    saveToStorage(STORAGE_KEYS.SCHEDULES, [])
  }

  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    saveToStorage(STORAGE_KEYS.PAYMENTS, [])
  }
}

// User storage
export const userStorage = {
  getAll: (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS),
  save: (users: User[]) => saveToStorage(STORAGE_KEYS.USERS, users),
  add: (user: User) => {
    const users = userStorage.getAll()
    users.push(user)
    userStorage.save(users)
  },
  update: (id: string, updates: Partial<User>) => {
    const users = userStorage.getAll()
    const index = users.findIndex(u => u.id === id)
    if (index !== -1) {
      users[index] = { ...users[index], ...updates }
      userStorage.save(users)
    }
  },
  delete: (id: string) => {
    const users = userStorage.getAll().filter(u => u.id !== id)
    userStorage.save(users)
  }
}

// Course storage
export const courseStorage = {
  getAll: (): Course[] => getFromStorage<Course>(STORAGE_KEYS.COURSES),
  save: (courses: Course[]) => saveToStorage(STORAGE_KEYS.COURSES, courses),
  add: (course: Course) => {
    const courses = courseStorage.getAll()
    courses.push(course)
    courseStorage.save(courses)
  },
  update: (id: string, updates: Partial<Course>) => {
    const courses = courseStorage.getAll()
    const index = courses.findIndex(c => c.id === id)
    if (index !== -1) {
      courses[index] = { ...courses[index], ...updates }
      courseStorage.save(courses)
    }
  },
  delete: (id: string) => {
    const courses = courseStorage.getAll().filter(c => c.id !== id)
    courseStorage.save(courses)
  }
}

// Schedule storage
export const scheduleStorage = {
  getAll: (): ScheduleItem[] => getFromStorage<ScheduleItem>(STORAGE_KEYS.SCHEDULES),
  save: (schedules: ScheduleItem[]) => saveToStorage(STORAGE_KEYS.SCHEDULES, schedules),
  add: (schedule: ScheduleItem) => {
    const schedules = scheduleStorage.getAll()
    schedules.push(schedule)
    scheduleStorage.save(schedules)
  },
  update: (id: string, updates: Partial<ScheduleItem>) => {
    const schedules = scheduleStorage.getAll()
    const index = schedules.findIndex(s => s.id === id)
    if (index !== -1) {
      schedules[index] = { ...schedules[index], ...updates }
      scheduleStorage.save(schedules)
    }
  },
  delete: (id: string) => {
    const schedules = scheduleStorage.getAll().filter(s => s.id !== id)
    scheduleStorage.save(schedules)
  }
}

// Payment storage
export const paymentStorage = {
  getAll: (): Payment[] => getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS),
  save: (payments: Payment[]) => saveToStorage(STORAGE_KEYS.PAYMENTS, payments),
  add: (payment: Payment) => {
    const payments = paymentStorage.getAll()
    payments.push(payment)
    paymentStorage.save(payments)
  },
  update: (id: string, updates: Partial<Payment>) => {
    const payments = paymentStorage.getAll()
    const index = payments.findIndex(p => p.id === id)
    if (index !== -1) {
      payments[index] = { ...payments[index], ...updates }
      paymentStorage.save(payments)
    }
  },
  delete: (id: string) => {
    const payments = paymentStorage.getAll().filter(p => p.id !== id)
    paymentStorage.save(payments)
  }
}

// Initialize storage on load
initializeStorage()
