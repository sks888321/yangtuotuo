<template>
  <pre>{{ formattedValue }}</pre>
  <n-date-picker
    v-model:formatted-value="form.endtime"
    value-format="yyyy.MM.dd HH:mm:ss"
    type="datetime"
    clearable
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NDatePicker } from 'naive-ui'
const formattedValue = ref('2007.06.30 12:08:55')
const form = ref<{endtime: string}>({
  endtime: '2025.12.23 09:45:11'
})
</script>