<template>
  <div class="weekly-calendar">
    <!-- 日期导航 -->
    <n-space justify="space-between" style="margin-bottom: 16px">
      <n-button @click="previousWeek">
        <template #icon>
          <n-icon><ChevronBack /></n-icon>
        </template>
        上一天
      </n-button>
      <n-space>
        <span style="font-size: 16px; font-weight: 500">
          {{ weekRange }}
        </span>
        <n-button @click="goToToday">今天</n-button>
      </n-space>
      <n-button @click="nextWeek">
        下一天
        <template #icon>
          <n-icon><ChevronForward /></n-icon>
        </template>
      </n-button>
    </n-space>

    <!-- 课程表 -->
    <div class="calendar-grid">
      <div class="time-column">
        <div class="time-header">时间/教室</div>
        <div
          v-for="slot in timeSlots"
          :key="slot.hour"
          class="time-cell"
        >
          {{ slot.display }}
        </div>
      </div>
      <div
        v-for="classroom in classrooms"
        :key="classroom.id"
        class="classroom-column"
      >
        <div class="classroom-header">
          <div>{{ classroom.name }}</div>
          <div class="classroom-capacity">{{ classroom.capacity }}人</div>
        </div>
        <div
          v-for="slot in timeSlots"
          :key="`${classroom.id}-${slot.hour}`"
          class="schedule-cell"
          :class="{ 'has-schedule': getClassroomSchedule(classroom.id, slot) }"
          @click="handleCellClick(classroom.id, slot)"
        >
          <div
            v-if="getClassroomSchedule(classroom.id, slot)"
            class="schedule-item"
            :class="`status-${getClassroomSchedule(classroom.id, slot)?.status}`"
          >
            <div class="schedule-course">{{ getClassroomSchedule(classroom.id, slot)?.courseTypeName }}</div>
            <div class="schedule-teacher">{{ getClassroomSchedule(classroom.id, slot)?.teacherName }}</div>
            <div class="schedule-time">{{ getClassroomSchedule(classroom.id, slot)?.startTime }}</div>
          </div>
          <div v-else class="empty-slot">空闲</div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <n-modal v-model:show="showDetailModal" preset="card" title="课程详情" style="width: 500px">
      <div v-if="selectedSchedule">
        <n-descriptions :column="4" bordered>
          <n-descriptions-item label="课程类型">{{ selectedSchedule.courseTypeName }}</n-descriptions-item>
          <n-descriptions-item label="老师">{{ selectedSchedule.teacherName }}</n-descriptions-item>
          <n-descriptions-item label="教室">{{ selectedSchedule.classroomName }}</n-descriptions-item>
          <n-descriptions-item label="日期">{{ selectedSchedule.date }}</n-descriptions-item>
          <n-descriptions-item label="时间">{{ selectedSchedule.startTime }} - {{ selectedSchedule.endTime }}</n-descriptions-item>
          <n-descriptions-item label="学生数">{{ selectedSchedule.students.length }}人</n-descriptions-item>
          <n-descriptions-item label="学生">
            {{ selectedSchedule.studentNames?.join('、') || '未知' }}
          </n-descriptions-item>
          <n-descriptions-item label="费用">¥{{ selectedSchedule.fee }}</n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="getStatusType(selectedSchedule.status)">
              {{ getStatusText(selectedSchedule.status) }}
            </n-tag>
          </n-descriptions-item>
        </n-descriptions>
        <n-space style="margin-top: 20px" justify="end">
          <n-button @click="showDetailModal = false">关闭</n-button>
          <n-button type="primary" @click="editSchedule">编辑</n-button>
        </n-space>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  NButton,
  NSpace,
  NIcon,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NTag
} from 'naive-ui'
import { ChevronBack, ChevronForward } from '@vicons/ionicons5'
import { scheduleAPI, courseTypeAPI, classroomAPI } from '../api'
import type { ScheduleItem, TimeSlot, CourseType, Classroom } from '../types'
import { dataCache } from '../utils/cache'

const emit = defineEmits(['edit-schedule', 'create-schedule'])

const currentDate = ref(new Date())
const schedules = ref<ScheduleItem[]>([])
const courseTypes = ref<CourseType[]>([])
const classrooms = ref<Classroom[]>([])
const loading = ref(false)
const mounted = ref(false)
const showDetailModal = ref(false)
const selectedSchedule = ref<ScheduleItem | null>(null)

// 时间槽（9:00-22:00，每小时一个槽）
const timeSlots = computed<TimeSlot[]>(() => {
  const slots: TimeSlot[] = []
  for (let hour = 9; hour <= 22; hour++) {
    slots.push({
      hour,
      minute: 0,
      display: `${hour.toString().padStart(2, '0')}:00`
    })
  }
  return slots
})

