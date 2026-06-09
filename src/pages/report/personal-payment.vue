<template>
  <div>
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:16px">
        <h2>个人回款报表</h2>
        <a-radio-group v-model="viewMode" type="button" size="small">
          <a-radio value="chart">图表</a-radio>
          <a-radio value="table">表格</a-radio>
        </a-radio-group>
      </div>
      <a-button type="primary" @click="handleExport">
        <icon-download /> 导出Excel
      </a-button>
    </div>

    <a-card size="small" style="margin-bottom: 16px">
      <a-form layout="inline" size="small">
        <a-form-item label="负责人">
          <a-select v-model="filter.ownerId" allow-clear style="width: 160px" placeholder="全部">
            <a-option v-for="u in salesUsers" :key="u.id" :value="u.id">{{ u.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="年度">
          <a-select v-model="filter.year" style="width: 120px">
            <a-option :value="2025">2025</a-option>
            <a-option :value="2026">2026</a-option>
            <a-option :value="2027">2027</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchData">查询</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 图表视图 -->
    <template v-if="viewMode === 'chart'">
      <a-row :gutter="16" style="margin-bottom:16px">
        <a-col :span="6" v-for="s in summaryStats" :key="s.label">
          <a-card size="small" class="stat-card">
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
          </a-card>
        </a-col>
      </a-row>

      <a-card title="月度回款对比（金额单位：元）">
        <div ref="barChartRef" style="width: 100%; height: 400px"></div>
      </a-card>

      <a-card title="月度回款完成率趋势" style="margin-top: 16px">
        <div ref="rateChartRef" style="width: 100%; height: 320px"></div>
      </a-card>
    </template>

    <!-- 表格视图 -->
    <a-card v-else>
      <a-table :columns="columns" :data="tableData" :pagination="false" :scroll="{ x: 3400 }" size="small" bordered>
        <template #name="{ record }">
          <span style="font-weight: 600">{{ record.name }}</span>
        </template>
        <template #year_rate="{ record }">
          <span :class="rateClass(record.year_rate)">{{ record.year_rate }}%</span>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { users, contracts, paymentRecords, targets } from '../../mock/data'

const salesUsers = users.filter(u => u.role === 'sales' || u.role === 'manager')
const fmt = (v: number) => v === 0 ? '0' : v.toLocaleString('zh-CN')

const viewMode = ref<'chart' | 'table'>('chart')
const filter = ref({ ownerId: undefined as number | undefined, year: 2026 })

function rateClass(rate: number) {
  if (rate >= 100) return 'rate-green'
  if (rate >= 80) return 'rate-yellow'
  return 'rate-red'
}

function fetchData() {}

// ---- 表格数据（保持原有逻辑） ----
const columns = computed(() => {
  const cols: any[] = [
    { title: '销售人员', dataIndex: 'name', width: 90, fixed: 'left', slotName: 'name' }
  ]
  for (let m = 1; m <= 12; m++) {
    cols.push({
      title: `${m}月`,
      children: [
        { title: '签约金额', dataIndex: `m${m}_sign`, width: 88, render: ({ record }: any) => fmt(record[`m${m}_sign`]) },
        { title: '回款任务', dataIndex: `m${m}_task`, width: 88, render: ({ record }: any) => fmt(record[`m${m}_task`]) },
        { title: '实际回款', dataIndex: `m${m}_actual`, width: 88, render: ({ record }: any) => fmt(record[`m${m}_actual`]) },
        { title: '回款完成率', dataIndex: `m${m}_rate`, width: 96, render: ({ record }: any) => h('span', { class: rateClass(record[`m${m}_rate`]) }, `${record[`m${m}_rate`]}%`) },
      ]
    })
  }
  cols.push({
    title: '年度汇总',
    children: [
      { title: '签约总额', dataIndex: 'year_sign', width: 88, render: ({ record }: any) => fmt(record.year_sign) },
      { title: '回款任务总额', dataIndex: 'year_task', width: 100, render: ({ record }: any) => fmt(record.year_task) },
      { title: '实际回款总额', dataIndex: 'year_actual', width: 100, render: ({ record }: any) => fmt(record.year_actual) },
      { title: '回款完成率', dataIndex: 'year_rate', width: 96, slotName: 'year_rate' },
    ]
  })
  return cols
})

const tableData = computed(() => {
  const year = filter.value.year
  const list = filter.value.ownerId ? salesUsers.filter(u => u.id === filter.value.ownerId) : salesUsers

  return list.map(u => {
    const row: any = { name: u.name, key: u.id }
    let ySign = 0, yTask = 0, yActual = 0

    for (let m = 1; m <= 12; m++) {
      const monthPrefix = `${year}-${String(m).padStart(2, '0')}`

      const signAmt = contracts
        .filter(c => c.ownerId === u.id && c.signDate.startsWith(monthPrefix))
        .reduce((s, c) => s + c.amount, 0)

      const taskAmt = targets.find(t => t.userId === u.id && t.year === year && t.month === m)?.paymentTarget || 0

      const actualAmt = paymentRecords
        .filter(p => {
          const c = contracts.find(ct => ct.id === p.contractId)
          return c && c.ownerId === u.id && p.actualDate.startsWith(monthPrefix) && p.status === 'approved'
        })
        .reduce((s, p) => s + p.amount, 0)

      const rate = taskAmt > 0 ? Math.round((actualAmt / taskAmt) * 100) : 0

      row[`m${m}_sign`] = signAmt
      row[`m${m}_task`] = taskAmt
      row[`m${m}_actual`] = actualAmt
      row[`m${m}_rate`] = rate

      ySign += signAmt
      yTask += taskAmt
      yActual += actualAmt
    }

    row.year_sign = ySign
    row.year_task = yTask
    row.year_actual = yActual
    row.year_rate = yTask > 0 ? Math.round((yActual / yTask) * 100) : 0
    return row
  })
})

// ---- 图表数据 ----
const chartData = computed(() => {
  const year = filter.value.year
  const list = filter.value.ownerId ? salesUsers.filter(u => u.id === filter.value.ownerId) : salesUsers

  return list.map(u => {
    const sign: number[] = []
    const task: number[] = []
    const actual: number[] = []
    const rate: number[] = []

    for (let m = 1; m <= 12; m++) {
      const monthPrefix = `${year}-${String(m).padStart(2, '0')}`

      const signAmt = contracts
        .filter(c => c.ownerId === u.id && c.signDate.startsWith(monthPrefix))
        .reduce((s, c) => s + c.amount, 0)

      const taskAmt = targets.find(t => t.userId === u.id && t.year === year && t.month === m)?.paymentTarget || 0

      const actualAmt = paymentRecords
        .filter(p => {
          const c = contracts.find(ct => ct.id === p.contractId)
          return c && c.ownerId === u.id && p.actualDate.startsWith(monthPrefix) && p.status === 'approved'
        })
        .reduce((s, p) => s + p.amount, 0)

      const r = taskAmt > 0 ? Math.round((actualAmt / taskAmt) * 100) : 0

      sign.push(signAmt)
      task.push(taskAmt)
      actual.push(actualAmt)
      rate.push(r)
    }
    return { name: u.name, sign, task, actual, rate }
  })
})

const summaryStats = computed(() => {
  if (tableData.value.length === 0) return []
  const totalSign = tableData.value.reduce((s, r) => s + r.year_sign, 0)
  const totalTask = tableData.value.reduce((s, r) => s + r.year_task, 0)
  const totalActual = tableData.value.reduce((s, r) => s + r.year_actual, 0)
  const avgRate = totalTask > 0 ? Math.round((totalActual / totalTask) * 100) : 0
  return [
    { label: '签约总额', value: totalSign.toLocaleString('zh-CN'), color: '#165dff' },
    { label: '回款任务', value: totalTask.toLocaleString('zh-CN'), color: '#ff7d00' },
    { label: '实际回款', value: totalActual.toLocaleString('zh-CN'), color: '#00b42a' },
    { label: '回款完成率', value: avgRate + '%', color: avgRate >= 100 ? '#00b42a' : avgRate >= 80 ? '#ff7d00' : '#f53f3f' },
  ]
})

// ---- ECharts ----
const barChartRef = ref<HTMLDivElement>()
const rateChartRef = ref<HTMLDivElement>()
let barChart: echarts.ECharts | null = null
let rateChart: echarts.ECharts | null = null

function renderBarChart() {
  if (!barChartRef.value) return
  if (!barChart) barChart = echarts.init(barChartRef.value)

  const data = chartData.value
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

  if (data.length === 1) {
    // Single person: show 3 bars per month
    const d = data[0]
    barChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['签约金额', '回款任务', '实际回款'] },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value', name: '元' },
      series: [
        { name: '签约金额', type: 'bar', data: d.sign, itemStyle: { color: '#3b82f6' } },
        { name: '回款任务', type: 'bar', data: d.task, itemStyle: { color: '#f59e0b' } },
        { name: '实际回款', type: 'bar', data: d.actual, itemStyle: { color: '#22c55e' } },
      ]
    }, true)
  } else {
    // Multiple people: show stacked bars by person
    barChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: data.map(d => d.name), type: 'scroll' },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value', name: '元' },
      series: data.map((d, i) => ({
        name: d.name,
        type: 'bar',
        data: d.actual,
        emphasis: { focus: 'series' },
      })),
    }, true)
  }
}

