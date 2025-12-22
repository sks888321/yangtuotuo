<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-layout has-sider style="height: 100vh">
        <n-layout-sider
          bordered
          show-trigger
          collapse-mode="width"
          :collapsed-width="64"
          :width="240"
          :native-scrollbar="false"
        >
          <div style="padding: 24px; text-align: center">
            <h2 v-if="!collapsed">课程管理系统</h2>
            <h3 v-else>课程</h3>
          </div>
          <n-menu
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="22"
            :options="menuOptions"
            v-model:value="activeKey"
            @update:value="handleMenuClick"
          />
        </n-layout-sider>
        <n-layout>
          <n-layout-header bordered style="padding: 16px 24px; display: flex; justify-content: space-between; align-items: center">
            <h2>{{ currentPageTitle }}</h2>
            <n-switch v-model:value="isDark" @update:value="handleThemeChange">
              <template #checked>🌙</template>
              <template #unchecked>☀️</template>
            </n-switch>
          </n-layout-header>
          <n-layout-content content-style="padding: 24px;">
            <router-view />
          </n-layout-content>
        </n-layout>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NConfigProvider,
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NSwitch,
  NMessageProvider,
  darkTheme
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  HomeOutline as DashboardIcon,
  PeopleOutline as PeopleIcon,
  BookOutline as BookIcon,
  CalendarOutline as CalendarIcon,
  CardOutline as CardIcon
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const isDark = ref(false)
const theme = computed(() => (isDark.value ? darkTheme : null))

const activeKey = ref<string>('dashboard')

const menuOptions: MenuOption[] = [
  {
    label: '仪表盘',
    key: 'dashboard',
    icon: () => h(DashboardIcon)
  },
  {
    label: '用户管理',
    key: 'users',
    icon: () => h(PeopleIcon)
  },
  {
    label: '课程管理',
    key: 'courses',
    icon: () => h(BookIcon)
  },
  {
    label: '排课管理',
    key: 'schedule',
    icon: () => h(CalendarIcon)
  },
  {
    label: '缴费管理',
    key: 'payments',
    icon: () => h(CardIcon)
  }
]

const pageTitle: Record<string, string> = {
  dashboard: '仪表盘',
  users: '用户管理',
  courses: '课程管理',
  schedule: '排课管理',
  payments: '缴费管理'
}

const currentPageTitle = computed(() => {
  const name = route.name as string
  return pageTitle[name?.toLowerCase()] || '课程管理系统'
})

const handleMenuClick = (key: string) => {
  router.push(`/${key}`)
}

const handleThemeChange = (value: boolean) => {
  isDark.value = value
}

// Update active key based on current route
router.afterEach((to) => {
  const path = to.path.substring(1) || 'dashboard'
  activeKey.value = path
})
</script>
