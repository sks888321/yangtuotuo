<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-input v-model:value="searchText" placeholder="搜索课程类型..." style="width: 300px" />
      <n-button type="primary" @click="showModal = true">添加课程类型</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredCourseTypes"
      :pagination="pagination"
    />

    <n-modal v-model:show="showModal" preset="card" title="课程类型信息" style="width: 600px">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="课程名称" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入课程名称" />
        </n-form-item>
        <n-form-item label="课程类型" path="type">
          <n-select v-model:value="formData.type" :options="typeOptions" />
        </n-form-item>
        <n-form-item label="课时长（分钟）" path="duration">
          <n-input-number v-model:value="formData.duration" placeholder="请输入课时长" :min="15" :step="15" style="width: 100%" />
        </n-form-item>
        <n-form-item label="课程说明" path="description">
          <n-input v-model:value="formData.description" type="textarea" placeholder="请输入课程说明" />
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
import { courseTypeAPI } from '../api'
import type { CourseType } from '../types'
import { dataCache } from '../utils/cache'

const message = useMessage()
const searchText = ref('')
const showModal = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)
const courseTypes = ref<CourseType[]>([])

const formData = ref<Partial<CourseType>>({
  name: '',
  type: 'one-on-one',
  duration: 60,
  description: ''
})

const rules = {
  name: { required: true, message: '请输入课程名称', trigger: 'blur' },
  type: { required: true, message: '请选择课程类型', trigger: 'change' },
  duration: { required: true, message: '请输入课时长', trigger: 'blur' }
}

const typeOptions = [
  { label: '1对1', value: 'one-on-one' },
  { label: '大课', value: 'group' }
]

const pagination = {
  pageSize: 10
}

const filteredCourseTypes = computed(() => {
  if (!searchText.value) return courseTypes.value
  const search = searchText.value.toLowerCase()
  return courseTypes.value.filter(
    ct => ct.name.toLowerCase().includes(search) || 
          ct.description.toLowerCase().includes(search)
  )
})

const columns: DataTableColumns<CourseType> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '课程名称', key: 'name' },
  {
    title: '类型',
    key: 'type',
    render(row) {
      const typeMap = {
        'one-on-one': { text: '1对1', type: 'success' },
        'group': { text: '大课', type: 'info' }
      }
      const type = typeMap[row.type]
      return h(NTag, { type: type.type as any }, { default: () => type.text })
    }
  },
  { 
    title: '课时长', 
    key: 'duration',
    render(row) {
      return `${row.duration}分钟`
    }
  },
  { title: '课程说明', key: 'description', ellipsis: { tooltip: true } },
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

const handleEdit = (courseType: CourseType) => {
  editingId.value = courseType.id
  formData.value = { ...courseType }
  showModal.value = true
}

const handleDelete = async (id: string) => {
  await courseTypeAPI.remove(id)
  const updatedCourseTypes = await courseTypeAPI.getAll()
  courseTypes.value = updatedCourseTypes
  dataCache.setCourseTypes(updatedCourseTypes)
  message.success('删除成功')
}

const handleSave = async () => {
  if (!formData.value.name || !formData.value.type || !formData.value.duration) {
    message.error('请填写所有必填项')
    return
  }

  if (editingId.value) {
    await courseTypeAPI.update(editingId.value, formData.value)
    message.success('更新成功')
  } else {
    const newCourseType: CourseType = {
      id: Date.now().toString(),
      name: formData.value.name!,
      type: formData.value.type as 'one-on-one' | 'group',
      duration: formData.value.duration!,
      description: formData.value.description || ''
    }
    await courseTypeAPI.add(newCourseType)
    message.success('添加成功')
  }

  const updatedCourseTypes = await courseTypeAPI.getAll()
  courseTypes.value = updatedCourseTypes
  dataCache.setCourseTypes(updatedCourseTypes)
  
  showModal.value = false
  editingId.value = null
  formData.value = {
    name: '',
    type: 'one-on-one',
    duration: 60,
    description: ''
  }
}

onMounted(async () => {
  // 先检查缓存
  if (dataCache.isCourseTypesLoaded()) {
    courseTypes.value = dataCache.getCourseTypes()
    return
  }
  
  if (loading.value || courseTypes.value.length > 0) return
  try {
    loading.value = true
    const courseTypesData = await courseTypeAPI.getAll()
    courseTypes.value = courseTypesData
    dataCache.setCourseTypes(courseTypesData)
  } finally {
    loading.value = false
  }
})
</script>
