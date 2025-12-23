<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-button type="primary" @click="handleCreateNew" :disabled="loading">
        <template #icon>
          <n-icon><Add /></n-icon>
        </template>
        新建排课
      </n-button>
    </n-space>

    <!-- 周课程表 -->
    <weekly-calendar ref="calendarRef" @edit-schedule="handleEdit" @create-schedule="handleCreate" />

    <!-- 排课列表 -->
    <n-card title="排课列表">
      <n-data-table
        :columns="columns"
        :data="schedules"
        :pagination="pagination"
      />
    </n-card>

    <!-- 排课表单 -->
    <n-modal v-model:show="showModal" preset="card" title="排课信息" style="width: 700px">
      <n-form ref="formRef" :model="formData">
        <n-form-item label="课程类型" path="courseTypeId">
          <n-select 
            v-model:value="formData.courseTypeId" 
            :options="courseTypeOptions"
            @update:value="handleCourseTypeChange"
            placeholder="请选择课程类型"
          />
        </n-form-item>
        <n-form-item label="老师" path="teacherId">
          <n-select 
            v-model:value="formData.teacherId" 
            :options="teacherOptions"
            @update:value="handleTeacherChange"
            placeholder="请选择老师"
          />
        </n-form-item>
        <n-form-item label="教室" path="classroomId">
          <n-select 
            v-model:value="formData.classroomId" 
            :options="classroomOptions"
            @update:value="handleClassroomChange"
            placeholder="请选择教室"
          />
        </n-form-item>
        <n-form-item label="学生" path="students">
          <n-select 
            v-model:value="formData.students" 
            :options="studentOptions"
            multiple
            placeholder="请选择学生"
          />
        </n-form-item>
        <n-form-item label="日期" path="dateTimestamp">
          <n-date-picker 
            v-model:value="formData.dateTimestamp" 
            type="date"
            placeholder="请选择日期"
            clearable
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="开始时间" path="startTime">
          <n-time-picker 
            v-model:formatted-value="formData.startTime" 
            value-format="HH:mm"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="结束时间" path="endTime">
          <n-time-picker 
            v-model:formatted-value="formData.endTime" 
            value-format="HH:mm"
            placeholder="请选择结束时间"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="课程费用">
          <n-input-number v-model:value="formData.fee" placeholder="自动计算" :min="0" disabled style="width: 100%" />
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
import { ref, computed, h, onMounted, onUnmounted } from 'vue'
import {
  NSpace,
  NButton,
  NCard,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NDatePicker,
  NTimePicker,
  NInputNumber,
  NTag,
  NIcon,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Add } from '@vicons/ionicons5'
import { scheduleAPI, teacherAPI, studentAPI, classroomAPI, courseTypeAPI } from '../api'
import type { ScheduleItem, Teacher, Student, Classroom, CourseType } from '../types'
import WeeklyCalendar from '../components/WeeklyCalendar.vue'
import { dataCache } from '../utils/cache'

const message = useMessage()
const showModal = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)
const calendarRef = ref()

const schedules = ref<ScheduleItem[]>([])
const teachers = ref<Teacher[]>([])
const students = ref<Student[]>([])
const classrooms = ref<Classroom[]>([])
const courseTypes = ref<CourseType[]>([])

