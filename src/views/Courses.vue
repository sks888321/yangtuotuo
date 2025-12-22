<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-input v-model:value="searchText" placeholder="搜索课程..." style="width: 300px" />
      <n-button type="primary" @click="showModal = true">添加课程</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredCourses"
      :pagination="pagination"
    />

    <n-modal v-model:show="showModal" preset="card" title="课程信息" style="width: 600px">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="课程名称" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入课程名称" />
        </n-form-item>
        <n-form-item label="课程描述" path="description">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入课程描述"
            :rows="3"
          />
        </n-form-item>
        <n-form-item label="授课教师" path="teacherId">
          <n-select
            v-model:value="formData.teacherId"
            :options="teacherOptions"
            placeholder="请选择教师"
            @update:value="handleTeacherChange"
          />
        </n-form-item>
        <n-form-item label="课程价格" path="price">
          <n-input-number v-model:value="formData.price" placeholder="请输入价格" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="课程时长(分钟)" path="duration">
          <n-input-number v-model:value="formData.duration" placeholder="请输入时长" :min="1" style="width: 100%" />
        </n-form-item>
        <n-form-item label="课程容量" path="capacity">
          <n-input-number v-model:value="formData.capacity" placeholder="请输入容量" :min="1" style="width: 100%" />
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
  NInput,
  NInputNumber,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { courseStorage, userStorage } from '../utils/storage'
import type { Course } from '../types'

const message = useMessage()
const searchText = ref('')
const showModal = ref(false)
const editingId = ref<string | null>(null)
const courses = ref<Course[]>(courseStorage.getAll())
const teachers = ref(userStorage.getAll().filter(u => u.role === 'teacher'))

const formData = ref<Partial<Course>>({
  name: '',
  description: '',
  teacherId: '',
  teacherName: '',
  price: 0,
  duration: 60,
  capacity: 20
})

const rules = {
  name: { required: true, message: '请输入课程名称', trigger: 'blur' },
  description: { required: true, message: '请输入课程描述', trigger: 'blur' },
  teacherId: { required: true, message: '请选择教师', trigger: 'change' },
  price: { required: true, message: '请输入价格', trigger: 'blur', type: 'number' as const },
  duration: { required: true, message: '请输入时长', trigger: 'blur', type: 'number' as const },
  capacity: { required: true, message: '请输入容量', trigger: 'blur', type: 'number' as const }
}

const teacherOptions = computed(() => {
  return teachers.value.map(t => ({
    label: t.name,
    value: t.id
  }))
})

const pagination = {
  pageSize: 10
}

const filteredCourses = computed(() => {
  if (!searchText.value) return courses.value
  const search = searchText.value.toLowerCase()
  return courses.value.filter(
    c => c.name.toLowerCase().includes(search) || 
         c.description.toLowerCase().includes(search) ||
         c.teacherName.toLowerCase().includes(search)
  )
})

const columns: DataTableColumns<Course> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '课程名称', key: 'name' },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: '教师', key: 'teacherName' },
  {
    title: '价格',
    key: 'price',
    render(row) {
      return `¥${row.price}`
    }
  },
  {
    title: '时长',
    key: 'duration',
    render(row) {
      return `${row.duration}分钟`
    }
  },
  { title: '容量', key: 'capacity' },
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

const handleTeacherChange = (value: string) => {
  const teacher = teachers.value.find(t => t.id === value)
  if (teacher) {
    formData.value.teacherName = teacher.name
  }
}

const handleEdit = (course: Course) => {
  editingId.value = course.id
  formData.value = { ...course }
  showModal.value = true
}

const handleDelete = (id: string) => {
  courseStorage.delete(id)
  courses.value = courseStorage.getAll()
  message.success('删除成功')
}

const handleSave = () => {
  if (!formData.value.name || !formData.value.teacherId || !formData.value.price || !formData.value.duration || !formData.value.capacity) {
    message.error('请填写所有必填项')
    return
  }

  if (editingId.value) {
    courseStorage.update(editingId.value, formData.value)
    message.success('更新成功')
  } else {
    const newCourse: Course = {
      id: Date.now().toString(),
      name: formData.value.name!,
      description: formData.value.description || '',
      teacherId: formData.value.teacherId!,
      teacherName: formData.value.teacherName!,
      price: formData.value.price!,
      duration: formData.value.duration!,
      capacity: formData.value.capacity!,
      createdAt: new Date().toISOString()
    }
    courseStorage.add(newCourse)
    message.success('添加成功')
  }

  courses.value = courseStorage.getAll()
  showModal.value = false
  editingId.value = null
  formData.value = {
    name: '',
    description: '',
    teacherId: '',
    teacherName: '',
    price: 0,
    duration: 60,
    capacity: 20
  }
}
</script>
