<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-select
        v-model:value="filterStatus"
        :options="statusFilterOptions"
        placeholder="筛选状态"
        clearable
        style="width: 200px"
      />
      <n-button type="primary" @click="showModal = true">添加缴费记录</n-button>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredPayments"
      :pagination="pagination"
    />

    <n-modal v-model:show="showModal" preset="card" title="缴费信息" style="width: 600px">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="学生" path="studentId">
          <n-select
            v-model:value="formData.studentId"
            :options="studentOptions"
            placeholder="请选择学生"
            @update:value="handleStudentChange"
          />
        </n-form-item>
        <n-form-item label="课程" path="courseId">
          <n-select
            v-model:value="formData.courseId"
            :options="courseOptions"
            placeholder="请选择课程"
            @update:value="handleCourseChange"
          />
        </n-form-item>
        <n-form-item label="金额" path="amount">
          <n-input-number v-model:value="formData.amount" placeholder="请输入金额" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="状态" path="status">
          <n-select v-model:value="formData.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item v-if="formData.status === 'paid'" label="支付日期" path="paymentDate">
          <n-date-picker v-model:value="formData.paymentDateTimestamp" type="date" style="width: 100%" />
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
  NInputNumber,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NDatePicker,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { paymentStorage, courseStorage, userStorage } from '../utils/storage'
import type { Payment } from '../types'

const message = useMessage()
const filterStatus = ref<string | null>(null)
const showModal = ref(false)
const editingId = ref<string | null>(null)
const payments = ref<Payment[]>(paymentStorage.getAll())
const courses = ref(courseStorage.getAll())
const students = ref(userStorage.getAll().filter(u => u.role === 'student'))

const formData = ref<any>({
  studentId: '',
  studentName: '',
  courseId: '',
  courseName: '',
  amount: 0,
  status: 'pending',
  paymentDateTimestamp: null,
  paymentDate: ''
})

const rules = {
  studentId: { required: true, message: '请选择学生', trigger: 'change' },
  courseId: { required: true, message: '请选择课程', trigger: 'change' },
  amount: { required: true, message: '请输入金额', trigger: 'blur', type: 'number' },
  status: { required: true, message: '请选择状态', trigger: 'change' }
}

const studentOptions = computed(() => {
  return students.value.map(s => ({
    label: s.name,
    value: s.id
  }))
})

const courseOptions = computed(() => {
  return courses.value.map(c => ({
    label: `${c.name} - ¥${c.price}`,
    value: c.id
  }))
})

const statusOptions = [
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已退款', value: 'refunded' }
]

const statusFilterOptions = [
  { label: '全部', value: null },
  ...statusOptions
]

const pagination = {
  pageSize: 10
}

const filteredPayments = computed(() => {
  if (!filterStatus.value) return payments.value
  return payments.value.filter(p => p.status === filterStatus.value)
})

const columns: DataTableColumns<Payment> = [
  { title: 'ID', key: 'id', width: 80 },
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
      return h(NTag, { type: status.type as any }, () => status.text)
    }
  },
  {
    title: '支付日期',
    key: 'paymentDate',
    render(row) {
      return row.paymentDate || '-'
    }
  },
  {
    title: '创建时间',
    key: 'createdAt',
    render(row) {
      return new Date(row.createdAt).toLocaleString('zh-CN')
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

const handleStudentChange = (value: string) => {
  const student = students.value.find(s => s.id === value)
  if (student) {
    formData.value.studentName = student.name
  }
}

const handleCourseChange = (value: string) => {
  const course = courses.value.find(c => c.id === value)
  if (course) {
    formData.value.courseName = course.name
    formData.value.amount = course.price
  }
}

const handleEdit = (payment: Payment) => {
  editingId.value = payment.id
  formData.value = {
    ...payment,
    paymentDateTimestamp: payment.paymentDate ? new Date(payment.paymentDate).getTime() : null
  }
  showModal.value = true
}

const handleDelete = (id: string) => {
  paymentStorage.delete(id)
  payments.value = paymentStorage.getAll()
  message.success('删除成功')
}

const handleSave = () => {
  if (!formData.value.studentId || !formData.value.courseId || !formData.value.amount) {
    message.error('请填写所有必填项')
    return
  }

  const paymentDate = formData.value.paymentDateTimestamp 
    ? new Date(formData.value.paymentDateTimestamp).toISOString().split('T')[0]
    : undefined

  if (editingId.value) {
    paymentStorage.update(editingId.value, {
      ...formData.value,
      paymentDate
    })
    message.success('更新成功')
  } else {
    const newPayment: Payment = {
      id: Date.now().toString(),
      studentId: formData.value.studentId,
      studentName: formData.value.studentName,
      courseId: formData.value.courseId,
      courseName: formData.value.courseName,
      amount: formData.value.amount,
      status: formData.value.status,
      paymentDate,
      createdAt: new Date().toISOString()
    }
    paymentStorage.add(newPayment)
    message.success('添加成功')
  }

  payments.value = paymentStorage.getAll()
  showModal.value = false
  editingId.value = null
  formData.value = {
    studentId: '',
    studentName: '',
    courseId: '',
    courseName: '',
    amount: 0,
    status: 'pending',
    paymentDateTimestamp: null,
    paymentDate: ''
  }
}
</script>
