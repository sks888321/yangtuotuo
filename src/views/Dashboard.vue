<template>
  <n-space vertical :size="24">
    <n-grid :x-gap="24" :y-gap="24" :cols="4">
      <n-grid-item>
        <n-card title="总用户数">
          <n-statistic :value="stats.totalUsers">
            <template #suffix>人</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="总课程数">
          <n-statistic :value="stats.totalCourses">
            <template #suffix>门</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="今日排课">
          <n-statistic :value="stats.todaySchedules">
            <template #suffix>节</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="待缴费">
          <n-statistic :value="stats.pendingPayments">
            <template #suffix>笔</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-card title="最近排课">
      <n-data-table
        :columns="scheduleColumns"
        :data="recentSchedules"
        :pagination="false"
      />
    </n-card>

    <n-card title="最近缴费">
      <n-data-table
        :columns="paymentColumns"
        :data="recentPayments"
        :pagination="false"
      />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { NSpace, NGrid, NGridItem, NCard, NStatistic, NDataTable, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { userStorage, courseStorage, scheduleStorage, paymentStorage } from '../utils/storage'
import type { ScheduleItem, Payment } from '../types'

const users = ref(userStorage.getAll())
const courses = ref(courseStorage.getAll())
const schedules = ref(scheduleStorage.getAll())
const payments = ref(paymentStorage.getAll())

const stats = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return {
    totalUsers: users.value.length,
    totalCourses: courses.value.length,
    todaySchedules: schedules.value.filter(s => s.date === today).length,
    pendingPayments: payments.value.filter(p => p.status === 'pending').length
  }
})

const recentSchedules = computed(() => {
  return schedules.value
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})

const recentPayments = computed(() => {
  return payments.value
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})

const scheduleColumns: DataTableColumns<ScheduleItem> = [
  { title: '课程名称', key: 'courseName' },
  { title: '教师', key: 'teacherName' },
  { title: '日期', key: 'date' },
  { title: '时间', key: 'startTime' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const statusMap = {
        scheduled: { text: '已安排', type: 'info' },
        completed: { text: '已完成', type: 'success' },
        cancelled: { text: '已取消', type: 'error' }
      }
      const status = statusMap[row.status] || { text: row.status, type: 'default' }
      return h(NTag, { type: status.type as any }, { default: () => status.text })
    }
  }
]

const paymentColumns: DataTableColumns<Payment> = [
  { title: '学生', key: 'studentName' },
  { title: '课程', key: 'courseName' },
  { 
    title: '金额', 
    key: 'amount',
    render(row) {
      return `¥${row.amount}`
    }
  },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const statusMap = {
        pending: { text: '待支付', type: 'warning' },
        paid: { text: '已支付', type: 'success' },
        refunded: { text: '已退款', type: 'error' }
      }
      const status = statusMap[row.status] || { text: row.status, type: 'default' }
      return h(NTag, { type: status.type as any }, { default: () => status.text })
    }
  }
]

onMounted(() => {
  // Refresh data
  users.value = userStorage.getAll()
  courses.value = courseStorage.getAll()
  schedules.value = scheduleStorage.getAll()
  payments.value = paymentStorage.getAll()
})
</script>
