<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-date-picker v-model:value="filterDate" type="date" placeholder="筛选日期" clearable />
      <n-button type="primary" @click="showModal = true">添加排课</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredSchedules"
      :pagination="pagination"
    />

    <n-modal v-model:show="showModal" preset="card" title="排课信息" style="width: 600px">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="课程" path="courseId">
          <n-select
            v-model:value="formData.courseId"
            :options="courseOptions"
            placeholder="请选择课程"
            @update:value="handleCourseChange"
          />
        </n-form-item>
        <n-form-item label="学生" path="studentIds">
          <n-select
            v-model:value="formData.studentIds"
            :options="studentOptions"
            placeholder="请选择学生"
            multiple
          />
        </n-form-item>
        <n-form-item label="日期" path="date">
          <n-date-picker v-model:value="formData.dateTimestamp" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="开始时间" path="startTime">
          <n-time-picker v-model:formatted-value="formData.startTime" format="HH:mm" style="width: 100%" />
        </n-form-item>
        <n-form-item label="结束时间" path="endTime">
          <n-time-picker v-model:formatted-value="formData.endTime" format="HH:mm" style="width: 100%" />
        </n-form-item>
        <n-form-item label="状态" path="status">
          <n-select v-model:value="formData.status" :options="statusOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NSpace,
  NButton,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NDatePicker,
  NTimePicker,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { scheduleStorage, courseStorage, userStorage } from '../utils/storage'
import type { ScheduleItem } from '../types'

const message = useMessage()
const filterDate = ref<number | null>(null)
const showModal = ref(false)
const editingId = ref<string | null>(null)
const schedules = ref<ScheduleItem[]>(scheduleStorage.getAll())
const courses = ref(courseStorage.getAll())
const students = ref(userStorage.getAll().filter(u => u.role === 'student'))

const formData = ref<any>({
  courseId: '',
  courseName: '',
  teacherId: '',
  teacherName: '',
  studentIds: [],
  dateTimestamp: null,
  date: '',
  startTime: '',
  endTime: '',
  status: 'scheduled'
})

const rules = {
  courseId: { required: true, message: '请选择课程', trigger: 'change' },
  studentIds: { required: true, message: '请选择学生', trigger: 'change', type: 'array' as const },
  dateTimestamp: { required: true, message: '请选择日期', trigger: 'change' },
  startTime: { required: true, message: '请选择开始时间', trigger: 'blur' },
  endTime: { required: true, message: '请选择结束时间', trigger: 'blur' },
  status: { required: true, message: '请选择状态', trigger: 'change' }
}

const courseOptions = computed(() => {
  return courses.value.map(c => ({
    label: `${c.name} - ${c.teacherName}`,
    value: c.id
  }))
})

const studentOptions = computed(() => {
  return students.value.map(s => ({
    label: s.name,
    value: s.id
  }))
})

const statusOptions = [
  { label: '已安排', value: 'scheduled' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

const pagination = {
  pageSize: 10
}

const filteredSchedules = computed(() => {
  if (!filterDate.value) return schedules.value
  const filterDateStr = new Date(filterDate.value).toISOString().split('T')[0]
  return schedules.value.filter(s => s.date === filterDateStr)
})

const columns: DataTableColumns<ScheduleItem> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '课程名称', key: 'courseName' },
  { title: '教师', key: 'teacherName' },
  {
    title: '学生人数',
    key: 'studentIds',
    render(row) {
      return row.studentIds.length
    }
  },
  { title: '日期', key: 'date' },
  { title: '开始时间', key: 'startTime' },
  { title: '结束时间', key: 'endTime' },
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
      return h(NTag, { type: status.type as any }, () => status.text)
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              onClick: () => handleEdit(row)
            },
            { default: () => '编辑' }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => handleDelete(row.id)
            },
            { default: () => '删除' }
          )
        ]
      })
    }
  }
]

const handleCourseChange = (value: string) => {
  const course = courses.value.find(c => c.id === value)
  if (course) {
    formData.value.courseName = course.name
    formData.value.teacherId = course.teacherId
    formData.value.teacherName = course.teacherName
  }
}

const handleEdit = (schedule: ScheduleItem) => {
  editingId.value = schedule.id
  formData.value = {
    ...schedule,
    dateTimestamp: new Date(schedule.date).getTime()
  }
  showModal.value = true
}

const handleDelete = (id: string) => {
  scheduleStorage.delete(id)
  schedules.value = scheduleStorage.getAll()
  message.success('删除成功')
}

const handleSave = () => {
  if (!formData.value.courseId || !formData.value.studentIds.length || !formData.value.dateTimestamp || !formData.value.startTime || !formData.value.endTime) {
    message.error('请填写所有必填项')
    return
  }

  const date = new Date(formData.value.dateTimestamp!).toISOString().split('T')[0] as string

  if (editingId.value) {
    scheduleStorage.update(editingId.value, {
      ...formData.value,
      date
    })
    message.success('更新成功')
  } else {
    const newSchedule: ScheduleItem = {
      id: Date.now().toString(),
      courseId: formData.value.courseId!,
      courseName: formData.value.courseName!,
      teacherId: formData.value.teacherId!,
      teacherName: formData.value.teacherName!,
      studentIds: formData.value.studentIds!,
      date,
      startTime: formData.value.startTime!,
      endTime: formData.value.endTime!,
      status: formData.value.status!,
      createdAt: new Date().toISOString()
    }
    scheduleStorage.add(newSchedule)
    message.success('添加成功')
  }

  schedules.value = scheduleStorage.getAll()
  showModal.value = false
  editingId.value = null
  formData.value = {
    courseId: '',
    courseName: '',
    teacherId: '',
    teacherName: '',
    studentIds: [],
    dateTimestamp: null,
    date: '',
    startTime: '',
    endTime: '',
    status: 'scheduled'
  }
}
</script>
