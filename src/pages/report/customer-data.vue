<template>
  <div>
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:16px">
        <h2>客户数据报表</h2>
        <a-radio-group v-model="viewMode" type="button" size="small">
          <a-radio value="chart">图表</a-radio>
          <a-radio value="table">表格</a-radio>
        </a-radio-group>
      </div>
    </div>

    <a-card size="small" style="margin-bottom: 16px">
      <a-form layout="inline" size="small">
        <a-form-item label="年度">
          <a-select v-model="filter.year" allow-clear style="width: 120px" placeholder="全部">
            <a-option value="">全部</a-option>
            <a-option :value="2025">2025</a-option>
            <a-option :value="2026">2026</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="负责人">
          <a-select v-model="filter.ownerIds" multiple allow-clear style="width: 200px" placeholder="全部">
            <a-option v-for="u in salesUsers" :key="u.id" :value="u.id">{{ u.name }}</a-option>
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
        <a-col :span="6" v-for="s in custSummaryStats" :key="s.label">
          <a-card size="small" class="stat-card">
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="14">
          <a-card title="月度新增客户与签约客户趋势">
            <div ref="trendChartRef" style="width: 100%; height: 380px"></div>
          </a-card>
        </a-col>
        <a-col :span="10">
          <a-card title="客户来源分布">
            <div ref="sourcePieRef" style="width: 100%; height: 380px"></div>
          </a-card>
        </a-col>
      </a-row>
    </template>

    <!-- 表格视图 -->
    <a-card v-else>
      <a-table :columns="columns" :data="tableData" :pagination="false" :scroll="{ x: 2800 }" size="small" bordered>
        <template #name="{ record }">
          <span style="font-weight: 600">{{ record.name }}</span>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { users, customers, contracts } from '../../mock/data'

const salesUsers = users.filter(u => u.role === 'sales' || u.role === 'manager')
const viewMode = ref<'chart' | 'table'>('chart')

const filter = ref({ year: '' as string | number, ownerIds: [] as number[] })

function fetchData() {}

function matchYear(date: string, year: string | number) {
  if (!year) return true
  return date.startsWith(String(year))
}

// ---- 表格列 ----
const columns = computed(() => {
  const cols: any[] = [
    { title: '负责人', dataIndex: 'name', width: 90, fixed: 'left', slotName: 'name' }
  ]
  for (let m = 1; m <= 12; m++) {
    cols.push({
      title: `${m}月`,
      children: [
        { title: '新增', dataIndex: `m${m}_total`, width: 60 },
        { title: '渠道', dataIndex: `m${m}_channel`, width: 60 },
        { title: '自拓', dataIndex: `m${m}_self`, width: 60 },
      ]
    })
  }
  cols.push(
    { title: '签约客户总数', dataIndex: 'signedTotal', width: 110 },
    { title: '定制首期签约数', dataIndex: 'customFirst', width: 120 },
    { title: '模板新开签约数', dataIndex: 'templateNew', width: 120 },
    { title: '客户转化率%', dataIndex: 'convertRate', width: 100 }
  )
  return cols
})

const tableData = computed(() => {
  const year = filter.value.year
  const ownerIds = filter.value.ownerIds.length ? filter.value.ownerIds : salesUsers.map(u => u.id)

  return ownerIds.map(oid => {
    const u = users.find(x => x.id === oid)!
    const row: any = { name: u.name, key: u.id }

    let signedTotalSet = new Set<number>()
    let customFirst = 0
    let templateNew = 0

    for (let m = 1; m <= 12; m++) {
      const prefix = year ? `${year}-${String(m).padStart(2, '0')}` : String(m).padStart(2, '0')
      const monthCustomers = customers.filter(c => {
        if (c.ownerId !== oid) return false
        return year ? c.createdAt.startsWith(prefix) : c.createdAt.includes(`-${prefix}`)
      })
      row[`m${m}_total`] = monthCustomers.length
      row[`m${m}_channel`] = monthCustomers.filter(c => c.source !== '自拓').length
      row[`m${m}_self`] = monthCustomers.filter(c => c.source === '自拓').length
    }

    const userContracts = contracts.filter(c => c.ownerId === oid && matchYear(c.signDate, year))
    userContracts.forEach(c => {
      signedTotalSet.add(c.customerId)
      if (c.productType === '定制首期') customFirst++
      if (c.productType === '模板新开') templateNew++
    })

    const totalCustomers = customers.filter(c => c.ownerId === oid).length
    row.signedTotal = signedTotalSet.size
    row.customFirst = customFirst
    row.templateNew = templateNew
    row.convertRate = totalCustomers > 0 ? Math.round((signedTotalSet.size / totalCustomers) * 100) : 0
    return row
  })
})

