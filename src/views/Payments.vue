<template>
  <n-space vertical :size="16">
    <n-space justify="space-between">
      <n-space>
        <n-select 
          v-model:value="filterStatus" 
          :options="statusFilterOptions"
          placeholder="筛选状态"
          style="width: 150px"
          clearable
        />
      </n-space>
      <n-button type="primary" @click="handleCreateNew" :disabled="loading">添加缴费记录</n-button>
    </n-space>

    <!-- 统计卡片 -->
    <n-grid :x-gap="24" :y-gap="24" :cols="4">
      <n-grid-item>
        <n-card>
          <n-statistic label="总收入" :value="stats.totalAmount">
            <template #suffix>元</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="已缴费" :value="stats.paidAmount">
            <template #suffix>元</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="待缴费" :value="stats.pendingAmount">
            <template #suffix>元</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="已退款" :value="stats.refundedAmount">
            <template #suffix>元</template>
          </n-statistic>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 缴费列表 -->
    <n-data-table
      :columns="columns"
      :data="filteredPayments"
      :pagination="pagination"
    />

    <!-- 缴费表单 -->
    <n-modal v-model:show="showModal" preset="card" title="缴费记录" style="width: 600px">
      <n-form ref="formRef" :model="formData">
        <n-form-item label="学生" path="studentId">
          <n-select 
            v-model:value="formData.studentId" 
            :options="studentOptions"
            @update:value="handleStudentChange"
            placeholder="请选择学生"
          />
        </n-form-item>
        <n-form-item label="关联课程" path="scheduleIds">
          <n-select 
            v-model:value="formData.scheduleIds" 
            :options="scheduleOptions"
            multiple
            placeholder="请选择关联课程"
          />
        </n-form-item>
        <n-form-item label="缴费金额" path="amount">
          <n-input-number v-model:value="formData.amount" placeholder="请输入金额" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="缴费日期" path="paymentDateTimestamp">
          <n-date-picker 
            v-model:value="formData.paymentDateTimestamp" 
            type="date"
            placeholder="请选择日期"
            clearable
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="支付方式" path="paymentMethod">
          <n-select v-model:value="formData.paymentMethod" :options="paymentMethodOptions" />
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
  NGrid,
  NGridItem,
  NCard,
  NStatistic,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NDatePicker,
  NInputNumber,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { paymentAPI, studentAPI, scheduleAPI } from '../api'
import type { Payment, Student, ScheduleItem } from '../types'
import { dataCache } from '../utils/cache'

const message = useMessage()
const showModal = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)
const filterStatus = ref<string | null>(null)

const payments = ref<Payment[]>([])
const students = ref<Student[]>([])
const schedules = ref<ScheduleItem[]>([])

const formData = ref<any>({
  studentId: '',
  studentName: '',
  scheduleIds: [],
  amount: 0,
  paymentDateTimestamp: Date.now(),
  paymentDate: '',
  paymentMethod: '微信支付',
  status: 'paid'
})

const statusOptions = [
  { label: '已支付', value: 'paid' },
  { label: '待支付', value: 'pending' },
  { label: '已退款', value: 'refunded' }
]

const statusFilterOptions = [
  { label: '已支付', value: 'paid' },
  { label: '待支付', value: 'pending' },
  { label: '已退款', value: 'refunded' }
]

const paymentMethodOptions = [
  { label: '微信支付', value: '微信支付' },
  { label: '支付宝', value: '支付宝' },
  { label: '现金', value: '现金' },
  { label: '银行转账', value: '银行转账' }
]

const pagination = {
  pageSize: 10
}

const stats = computed(() => {
  return {
    totalAmount: payments.value.reduce((sum, p) => sum + p.amount, 0),
    paidAmount: payments.value.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments.value.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    refundedAmount: payments.value.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0)
  }
})

const filteredPayments = computed(() => {
  if (!filterStatus.value) return payments.value
  return payments.value.filter(p => p.status === filterStatus.value)
})

const studentOptions = computed(() => 
  students.value.map(s => ({
    label: `${s.name} (${s.age}岁)`,
    value: s.id
  }))
)

