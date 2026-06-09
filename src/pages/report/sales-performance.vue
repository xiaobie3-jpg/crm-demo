<template>
  <div>
    <div class="page-header">
      <h2>销售业绩年度报表</h2>
    </div>

    <a-card size="small" style="margin-bottom: 16px">
      <a-form layout="inline" size="small">
        <a-form-item label="时间段">
          <a-range-picker v-model="filter.range" value-format="YYYY-MM-DD" style="width: 240px" />
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

    <a-card title="数据表格" style="margin-bottom: 16px">
      <a-table :columns="columns" :data="tableData" :pagination="false" :scroll="{ x: 1400 }" size="small" bordered>
        <template #name="{ record }">
          <span style="font-weight: 600">{{ record.name }}</span>
        </template>
        <template #signAmount="{ record }">{{ fmt(record.signAmount) }}</template>
        <template #paymentAmount="{ record }">{{ fmt(record.paymentAmount) }}</template>
        <template #channelFee="{ record }">{{ fmt(record.channelFee) }}</template>
        <template #ourActual="{ record }">{{ fmt(record.ourActual) }}</template>
      </a-table>
    </a-card>

    <a-card title="签约金额与回款金额对比">
      <div ref="chartRef" style="width: 100%; height: 420px"></div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { users, customers, contracts, paymentRecords } from '../../mock/data'

const salesUsers = users.filter(u => u.role === 'sales' || u.role === 'manager')
const fmt = (v: number) => v === 0 ? '0' : (v / 10000).toFixed(1) + 'w'

const filter = ref({
  range: [] as string[],
  ownerIds: [] as number[],
})

function fetchData() {
  // reactive
}

function inRange(date: string) {
  const r = filter.value.range
  if (!r || r.length !== 2) return true
  return date >= r[0] && date <= r[1]
}

const columns = [
  { title: '负责人', dataIndex: 'name', width: 90, fixed: 'left', slotName: 'name' },
  { title: '新增客户数', dataIndex: 'newCustomers', width: 100 },
  { title: '成交客户数', dataIndex: 'signedCustomers', width: 100 },
  { title: '新签合同数', dataIndex: 'newContracts', width: 100 },
  { title: '复购合同数', dataIndex: 'repurchaseContracts', width: 100 },
  { title: '签约总金额', dataIndex: 'signAmount', width: 110, slotName: 'signAmount' },
  { title: '回款总金额', dataIndex: 'paymentAmount', width: 110, slotName: 'paymentAmount' },
  { title: '渠道费总金额', dataIndex: 'channelFee', width: 110, slotName: 'channelFee' },
  { title: '我方实收总金额', dataIndex: 'ourActual', width: 120, slotName: 'ourActual' },
]

const tableData = computed(() => {
  const ownerIds = filter.value.ownerIds.length ? filter.value.ownerIds : salesUsers.map(u => u.id)

  // Pre-calculate contract counts per customer
  const customerContractCounts = new Map<number, number>()
  contracts.forEach(c => {
    customerContractCounts.set(c.customerId, (customerContractCounts.get(c.customerId) || 0) + 1)
  })

  return ownerIds.map(oid => {
    const u = users.find(x => x.id === oid)!

    const newCustomers = customers.filter(c => c.ownerId === oid && inRange(c.createdAt)).length

    const userContracts = contracts.filter(c => c.ownerId === oid && inRange(c.signDate))
    const signedCustomerSet = new Set(userContracts.map(c => c.customerId))
    const signedCustomers = signedCustomerSet.size

    let newContracts = 0
    let repurchaseContracts = 0
    userContracts.forEach(c => {
      const cc = customerContractCounts.get(c.customerId) || 1
      if (cc === 1) newContracts++
      else repurchaseContracts++
    })

    const signAmount = userContracts.reduce((s, c) => s + c.amount, 0)

    const userPayments = paymentRecords.filter(p => {
      const c = contracts.find(ct => ct.id === p.contractId)
      return c && c.ownerId === oid && p.status === 'approved' && inRange(p.actualDate)
    })
    const paymentAmount = userPayments.reduce((s, p) => s + p.amount, 0)
    const channelFee = userPayments.reduce((s, p) => s + p.channelFee, 0)
    const ourActual = userPayments.reduce((s, p) => s + p.ourActual, 0)

    return {
      name: u.name,
      key: u.id,
      newCustomers,
      signedCustomers,
      newContracts,
      repurchaseContracts,
      signAmount,
      paymentAmount,
      channelFee,
      ourActual,
    }
  })
})

// Chart
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)

  const data = tableData.value
  const names = data.map(d => d.name)
  const signData = data.map(d => d.signAmount)
  const paymentData = data.map(d => d.paymentAmount)

  chartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['签约总金额', '回款总金额'] },
    xAxis: { type: 'category', data: names },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => (v / 10000).toFixed(0) + 'w' } },
    series: [
      { name: '签约总金额', type: 'bar', data: signData, itemStyle: { color: '#3b82f6' } },
      { name: '回款总金额', type: 'bar', data: paymentData, itemStyle: { color: '#22c55e' } },
    ]
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