// ---- 汇总统计 ----
const custSummaryStats = computed(() => {
  const year = filter.value.year
  const ownerIds = filter.value.ownerIds.length ? filter.value.ownerIds : salesUsers.map(u => u.id)

  const allCustomers = customers.filter(c => ownerIds.includes(c.ownerId) && matchYear(c.createdAt, year))
  const allSignedIds = new Set(
    contracts.filter(c => ownerIds.includes(c.ownerId) && matchYear(c.signDate, year)).map(c => c.customerId)
  )
  const totalCust = customers.filter(c => ownerIds.includes(c.ownerId)).length
  const convRate = totalCust > 0 ? Math.round((allSignedIds.size / totalCust) * 100) : 0

  return [
    { label: '新增客户', value: allCustomers.length, color: '#3b82f6' },
    { label: '签约客户', value: allSignedIds.size, color: '#22c55e' },
    { label: '客户转化率', value: convRate + '%', color: convRate >= 30 ? '#22c55e' : '#f59e0b' },
    { label: '人均新增客户', value: ownerIds.length > 0 ? (allCustomers.length / ownerIds.length).toFixed(1) : '0', color: '#165dff' },
  ]
})

// ---- ECharts ----
const trendChartRef = ref<HTMLDivElement>()
const sourcePieRef = ref<HTMLDivElement>()
let trendChart: echarts.ECharts | null = null
let sourcePieChart: echarts.ECharts | null = null

const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

function renderTrendChart() {
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)

  const year = filter.value.year
  const ownerIds = filter.value.ownerIds.length ? filter.value.ownerIds : salesUsers.map(u => u.id)

  const newCust: number[] = []
  const signCust: number[] = []

  for (let m = 1; m <= 12; m++) {
    const prefix = year ? `${year}-${String(m).padStart(2, '0')}` : String(m).padStart(2, '0')

    const nc = customers.filter(c => {
      if (!ownerIds.includes(c.ownerId)) return false
      return year ? c.createdAt.startsWith(prefix) : c.createdAt.includes(`-${prefix}`)
    }).length

    const sc = new Set(
      contracts.filter(c => {
        if (!ownerIds.includes(c.ownerId)) return false
        return year ? c.signDate.startsWith(prefix) : c.signDate.includes(`-${prefix}`)
      }).map(c => c.customerId)
    ).size

    newCust.push(nc)
    signCust.push(sc)
  }

  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增客户', '签约客户'] },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', name: '人数' },
    series: [
      { name: '新增客户', type: 'bar', data: newCust, itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 40 },
      { name: '签约客户', type: 'line', data: signCust, itemStyle: { color: '#22c55e' }, lineStyle: { width: 3 }, symbolSize: 8, smooth: true },
    ]
  }, true)
}

function renderSourcePie() {
  if (!sourcePieRef.value) return
  if (!sourcePieChart) sourcePieChart = echarts.init(sourcePieRef.value)

  const year = filter.value.year
  const ownerIds = filter.value.ownerIds.length ? filter.value.ownerIds : salesUsers.map(u => u.id)

  const all = customers.filter(c => ownerIds.includes(c.ownerId) && matchYear(c.createdAt, year))
  const sourceMap: Record<string, number> = {}
  all.forEach(c => {
    const src = c.source || '其他'
    sourceMap[src] = (sourceMap[src] || 0) + 1
  })

  const pieData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }))

  sourcePieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: pieData,
    }]
  }, true)
}

function handleResize() {
  trendChart?.resize()
  sourcePieChart?.resize()
}

watch(viewMode, (v) => {
  if (v === 'chart') nextTick(() => { renderTrendChart(); renderSourcePie() })
})
watch(filter, () => {
  if (viewMode.value === 'chart') nextTick(() => { renderTrendChart(); renderSourcePie() })
}, { deep: true })

onMounted(() => {
  nextTick(() => { renderTrendChart(); renderSourcePie() })
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  trendChart?.dispose()
  sourcePieChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
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