const scheduleOptions = computed(() => 
  schedules.value
    .filter(s => s.status === 'scheduled' || s.status === 'completed')
    .map(s => ({
      label: `${s.date} ${s.startTime} - ${s.courseTypeName}`,
      value: s.id
    }))
)

const columns: DataTableColumns<Payment> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '学生', key: 'studentName' },
  {
    key: 'scheduleCount',
    title: '关联课程数',
    render: (row) => row.scheduleIds.length
  },
  {
    key: 'amount',
    title: '金额',
    render: (row) => `¥${row.amount}`
  },
  { title: '支付方式', key: 'paymentMethod' },
  { title: '缴费日期', key: 'paymentDate' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const statusMap = {
        paid: { text: '已支付', type: 'success' },
        pending: { text: '待支付', type: 'warning' },
        refunded: { text: '已退款', type: 'default' }
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

const handleCreateNew = () => {
  editingId.value = null
  formData.value = {
    studentId: '',
    studentName: '',
    scheduleIds: [],
    amount: 0,
    paymentDateTimestamp: Date.now(),
    paymentDate: '',
    paymentMethod: '微信支付',
    status: 'paid'
  }
  showModal.value = true
}

const handleStudentChange = (value: string) => {
  const student = students.value.find(s => s.id === value)
  if (student) {
    formData.value.studentName = student.name
  }
}

const handleEdit = (payment: Payment) => {
  editingId.value = payment.id
  // 将 YYYY.MM.DD 格式转换为 Date 对象
  const dateStr = payment.paymentDate.replace(/\./g, '-')
  formData.value = {
    ...payment,
    paymentDateTimestamp: new Date(dateStr).getTime()
  }
  showModal.value = true
}

const handleDelete = async (id: string) => {
  await paymentAPI.remove(id)
  const updatedPayments = await paymentAPI.getAll()
  payments.value = updatedPayments
  dataCache.setPayments(updatedPayments)
  message.success('删除成功')
}

const handleSave = async () => {
  if (!formData.value.studentId || !formData.value.scheduleIds.length || 
      !formData.value.amount || !formData.value.paymentDateTimestamp) {
    message.error('请填写所有必填项')
    return
  }

  const paymentDateObj = new Date(formData.value.paymentDateTimestamp)
  const paymentDate = paymentDateObj.toLocaleDateString('zh-CN').replace(/\//g, '.')

  const paymentData: Payment = {
    id: editingId.value || Date.now().toString(),
    studentId: formData.value.studentId,
    studentName: formData.value.studentName,
    scheduleIds: formData.value.scheduleIds,
    amount: formData.value.amount,
    paymentDate: paymentDate,
    paymentMethod: formData.value.paymentMethod,
    status: formData.value.status,
    createTime: new Date().toISOString()
  }

  if (editingId.value) {
    await paymentAPI.update(editingId.value, paymentData)
    message.success('更新成功')
  } else {
    await paymentAPI.add(paymentData)
    message.success('添加成功')
  }

  const updatedPayments = await paymentAPI.getAll()
  payments.value = updatedPayments
  dataCache.setPayments(updatedPayments)
  
  showModal.value = false
  editingId.value = null
  formData.value = {
    studentId: '',
    studentName: '',
    scheduleIds: [],
    amount: 0,
    paymentDateTimestamp: Date.now(),
    paymentDate: '',
    paymentMethod: '微信支付',
    status: 'paid'
  }
}

onMounted(async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    if (dataCache.isPaymentsLoaded() && dataCache.isStudentsLoaded() && dataCache.isSchedulesLoaded()) {
      payments.value = dataCache.getPayments()
      students.value = dataCache.getStudents()
      schedules.value = dataCache.getSchedules()
    } else {
      const [paymentsData, studentsData, schedulesData] = await Promise.all([
        paymentAPI.getAll(),
        studentAPI.getAll(),
        scheduleAPI.getAll()
      ])
      payments.value = paymentsData
      students.value = studentsData
      schedules.value = schedulesData
      
      dataCache.setPayments(paymentsData)
      dataCache.setStudents(studentsData)
      dataCache.setSchedules(schedulesData)
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
