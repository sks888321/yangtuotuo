<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-input v-model:value="searchText" placeholder="搜索学生..." style="width: 300px" />
      <n-button type="primary" @click="showModal = true">添加学生</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredStudents"
      :pagination="pagination"
    />

    <n-modal v-model:show="showModal" preset="card" title="学生信息" style="width: 600px">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="姓名" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入姓名" />
        </n-form-item>
        <n-form-item label="电话" path="phone">
          <n-input v-model:value="formData.phone" placeholder="请输入电话" />
        </n-form-item>
        <n-form-item label="年龄" path="age">
          <n-input-number v-model:value="formData.age" placeholder="请输入年龄" :min="3" :max="100" style="width: 100%" />
        </n-form-item>
        <n-form-item label="家长姓名" path="parentName">
          <n-input v-model:value="formData.parentName" placeholder="请输入家长姓名" />
        </n-form-item>
        <n-form-item label="家长电话" path="parentPhone">
          <n-input v-model:value="formData.parentPhone" placeholder="请输入家长电话" />
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
import { studentAPI } from '../api'
import type { Student } from '../types'
import { dataCache } from '../utils/cache'

const message = useMessage()
const searchText = ref('')
const showModal = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)
const students = ref<Student[]>([])

const formData = ref<Partial<Student>>({
  name: '',
  phone: '',
  age: 8,
  parentName: '',
  parentPhone: '',
  status: 'active'
})

const rules = {
  name: { required: true, message: '请输入姓名', trigger: 'blur' },
  phone: { required: true, message: '请输入电话', trigger: 'blur' },
  age: { required: true, message: '请输入年龄', trigger: 'blur' },
  parentName: { required: true, message: '请输入家长姓名', trigger: 'blur' },
  parentPhone: { required: true, message: '请输入家长电话', trigger: 'blur' }
}

const statusOptions = [
  { label: '在读', value: 'active' },
  { label: '停课', value: 'inactive' }
]

const pagination = {
  pageSize: 10
}

const filteredStudents = computed(() => {
  if (!searchText.value) return students.value
  const search = searchText.value.toLowerCase()
  return students.value.filter(
    s => s.name.toLowerCase().includes(search) || 
         s.phone.includes(search) ||
         s.parentName.toLowerCase().includes(search) ||
         s.parentPhone.includes(search)
  )
})

const columns: DataTableColumns<Student> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '姓名', key: 'name' },
  { title: '电话', key: 'phone' },
  { title: '年龄', key: 'age' },
  { title: '家长姓名', key: 'parentName' },
  { title: '家长电话', key: 'parentPhone' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const statusMap = {
        active: { text: '在读', type: 'success' },
        inactive: { text: '停课', type: 'default' }
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

const handleEdit = (student: Student) => {
  editingId.value = student.id
  formData.value = { ...student }
  showModal.value = true
}

const handleDelete = async (id: string) => {
  await studentAPI.remove(id)
  const updatedStudents = await studentAPI.getAll()
  students.value = updatedStudents
  dataCache.setStudents(updatedStudents)
  message.success('删除成功')
}

const handleSave = async () => {
  if (!formData.value.name || !formData.value.phone || !formData.value.age || !formData.value.parentName || !formData.value.parentPhone) {
    message.error('请填写所有必填项')
    return
  }

  if (editingId.value) {
    await studentAPI.update(editingId.value, formData.value)
    message.success('更新成功')
  } else {
    const newStudent: Student = {
      id: Date.now().toString(),
      name: formData.value.name!,
      phone: formData.value.phone!,
      age: formData.value.age!,
      parentName: formData.value.parentName!,
      parentPhone: formData.value.parentPhone!,
      status: formData.value.status as 'active' | 'inactive',
      createTime: new Date().toISOString()
    }
    await studentAPI.add(newStudent)
    message.success('添加成功')
  }

  const updatedStudents = await studentAPI.getAll()
  students.value = updatedStudents
  dataCache.setStudents(updatedStudents)
  
  showModal.value = false
  editingId.value = null
  formData.value = {
    name: '',
    phone: '',
    age: 8,
    parentName: '',
    parentPhone: '',
    status: 'active'
  }
}

onMounted(async () => {
  // 先检查缓存
  if (dataCache.isStudentsLoaded()) {
    students.value = dataCache.getStudents()
    return
  }
  
  if (loading.value || students.value.length > 0) return
  try {
    loading.value = true
    const studentsData = await studentAPI.getAll()
    students.value = studentsData
    dataCache.setStudents(studentsData)
  } finally {
    loading.value = false
  }
})
</script>