const formData = ref<any>({
  courseTypeId: '',
  courseTypeName: '',
  teacherId: '',
  teacherName: '',
  classroomId: '',
  classroomName: '',
  students: [],
  studentNames: [],
  dateTimestamp: Date.now(),
  date: new Date().toLocaleDateString('zh-CN').replace(/\//g, '.'),
  startTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  endTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  fee: 0,
  status: 'scheduled'
})

const statusOptions = [
  { label: '已排课', value: 'scheduled' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

const pagination = {
  pageSize: 10
}

const courseTypeOptions = computed(() => 
  courseTypes.value.map(ct => ({
    label: `${ct.name} (${ct.type === 'one-on-one' ? '1对1' : '大课'})`,
    value: ct.id
  }))
)

const teacherOptions = computed(() => 
  teachers.value.filter(t => t.status === 'active').map(t => ({
    label: `${t.name} (${t.level === 'junior' ? '初级' : t.level === 'intermediate' ? '中级' : '高级'})`,
    value: t.id
  }))
)

const classroomOptions = computed(() => 
  classrooms.value.filter(c => c.status === 'available').map(c => ({
    label: `${c.name} (容纳${c.capacity}人)`,
    value: c.id
  }))
)

const studentOptions = computed(() => 
  students.value.filter(s => s.status === 'active').map(s => ({
    label: `${s.name} (${s.age}岁)`,
    value: s.id
  }))
)

const columns: DataTableColumns<ScheduleItem> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '日期', key: 'date' },
  { key: 'time', title: '时间', render: (row) => `${row.startTime}-${row.endTime}` },
  { title: '课程类型', key: 'courseTypeName' },
  { title: '老师', key: 'teacherName' },
  { title: '教室', key: 'classroomName' },
  { key: 'studentCount', title: '学生人数', render: (row) => row.students.length },
  { key: 'fee', title: '费用', render: (row) => `¥${row.fee}` },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const statusMap = {
        scheduled: { text: '已排课', type: 'info' },
        completed: { text: '已完成', type: 'success' },
        cancelled: { text: '已取消', type: 'default' }
      }
      const status = statusMap[row.status]
      return h(NTag, { type: status.type as any }, { default: () => status.text })
    }
  },
  {
    title: '操作',
    key: 'actions',
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

const handleCourseTypeChange = (value: string) => {
  const courseType = courseTypes.value.find(ct => ct.id === value)
  if (courseType) {
    formData.value.courseTypeName = courseType.name
    calculateFee()
  }
}

const handleTeacherChange = (value: string) => {
  const teacher = teachers.value.find(t => t.id === value)
  if (teacher) {
    formData.value.teacherName = teacher.name
    calculateFee()
  }
}

const handleClassroomChange = (value: string) => {
  const classroom = classrooms.value.find(c => c.id === value)
  if (classroom) {
    formData.value.classroomName = classroom.name
  }
}

const calculateFee = () => {
  const courseType = courseTypes.value.find(ct => ct.id === formData.value.courseTypeId)
  const teacher = teachers.value.find(t => t.id === formData.value.teacherId)
  
  if (courseType && teacher) {
    const hours = courseType.duration / 60
    if (courseType.type === 'one-on-one') {
      formData.value.fee = teacher.hourlyRate * hours
    } else {
      formData.value.fee = teacher.groupRate * hours
    }
  }
}

const handleCreateNew = () => {
  editingId.value = null
  const now = new Date()
  formData.value = {
    courseTypeId: '',
    courseTypeName: '',
    teacherId: '',
    teacherName: '',
    classroomId: '',
    classroomName: '',
    students: [],
    studentNames: [],
    dateTimestamp: now.getTime(),
    date: now.toLocaleDateString('zh-CN').replace(/\//g, '.'),
    startTime: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    endTime: new Date(now.getTime() + 3600000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    fee: 0,
    status: 'scheduled'
  }
  console.log('Creating new schedule:', formData.value)
  showModal.value = true
}

const handleCreate = (data: any) => {
  editingId.value = null
  const targetDate = new Date(data.date)
  const dateStr = targetDate.toLocaleDateString('zh-CN').replace(/\//g, '.')
  const now = new Date()
  formData.value = {
    courseTypeId: '',
    courseTypeName: '',
    teacherId: '',
    teacherName: '',
    classroomId: '',
    classroomName: '',
    students: [],
    studentNames: [],
    dateTimestamp: targetDate.getTime(),
    date: dateStr,
    startTime: data.time || now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    endTime: new Date(now.getTime() + 3600000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    fee: 0,
    status: 'scheduled'
  }
  showModal.value = true
}

const handleEdit = (schedule: ScheduleItem) => {
  editingId.value = schedule.id
  // 将 YYYY.MM.DD 格式转换为 Date 对象
  const dateStr = schedule.date.replace(/\./g, '-')
  formData.value = {
    ...schedule,
    dateTimestamp: new Date(dateStr).getTime()
  }
  showModal.value = true
}

const handleDelete = async (id: string) => {
  await scheduleAPI.remove(id)
  await loadSchedules()
  calendarRef.value?.refresh()
  message.success('删除成功')
}

const handleSave = async () => {
  if (!formData.value.courseTypeId || !formData.value.teacherId || !formData.value.classroomId || 
      !formData.value.students.length || !formData.value.dateTimestamp || 
      !formData.value.startTime || !formData.value.endTime) {
    message.error('请填写所有必填项')
    return
  }

  const dateObj = new Date(formData.value.dateTimestamp)
  const date = dateObj.toLocaleDateString('zh-CN').replace(/\//g, '.')
  
  // 获取学生姓名
  const studentNames = students.value
    .filter(s => formData.value.students.includes(s.id))
    .map(s => s.name)

  const scheduleData: ScheduleItem = {
    id: editingId.value || Date.now().toString(),
    courseTypeId: formData.value.courseTypeId,
    courseTypeName: formData.value.courseTypeName,
    teacherId: formData.value.teacherId,
    teacherName: formData.value.teacherName,
    classroomId: formData.value.classroomId,
    classroomName: formData.value.classroomName,
    students: formData.value.students,
    studentNames,
    date: date,
    startTime: formData.value.startTime,
    endTime: formData.value.endTime,
    fee: formData.value.fee,
    status: formData.value.status,
    createTime: new Date().toISOString()
  }

  if (editingId.value) {
    const result = await scheduleAPI.update(editingId.value, scheduleData)
    if (!result.success) {
      message.error(result.message || '更新失败')
      return
    }
    message.success('更新成功')
  } else {
    const result = await scheduleAPI.add(scheduleData)
    if (!result.success) {
      message.error(result.message || '添加失败')
      return
    }
    message.success('添加成功')
  }

  await loadSchedules()
  calendarRef.value?.refresh()
  showModal.value = false
  editingId.value = null
}

async function loadSchedules() {
  try {
    const schedulesData = await scheduleAPI.getAll()
    schedules.value = schedulesData
    dataCache.setSchedules(schedulesData)
  } catch (error) {
    console.error('Failed to load schedules:', error)
    message.error('加载排课数据失败')
  }
}

onMounted(async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    if (dataCache.isCourseTypesLoaded() && dataCache.isTeachersLoaded() && 
        dataCache.isStudentsLoaded() && dataCache.isClassroomsLoaded() && 
        dataCache.isSchedulesLoaded()) {
      courseTypes.value = dataCache.getCourseTypes()
      teachers.value = dataCache.getTeachers()
      students.value = dataCache.getStudents()
      classrooms.value = dataCache.getClassrooms()
      schedules.value = dataCache.getSchedules()
    } else {
      const [courseTypesData, teachersData, studentsData, classroomsData] = await Promise.all([
        courseTypeAPI.getAll(),
        teacherAPI.getAll(),
        studentAPI.getAll(),
        classroomAPI.getAll()
      ])
      courseTypes.value = courseTypesData
      teachers.value = teachersData
      students.value = studentsData
      classrooms.value = classroomsData
      
      dataCache.setCourseTypes(courseTypesData)
      dataCache.setTeachers(teachersData)
      dataCache.setStudents(studentsData)
      dataCache.setClassrooms(classroomsData)
      
      // 确保也加载排课数据
      if (!dataCache.isSchedulesLoaded()) {
        await loadSchedules()
      }
    }
  } catch (error) {
    console.error('Failed to load data:', error)
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  loading.value = false
  showModal.value = false
})
</script>
