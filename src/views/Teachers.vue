<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-input v-model:value="searchText" placeholder="搜索老师..." style="width: 300px" />
      <n-button type="primary" @click="showModal = true">添加老师</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredTeachers"
      :pagination="pagination"
    />

    <n-modal v-model:show="showModal" preset="card" title="老师信息" style="width: 600px">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="姓名" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入姓名" />
        </n-form-item>
        <n-form-item label="电话" path="phone">
          <n-input v-model:value="formData.phone" placeholder="请输入电话" />
        </n-form-item>
        <n-form-item label="级别" path="level">
          <n-select v-model:value="formData.level" :options="levelOptions" />
        </n-form-item>
        <n-form-item label="1对1时薪" path="hourlyRate">
          <n-input-number v-model:value="formData.hourlyRate" placeholder="请输入时薪" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="大课时薪" path="groupRate">
          <n-input-number v-model:value="formData.groupRate" placeholder="请输入时薪" :min="0" style="width: 100%" />
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
import { ref, computed, h, onMounted } from 'vue'
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
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { teacherAPI } from '../api'
import type { Teacher } from '../types'
import { dataCache } from '../utils/cache'

const message = useMessage()
const searchText = ref('')
const showModal = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)
const teachers = ref<Teacher[]>([])

const formData = ref<Partial<Teacher>>({
  name: '',
  phone: '',
  level: 'junior',
  hourlyRate: 200,
  groupRate: 150,
  status: 'active'
})

const rules = {
  name: { required: true, message: '请输入姓名', trigger: 'blur' },
  phone: { required: true, message: '请输入电话', trigger: 'blur' },
  level: { required: true, message: '请选择级别', trigger: 'change' },
  hourlyRate: { required: true, message: '请输入1对1时薪', trigger: 'blur' },
  groupRate: { required: true, message: '请输入大课时薪', trigger: 'blur' }
}

const levelOptions = [
  { label: '初级', value: 'junior' },
  { label: '中级', value: 'intermediate' },
  { label: '高级', value: 'senior' }
]

const statusOptions = [
  { label: '在职', value: 'active' },
  { label: '离职', value: 'inactive' }
]

const pagination = {
  pageSize: 10
}

const filteredTeachers = computed(() => {
  if (!searchText.value) return teachers.value
  const search = searchText.value.toLowerCase()
  return teachers.value.filter(
    t => t.name.toLowerCase().includes(search) || 
         t.phone.includes(search)
  )
})

const columns: DataTableColumns<Teacher> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '姓名', key: 'name' },
  { title: '电话', key: 'phone' },
  { 
    title: '级别', 
    key: 'level',
    render(row) {
      const levelMap: Record<string, { text: string, type: 'default' | 'success' | 'warning' }> = {
        junior: { text: '初级', type: 'default' },
        intermediate: { text: '中级', type: 'warning' },
        senior: { text: '高级', type: 'success' }
      }
      const level = levelMap[row.level]
      return h(NTag, { type: level?.type || 'default' }, { default: () => level?.text || '' })
    }
  },
  { 
    title: '1对1时薪', 
    key: 'hourlyRate',
    render(row) {
      return `¥${row.hourlyRate}/小时`
    }
  },
  { 
    title: '大课时薪', 
    key: 'groupRate',
    render(row) {
      return `¥${row.groupRate}/小时`
    }
  },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const statusMap = {
        active: { text: '在职', type: 'success' },
        inactive: { text: '离职', type: 'default' }
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

const handleEdit = (teacher: Teacher) => {
  editingId.value = teacher.id
  formData.value = { ...teacher }
  showModal.value = true
}

const handleDelete = async (id: string) => {
  await teacherAPI.remove(id)
  const updatedTeachers = await teacherAPI.getAll()
  teachers.value = updatedTeachers
  dataCache.setTeachers(updatedTeachers)
  message.success('删除成功')
}

const handleSave = async () => {
  if (!formData.value.name || !formData.value.phone || !formData.value.level) {
    message.error('请填写所有必填项')
    return
  }

  if (editingId.value) {
    await teacherAPI.update(editingId.value, formData.value)
    message.success('更新成功')
  } else {
    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name: formData.value.name!,
      phone: formData.value.phone!,
      level: formData.value.level as 'junior' | 'intermediate' | 'senior',
      hourlyRate: formData.value.hourlyRate!,
      groupRate: formData.value.groupRate!,
      status: formData.value.status as 'active' | 'inactive',
      createTime: new Date().toISOString()
    }
    await teacherAPI.add(newTeacher)
    message.success('添加成功')
  }

  const updatedTeachers = await teacherAPI.getAll()
  teachers.value = updatedTeachers
  dataCache.setTeachers(updatedTeachers)
  
  showModal.value = false
  editingId.value = null
  formData.value = {
    name: '',
    phone: '',
    level: 'junior',
    hourlyRate: 200,
    groupRate: 150,
    status: 'active'
  }
}

onMounted(async () => {
  // 先检查缓存
  if (dataCache.isTeachersLoaded()) {
    teachers.value = dataCache.getTeachers()
    return
  }
  
  if (loading.value || teachers.value.length > 0) return
  try {
    loading.value = true
    const teachersData = await teacherAPI.getAll()
    teachers.value = teachersData
    dataCache.setTeachers(teachersData)
  } finally {
    loading.value = false
  }
})
</script>