function renderRateChart() {
  if (!rateChartRef.value) return
  if (!rateChart) rateChart = echarts.init(rateChartRef.value)

  const data = chartData.value
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

  rateChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: data.map(d => d.name + '完成率'), type: 'scroll' },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', name: '%', min: 0, max: 120 },
    series: data.map(d => ({
      name: d.name + '完成率',
      type: 'line',
      data: d.rate,
      smooth: true,
      markLine: {
        silent: true,
        data: [{ yAxis: 100, label: { formatter: '100%达标线' }, lineStyle: { color: '#22c55e', type: 'dashed' } }],
      },
    })),
  }, true)
}

function handleResize() {
  barChart?.resize()
  rateChart?.resize()
}

watch(viewMode, (v) => {
  if (v === 'chart') nextTick(() => { renderBarChart(); renderRateChart() })
})
watch(filter, () => {
  if (viewMode.value === 'chart') nextTick(() => { renderBarChart(); renderRateChart() })
}, { deep: true })

onMounted(() => {
  nextTick(() => { renderBarChart(); renderRateChart() })
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  barChart?.dispose()
  rateChart?.dispose()
  window.removeEventListener('resize', handleResize)
})

function handleExport() {
  alert('导出Excel（演示版）')
}
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-label {
  font-size: 13px;
  color: #86909c;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
}
</style>
