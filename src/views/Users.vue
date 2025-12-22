<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-input v-model:value="searchText" placeholder="搜索用户..." style="width: 300px" />
      <n-button type="primary" @click="showModal = true">添加用户</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredUsers"
      :pagination="pagination"
    />

    <n-modal v-model:show="showModal" preset="card" title="用户信息" style="width: 600px">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="姓名" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入姓名" />
        </n-form-item>
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="formData.email" placeholder="请输入邮箱" />
        </n-form-item>
        <n-form-item label="电话" path="phone">
          <n-input v-model:value="formData.phone" placeholder="请输入电话" />
        </n-form-item>
        <n-form-item label="角色" path="role">
          <n-select v-model:value="formData.role" :options="roleOptions" />
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
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { userStorage } from '../utils/storage'
import type { User } from '../types'

const message = useMessage()
const searchText = ref('')
const showModal = ref(false)
const editingId = ref<string | null>(null)
const users = ref<User[]>(userStorage.getAll())

const formData = ref<Partial<User>>({
  name: '',
  email: '',
  phone: '',
  role: 'student'
})

const rules = {
  name: { required: true, message: '请输入姓名', trigger: 'blur' },
  email: { required: true, message: '请输入邮箱', trigger: 'blur' },
  phone: { required: true, message: '请输入电话', trigger: 'blur' },
  role: { required: true, message: '请选择角色', trigger: 'change' }
}

const roleOptions = [
  { label: '学生', value: 'student' },
  { label: '教师', value: 'teacher' },
  { label: '管理员', value: 'admin' }
]

const pagination = {
  pageSize: 10
}

const filteredUsers = computed(() => {
  if (!searchText.value) return users.value
  const search = searchText.value.toLowerCase()
  return users.value.filter(
    u => u.name.toLowerCase().includes(search) || 
         u.email.toLowerCase().includes(search) ||
         u.phone.includes(search)
  )
})

const columns: DataTableColumns<User> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '姓名', key: 'name' },
  { title: '邮箱', key: 'email' },
  { title: '电话', key: 'phone' },
  {
    title: '角色',
    key: 'role',
    render(row) {
      const roleMap = {
        student: { text: '学生', type: 'info' },
        teacher: { text: '教师', type: 'success' },
        admin: { text: '管理员', type: 'warning' }
      }
      const role = roleMap[row.role] || { text: row.role, type: 'default' }
      return h(NTag, { type: role.type as any }, () => role.text)
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

const handleEdit = (user: User) => {
  editingId.value = user.id
  formData.value = { ...user }
  showModal.value = true
}

const handleDelete = (id: string) => {
  userStorage.delete(id)
  users.value = userStorage.getAll()
  message.success('删除成功')
}

const handleSave = () => {
  if (!formData.value.name || !formData.value.email || !formData.value.phone || !formData.value.role) {
    message.error('请填写所有必填项')
    return
  }

  if (editingId.value) {
    userStorage.update(editingId.value, formData.value)
    message.success('更新成功')
  } else {
    const newUser: User = {
      id: Date.now().toString(),
      name: formData.value.name!,
      email: formData.value.email!,
      phone: formData.value.phone!,
      role: formData.value.role as 'student' | 'teacher' | 'admin',
      createdAt: new Date().toISOString()
    }
    userStorage.add(newUser)
    message.success('添加成功')
  }

  users.value = userStorage.getAll()
  showModal.value = false
  editingId.value = null
  formData.value = {
    name: '',
    email: '',
    phone: '',
    role: 'student'
  }
}
</script>
