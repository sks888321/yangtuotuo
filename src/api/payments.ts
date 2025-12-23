import { storageAPI, STORAGE_FILES } from '../utils/storage'
import type { Payment } from '../types'

// 获取所有缴费记录
export async function getAll(): Promise<Payment[]> {
  return await storageAPI.read<Payment>(STORAGE_FILES.PAYMENTS, [])
}

// 根据学生ID获取缴费记录
export async function getByStudent(studentId: string): Promise<Payment[]> {
  const payments = await getAll()
  return payments.filter(p => p.studentId === studentId)
}

// 根据日期范围获取缴费记录
export async function getByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
  const payments = await getAll()
  return payments.filter(p => p.paymentDate >= startDate && p.paymentDate <= endDate)
}

// 根据状态获取缴费记录
export async function getByStatus(status: 'paid' | 'pending' | 'refunded'): Promise<Payment[]> {
  const payments = await getAll()
  return payments.filter(p => p.status === status)
}

// 根据课程ID获取缴费记录
export async function getBySchedule(scheduleId: string): Promise<Payment[]> {
  const payments = await getAll()
  return payments.filter(p => p.scheduleIds.includes(scheduleId))
}

// 添加缴费记录
export async function add(payment: Payment): Promise<void> {
  const payments = await getAll()
  payments.push(payment)
  await storageAPI.write(STORAGE_FILES.PAYMENTS, payments)
}

// 更新缴费记录
export async function update(id: string, data: Partial<Payment>): Promise<void> {
  const payments = await getAll()
  const index = payments.findIndex(p => p.id === id)
  if (index !== -1) {
    payments[index] = { ...payments[index], ...data } as Payment
    await storageAPI.write(STORAGE_FILES.PAYMENTS, payments)
  }
}

// 删除缴费记录
export async function remove(id: string): Promise<void> {
  const payments = await getAll()
  const filtered = payments.filter(p => p.id !== id)
  await storageAPI.write(STORAGE_FILES.PAYMENTS, filtered)
}

// 获取统计信息
export async function getStatistics(): Promise<{
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  refundedAmount: number
}> {
  const payments = await getAll()
  
  return {
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    refundedAmount: payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0)
  }
}

// 根据ID获取缴费记录
export async function getById(id: string): Promise<Payment | undefined> {
  const payments = await getAll()
  return payments.find(p => p.id === id)
}
