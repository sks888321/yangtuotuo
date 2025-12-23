<template>
  <n-space vertical :size="24">
    <!-- 存储设置 -->
    <n-card v-if="!hasStorageDirectory">
      <n-space vertical>
        <n-alert type="info" title="选择存储目录">
          点击下方按钮选择一个本地文件夹作为数据存储目录，数据将以JSON文件形式保存。
        </n-alert>
        <n-button type="primary" @click="selectDirectory">
          <template #icon>
            <n-icon><FolderOpen /></n-icon>
          </template>
          选择目录
        </n-button>
      </n-space>
    </n-card>
    
    <!-- 统计卡片 -->
    <n-grid :x-gap="24" :y-gap="24" :cols="4">
      <n-grid-item>
        <n-card>
          <n-statistic label="老师数量" :value="stats.totalTeachers">
            <template #suffix>人</template>
            <template #prefix>
              <n-icon size="24" color="#18a058">
                <School />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="学生数量" :value="stats.totalStudents">
            <template #suffix>人</template>
            <template #prefix>
              <n-icon size="24" color="#2080f0">
                <People />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="今日排课" :value="stats.todaySchedules">
            <template #suffix>节</template>
            <template #prefix>
              <n-icon size="24" color="#f0a020">
                <Calendar />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="待缴费用" :value="stats.pendingPayments">
            <template #suffix>元</template>
            <template #prefix>
              <n-icon size="24" color="#d03050">
                <Cash />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 本周课程表 -->
    <n-card title="本周课程安排">
      <weekly-calendar />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  NSpace, 
  NGrid, 
  NGridItem, 
  NCard, 
  NStatistic, 
  NAlert,
  NButton,
  NIcon,
  useMessage
} from 'naive-ui'
import { People, Calendar, Cash, FolderOpen, School } from '@vicons/ionicons5'
import { 
  teacherAPI, 
  studentAPI, 
  scheduleAPI, 
  paymentAPI,
  initAllData
} from '../api'
import { selectStorageDirectory, hasStorageDirectory as checkStorageDirectory } from '../utils/storage'
import WeeklyCalendar from '../components/WeeklyCalendar.vue'
import { dataCache } from '../utils/cache'

const message = useMessage()
const hasStorageDirectory = ref(false)
const loading = ref(false)

const teachers = ref<any[]>([])
const students = ref<any[]>([])
const schedules = ref<any[]>([])
const payments = ref<any[]>([])

const stats = computed(() => {
  const today = new Date().toLocaleDateString('zh-CN').replace(/\//g, '.')
  return {
    totalTeachers: teachers.value.length,
    totalStudents: students.value.length,
    todaySchedules: schedules.value.filter(s => s.date === today && s.status === 'scheduled').length,
    pendingPayments: payments.value.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  }
})

async function selectDirectory() {
  const success = await selectStorageDirectory()
  if (success) {
    hasStorageDirectory.value = true
    message.success('存储目录已选择')
    await loadData()
  } else {
    message.error('选择目录失败或已取消')
  }
}

async function loadData() {
  if (loading.value) return
  
  // 使用缓存系统
  if (dataCache.isTeachersLoaded() && dataCache.isStudentsLoaded() && 
      dataCache.isSchedulesLoaded() && dataCache.isPaymentsLoaded()) {
    teachers.value = dataCache.getTeachers()
    students.value = dataCache.getStudents()
    schedules.value = dataCache.getSchedules()
    payments.value = dataCache.getPayments()
    return
  }
  
  try {
    loading.value = true
    const [teachersData, studentsData, schedulesData, paymentsData] = await Promise.all([
      teacherAPI.getAll(),
      studentAPI.getAll(),
      scheduleAPI.getAll(),
      paymentAPI.getAll()
    ])
    
    teachers.value = teachersData
    students.value = studentsData
    schedules.value = schedulesData
    payments.value = paymentsData
    
    // 更新缓存
    dataCache.setTeachers(teachersData)
    dataCache.setStudents(studentsData)
    dataCache.setSchedules(schedulesData)
    dataCache.setPayments(paymentsData)
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

let initPromise: Promise<void> | null = null

onMounted(async () => {
  // 检查是否已经选择了存储目录
  const hasDirectory = await checkStorageDirectory()
  
  if (!hasDirectory) {
    // 检查是否支持文件系统API
    if ('showDirectoryPicker' in window) {
      hasStorageDirectory.value = false // 显示选择目录的提示
      message.info('请先选择一个本地文件夹用于存储数据')
      return // 等待用户选择目录
    } else {
      message.warning('浏览器不支持文件系统API，将使用localStorage')
      hasStorageDirectory.value = true
    }
  } else {
    hasStorageDirectory.value = true
  }
  
  // 只初始化一次
  if (!initPromise) {
    initPromise = initAllData()
  }
  await initPromise
  
  await loadData()
})
</script>
