export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'student' | 'teacher' | 'admin'
  createdAt: string
}

export interface Course {
  id: string
  name: string
  description: string
  teacherId: string
  teacherName: string
  price: number
  duration: number // minutes
  capacity: number
  createdAt: string
}

export interface ScheduleItem {
  id: string
  courseId: string
  courseName: string
  teacherId: string
  teacherName: string
  studentIds: string[]
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'completed' | 'cancelled'
  createdAt: string
}

export interface Payment {
  id: string
  studentId: string
  studentName: string
  courseId: string
  courseName: string
  amount: number
  status: 'pending' | 'paid' | 'refunded'
  paymentDate?: string
  createdAt: string
}
