<template>
  <div>
    <div class="page-header"><h2>产品类型数据报表</h2></div>

    <a-card size="small" style="margin-bottom: 16px">
      <a-form layout="inline" size="small">
        <a-form-item label="年度">
          <a-select v-model="filter.year" style="width: 120px">
            <a-option :value="2025">2025</a-option>
            <a-option :value="2026">2026</a-option>
            <a-option :value="2027">2027</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="负责人">
          <a-select v-model="filter.ownerIds" multiple allow-clear style="width: 200px" placeholder="全部">
            <a-option v-for="u in salesUsers" :key="u.id" :value="u.id">{{ u.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="客户来源">
          <a-select v-model="filter.source" allow-clear style="width: 160px" placeholder="全部">
            <a-option v-for="s in sources" :key="s" :value="s">{{ s }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="产品类型">
          <a-select v-model="filter.productType" allow-clear style="width: 140px" placeholder="全部">
            <a-option v-for="p in productTypeList" :key="p.name" :value="p.name">{{ p.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchData">查询</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="数据表格" style="margin-bottom: 16px">
      <a-table :columns="columns" :data="tableData" :pagination="false" :scroll="{ x: 2600 }" size="small" bordered>
        <template #name="{ record }">
          <span style="font-weight: 600">{{ record.name }}</span>
        </template>
      </a-table>
    </a-card>

    <a-card title="产品类型月度对比">
      <div ref="chartRef" style="width: 100%; height: 420px"></div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { users, contracts, productTypes } from '../../mock/data'

const salesUsers = users.filter(u => u.role === 'sales' || u.role === 'manager')
const productTypeList = productTypes.filter(p => p.enabled)
const sources = ['百度', '抖音', '小红书', '淘宝', 'GEO', '其他', '自拓']
const fmt = (v: number) => v === 0 ? '0' : v.toLocaleString('zh-CN')

const filter = ref({
  year: 2026,
  ownerIds: [] as number[],
  source: '',
  productType: '',
})

function fetchData() {
  // reactive
}

const columns = computed(() => {
  const cols: any[] = [
    { title: '负责人', dataIndex: 'name', width: 90, fixed: 'left', slotName: 'name' }
  ]
  for (let m = 1; m <= 12; m++) {
    cols.push({
      title: `${m}月`,
      children: [
        { title: '合同数', dataIndex: `m${m}_count`, width: 72 },
        { title: '金额', dataIndex: `m${m}_amount`, width: 88, render: ({ record }: any) => fmt(record[`m${m}_amount`]) },
      ]
    })
  }
  return cols
})

function matchContract(c: typeof contracts[0]) {
  const f = filter.value
  if (f.ownerIds.length && !f.ownerIds.includes(c.ownerId)) return false
  if (f.source && c.source !== f.source) return false
  if (f.productType && c.productType !== f.productType) return false
  return true
}

const tableData = computed(() => {
  const year = filter.value.year
  const ownerIds = filter.value.ownerIds.length ? filter.value.ownerIds : salesUsers.map(u => u.id)

  return ownerIds.map(oid => {
    const u = users.find(x => x.id === oid)!
    const row: any = { name: u.name, key: u.id }

    for (let m = 1; m <= 12; m++) {
      const prefix = `${year}-${String(m).padStart(2, '0')}`
      const list = contracts.filter(c => c.ownerId === oid && c.signDate.startsWith(prefix) && matchContract(c))
      row[`m${m}_count`] = list.length
      row[`m${m}_amount`] = list.reduce((s, c) => s + c.amount, 0)
    }
    return row
  })
})

// Chart: grouped bar per month by product type
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)

  const year = filter.value.year
  const ptNames = filter.value.productType
    ? [filter.value.productType]
    : productTypeList.map(p => p.name)

  const series = ptNames.map((pt, idx) => {
    const data: number[] = []
    for (let m = 1; m <= 12; m++) {
      const prefix = `${year}-${String(m).padStart(2, '0')}`
      const amt = contracts
        .filter(c => {
          if (!c.signDate.startsWith(prefix)) return false
          if (c.productType !== pt) return false
          const f = filter.value
          if (f.ownerIds.length && !f.ownerIds.includes(c.ownerId)) return false
          if (f.source && c.source !== f.source) return false
          return true
        })
        .reduce((s, c) => s + c.amount, 0)
      data.push(amt)
    }
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
    return {
      name: pt,
      type: 'bar' as const,
      data,
      itemStyle: { color: colors[idx % colors.length] }
    }
  })

  chartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ptNames },
    xAxis: { type: 'category', data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`) },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v.toLocaleString('zh-CN') } },
    series
  }, true)
}

function handleResize() { chartInstance?.resize() }

watch(filter, () => nextTick(renderChart), { deep: true })

onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  chartInstance?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>
