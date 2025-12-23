<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-input v-model:value="searchText" placeholder="搜索教室..." style="width: 300px" />
      <n-button type="primary" @click="showModal = true">添加教室</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredClassrooms"
      :pagination="pagination"
    />

    <n-modal v-model:show="showModal" preset="card" title="教室信息" style="width: 600px">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="教室名称" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入教室名称" />
        </n-form-item>
        <n-form-item label="容纳人数" path="capacity">
          <n-input-number v-model:value="formData.capacity" placeholder="请输入容纳人数" :min="1" style="width: 100%" />
        </n-form-item>
        <n-form-item label="设备设施" path="equipment">
          <n-input v-model:value="formData.equipment" type="textarea" placeholder="请输入设备设施" />
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
import { classroomAPI } from '../api'
import type { Classroom } from '../types'
import { dataCache } from '../utils/cache'

const message = useMessage()
const searchText = ref('')
const showModal = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)
const classrooms = ref<Classroom[]>([])

const formData = ref<Partial<Classroom>>({
  name: '',
  capacity: 6,
  equipment: '',
  status: 'available'
})

const rules = {
  name: { required: true, message: '请输入教室名称', trigger: 'blur' },
  capacity: { required: true, message: '请输入容纳人数', trigger: 'blur' },
  equipment: { required: true, message: '请输入设备设施', trigger: 'blur' }
}

const statusOptions = [
  { label: '可用', value: 'available' },
  { label: '使用中', value: 'occupied' },
  { label: '维护中', value: 'maintenance' }
]

const pagination = {
  pageSize: 10
}

const filteredClassrooms = computed(() => {
  if (!searchText.value) return classrooms.value
  const search = searchText.value.toLowerCase()
  return classrooms.value.filter(
    c => c.name.toLowerCase().includes(search) || 
         c.equipment.toLowerCase().includes(search)
  )
})

const columns: DataTableColumns<Classroom> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '教室名称', key: 'name' },
  { title: '容纳人数', key: 'capacity' },
  { title: '设备设施', key: 'equipment', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const statusMap = {
        available: { text: '可用', type: 'success' },
        occupied: { text: '使用中', type: 'warning' },
        maintenance: { text: '维护中', type: 'default' }
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

const handleEdit = (classroom: Classroom) => {
  editingId.value = classroom.id
  formData.value = { ...classroom }
  showModal.value = true
}

const handleDelete = async (id: string) => {
  await classroomAPI.remove(id)
  const updatedClassrooms = await classroomAPI.getAll()
  classrooms.value = updatedClassrooms
  dataCache.setClassrooms(updatedClassrooms)
  message.success('删除成功')
}

const handleSave = async () => {
  if (!formData.value.name || !formData.value.capacity || !formData.value.equipment) {
    message.error('请填写所有必填项')
    return
  }

  if (editingId.value) {
    await classroomAPI.update(editingId.value, formData.value)
    message.success('更新成功')
  } else {
    const newClassroom: Classroom = {
      id: Date.now().toString(),
      name: formData.value.name!,
      capacity: formData.value.capacity!,
      equipment: formData.value.equipment!,
      status: formData.value.status as 'available' | 'occupied' | 'maintenance',
      createTime: new Date().toISOString()
    }
    await classroomAPI.add(newClassroom)
    message.success('添加成功')
  }

  const updatedClassrooms = await classroomAPI.getAll()
  classrooms.value = updatedClassrooms
  dataCache.setClassrooms(updatedClassrooms)
  
  showModal.value = false
  editingId.value = null
  formData.value = {
    name: '',
    capacity: 6,
    equipment: '',
    status: 'available'
  }
}

onMounted(async () => {
  // 先检查缓存
  if (dataCache.isClassroomsLoaded()) {
    classrooms.value = dataCache.getClassrooms()
    return
  }
  
  if (loading.value || classrooms.value.length > 0) return
  try {
    loading.value = true
    const classroomsData = await classroomAPI.getAll()
    classrooms.value = classroomsData
    dataCache.setClassrooms(classroomsData)
  } finally {
    loading.value = false
  }
})
</script>