// 当前日期显示
const currentDateStr = computed(() => {
  const date = currentDate.value
  return date.toLocaleDateString('zh-CN').replace(/\//g, '.')
})

// 周范围显示
const weekRange = computed(() => {
  const date = currentDate.value
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
})

// 获取教室在某个时间槽的排课
function getClassroomSchedule(classroomId: string, slot: TimeSlot): ScheduleItem | null {
  const schedule = schedules.value.find(s => {
    if (s.classroomId !== classroomId) return false
    if (s.date !== currentDateStr.value) return false
    const scheduleHour = parseInt((s.startTime || '').split(':')[0] || '0')
    return scheduleHour === slot.hour
  })
  return schedule || null
}

// 状态文本
function getStatusText(status: string) {
  const map: Record<string, string> = {
    scheduled: '已排课',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

// 状态类型
function getStatusType(status: string) {
  const map: Record<string, any> = {
    scheduled: 'info',
    completed: 'success',
    cancelled: 'default'
  }
  return map[status] || 'default'
}

// 点击单元格
function handleCellClick(classroomId: string, slot: TimeSlot) {
  const schedule = getClassroomSchedule(classroomId, slot)
  if (schedule) {
    // 有课程，显示详情
    selectedSchedule.value = schedule
    showDetailModal.value = true
  } else {
    // 空闲，创建新排课
    emit('create-schedule', { date: currentDateStr.value, time: slot.display, classroomId })
  }
}

// 编辑课程
function editSchedule() {
  if (selectedSchedule.value) {
    emit('edit-schedule', selectedSchedule.value)
    showDetailModal.value = false
  }
}

// 上一天
function previousWeek() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() - 1)
  currentDate.value = newDate
  if (mounted.value) {
    loadSchedules()
  }
}

// 下一天
function nextWeek() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + 1)
  currentDate.value = newDate
  if (mounted.value) {
    loadSchedules()
  }
}

// 回到今天
function goToToday() {
  currentDate.value = new Date()
  if (mounted.value) {
    loadSchedules()
  }
}

// 加载课程数据
async function loadSchedules() {
  if (loading.value) return

  try {
    loading.value = true
    const dateStr = currentDateStr.value
    schedules.value = await scheduleAPI.getByDate(dateStr)
  } catch (error) {
    console.error('Failed to load schedules:', error)
  } finally {
    loading.value = false
  }
}

// 加载教室数据
async function loadClassrooms() {
  if (dataCache.isClassroomsLoaded()) {
    classrooms.value = dataCache.getClassrooms()
    return
  }

  if (classrooms.value.length > 0) return

  try {
    const classroomsData = await classroomAPI.getAll()
    classrooms.value = classroomsData
    dataCache.setClassrooms(classroomsData)
  } catch (error) {
    console.error('Failed to load classrooms:', error)
  }
}

// 加载课程类型
async function loadCourseTypes() {
  if (dataCache.isCourseTypesLoaded()) {
    courseTypes.value = dataCache.getCourseTypes()
    return
  }

  if (courseTypes.value.length > 0) return

  try {
    const courseTypesData = await courseTypeAPI.getAll()
    courseTypes.value = courseTypesData
    dataCache.setCourseTypes(courseTypesData)
  } catch (error) {
    console.error('Failed to load course types:', error)
  }
}

onMounted(async () => {
  mounted.value = true
  await loadCourseTypes()
  await loadClassrooms()
  await loadSchedules()
})

onUnmounted(() => {
  mounted.value = false
  schedules.value = []
  showDetailModal.value = false
  selectedSchedule.value = null
})

defineExpose({
  refresh: async () => {
    if (mounted.value) {
      await loadSchedules()
    }
  }
})
</script>

<style scoped>
.weekly-calendar {
  width: 100%;
}

.calendar-grid {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.time-column {
  flex-shrink: 0;
  width: 80px;
  border-right: 1px solid #e0e0e0;
}

.time-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
  font-weight: 500;
  font-size: 13px;
}

.time-cell {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
  background-color: #fafafa;
}

.classroom-column {
  flex: 1;
  min-width: 120px;
  border-right: 1px solid #e0e0e0;
}

.classroom-column:last-child {
  border-right: none;
}

.classroom-header {
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
  font-weight: 500;
  font-size: 14px;
}

.classroom-capacity {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  font-weight: normal;
}

.schedule-cell {
  height: 80px;
  border-bottom: 1px solid #e0e0e0;
  padding: 4px;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-cell:hover {
  background-color: #f5f5f5;
}

.schedule-cell.has-schedule {
  background-color: #fff;
}

.empty-slot {
  color: #999;
  font-size: 12px;
  user-select: none;
}

.schedule-item {
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  transition: transform 0.2s;
  text-align: center;
}

.schedule-item:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.schedule-item.status-scheduled {
  background-color: #e3f2fd;
  border-left: 3px solid #2080f0;
}

.schedule-item.status-completed {
  background-color: #e8f5e9;
  border-left: 3px solid #18a058;
}

.schedule-item.status-cancelled {
  background-color: #f5f5f5;
  border-left: 3px solid #999;
  opacity: 0.6;
}

.schedule-time {
  font-weight: 400;
  color: #666;
  font-size: 11px;
  margin-top: 2px;
}

.schedule-course {
  font-weight: 500;
  margin-bottom: 3px;
  font-size: 13px;
}

.schedule-teacher {
  color: #666;
  font-size: 11px;
  margin-bottom: 2px;
}

.schedule-students {
  color: #999;
  font-size: 11px;
  margin-top: 2px;
}
</style>
