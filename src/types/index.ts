// 老师信息
export interface Teacher {
  id: string
  name: string
  phone: string
  level: 'junior' | 'intermediate' | 'senior' // 初级、中级、高级
  hourlyRate: number // 1对1课程时薪
  groupRate: number  // 大课时薪
  status: 'active' | 'inactive'
  createTime: string
}

// 学生信息
export interface Student {
  id: string
  name: string
  phone: string
  age: number
  parentName: string
  parentPhone: string
  status: 'active' | 'inactive'
  createTime: string
}

// 教室信息
export interface Classroom {
  id: string
  name: string
  capacity: number // 最大容纳人数
  equipment: string
  status: 'available' | 'occupied' | 'maintenance'
  createTime: string
}

// 课程类型
export interface CourseType {
  id: string
  name: string
  type: 'one-on-one' | 'group' // 1对1或大课
  duration: number // 课时长（分钟）
  description: string
}

// 课程安排
export interface ScheduleItem {
  id: string
  courseTypeId: string
  courseTypeName?: string
  teacherId: string
  teacherName?: string
  classroomId: string
  classroomName?: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  students: string[] // 学生ID数组
  studentNames?: string[] // 学生姓名数组（用于显示）
  status: 'scheduled' | 'completed' | 'cancelled'
  fee: number // 课程费用
  createTime: string
}

// 缴费记录
export interface Payment {
  id: string
  studentId: string
  studentName?: string
  scheduleIds: string[] // 关联的课程ID数组
  amount: number
  paymentDate: string
  paymentMethod: string // 微信支付、支付宝、现金等
  status: 'paid' | 'pending' | 'refunded'
  createTime: string
}

// 周课程表数据结构
export interface WeekSchedule {
  date: string
  day: string
  schedules: ScheduleItem[]
}

// 时间槽
export interface TimeSlot {
  hour: number
  minute: number
  display: string
}

