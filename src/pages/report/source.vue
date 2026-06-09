<template>
  <div>
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:16px">
        <h2>推广来源年度报表</h2>
        <a-radio-group v-model="viewMode" type="button" size="small">
          <a-radio value="chart">图表</a-radio>
          <a-radio value="table">表格</a-radio>
        </a-radio-group>
      </div>
    </div>

    <a-card size="small" style="margin-bottom: 16px">
      <a-form layout="inline" size="small">
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

      <a-row :gutter="16">
        <a-col :span="14">
          <a-card title="各渠道签约与回款对比（元）">
            <div ref="barChartRef" style="width: 100%; height: 380px"></div>
          </a-card>
        </a-col>
        <a-col :span="10">
          <a-card title="各渠道获客占比">
            <div ref="pieChartRef" style="width: 100%; height: 380px"></div>
          </a-card>
        </a-col>
      </a-row>

      <a-card title="各渠道转化率与复购率对比" style="margin-top: 16px">
        <div ref="rateChartRef" style="width: 100%; height: 320px"></div>
      </a-card>
    </template>

    <!-- 表格视图 -->
    <a-card v-else>
      <a-table :columns="columns" :data="tableData" :pagination="false" :scroll="{ x: 1800 }" size="small" bordered>
        <template #source="{ record }">
          <span style="font-weight: 600">{{ record.source }}</span>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { customers, contracts, paymentRecords, channelFeeRecords, productTypes } from '../../mock/data'

const productTypeList = productTypes.filter(p => p.enabled)
const fmt = (v: number) => v === 0 ? '0' : v.toLocaleString('zh-CN')
const viewMode = ref<'chart' | 'table'>('chart')

const filter = ref({ productType: '' as string })

function fetchData() {}

const allSources = Array.from(new Set([
  ...customers.map(c => c.source),
  ...contracts.map(c => c.source)
]))

const columns = [
  { title: '推广来源', dataIndex: 'source', width: 120, fixed: 'left', slotName: 'source' },
  { title: '总获客数', dataIndex: 'totalCustomers', width: 90 },
  { title: '成交客户数', dataIndex: 'signedCustomers', width: 100 },
  { title: '成交转化率%', dataIndex: 'signRate', width: 100 },
  { title: '首次合作-定制/模板客户数', dataIndex: 'firstCoop', width: 160 },
  { title: '累计签约总额', dataIndex: 'totalSign', width: 110, render: ({ record }: any) => fmt(record.totalSign) },
  { title: '累计回款总额', dataIndex: 'totalPayment', width: 110, render: ({ record }: any) => fmt(record.totalPayment) },
  { title: '累计支付渠道费', dataIndex: 'totalChannelFee', width: 120, render: ({ record }: any) => fmt(record.totalChannelFee) },
  { title: '我方累计实收', dataIndex: 'totalOurActual', width: 110, render: ({ record }: any) => fmt(record.totalOurActual) },
  { title: '新签合同数', dataIndex: 'newContractCount', width: 100 },
  { title: '复购合同数', dataIndex: 'repurchaseCount', width: 100 },
  { title: '客户复购率%', dataIndex: 'repurchaseRate', width: 100 },
  { title: '定制合同总额', dataIndex: 'customTotal', width: 110, render: ({ record }: any) => fmt(record.customTotal) },
  { title: '模板合同总额', dataIndex: 'templateTotal', width: 110, render: ({ record }: any) => fmt(record.templateTotal) },
]

const tableData = computed(() => {
  const ptFilter = filter.value.productType

  return allSources.map(source => {
    const sourceCustomers = customers.filter(c => c.source === source)
    const sourceContracts = contracts.filter(c => {
      if (c.source !== source) return false
      if (ptFilter && c.productType !== ptFilter) return false
      return true
    })

    const totalCustomers = sourceCustomers.length
    const signedCustomerSet = new Set(sourceContracts.map(c => c.customerId))
    const signedCustomers = signedCustomerSet.size
    const signRate = totalCustomers > 0 ? Math.round((signedCustomers / totalCustomers) * 100) : 0

    const firstCoopSet = new Set(sourceContracts.filter(c => c.productType === '定制首期' || c.productType === '模板新开').map(c => c.customerId))

    const totalSign = sourceContracts.reduce((s, c) => s + c.amount, 0)

    const relatedPaymentRecords = paymentRecords.filter(p => {
      const c = contracts.find(ct => ct.id === p.contractId)
      return c && c.source === source && p.status === 'approved' && (!ptFilter || c.productType === ptFilter)
    })
    const totalPayment = relatedPaymentRecords.reduce((s, p) => s + p.amount, 0)
    const totalOurActual = relatedPaymentRecords.reduce((s, p) => s + p.ourActual, 0)

    const relatedChannelFees = channelFeeRecords.filter(cf => {
      const pr = paymentRecords.find(p => p.id === cf.paymentRecordId)
      if (!pr || pr.status !== 'approved') return false
      const c = contracts.find(ct => ct.id === pr.contractId)
      return c && c.source === source && (!ptFilter || c.productType === ptFilter)
    })
    const totalChannelFee = relatedChannelFees.reduce((s, cf) => s + cf.amount, 0)

    const customerContractCounts = new Map<number, number>()
    contracts.forEach(c => { customerContractCounts.set(c.customerId, (customerContractCounts.get(c.customerId) || 0) + 1) })

    let newContractCount = 0; let repurchaseCount = 0
    sourceContracts.forEach(c => {
      const totalCc = customerContractCounts.get(c.customerId) || 1
      if (totalCc === 1) newContractCount++; else repurchaseCount++
    })

    const repurchaseCustomerSet = new Set<number>()
    signedCustomerSet.forEach(cid => { if ((customerContractCounts.get(cid) || 0) >= 2) repurchaseCustomerSet.add(cid) })
    const repurchaseRate = signedCustomers > 0 ? Math.round((repurchaseCustomerSet.size / signedCustomers) * 100) : 0

    const customTotal = sourceContracts.filter(c => c.productType.startsWith('定制')).reduce((s, c) => s + c.amount, 0)
    const templateTotal = sourceContracts.filter(c => c.productType.startsWith('模板')).reduce((s, c) => s + c.amount, 0)

    return { source, totalCustomers, signedCustomers, signRate, firstCoop: firstCoopSet.size, totalSign, totalPayment, totalChannelFee, totalOurActual, newContractCount, repurchaseCount, repurchaseRate, customTotal, templateTotal }
  }).filter(r => r.totalCustomers > 0 || r.totalSign > 0)
})

// ---- 汇总统计 ----
const summaryStats = computed(() => {
  const totalCust = tableData.value.reduce((s, r) => s + r.totalCustomers, 0)
  const totalPay = tableData.value.reduce((s, r) => s + r.totalPayment, 0)
  const totalOur = tableData.value.reduce((s, r) => s + r.totalOurActual, 0)
  const signedTotal = tableData.value.reduce((s, r) => s + r.signedCustomers, 0)
  const avgRate = totalCust > 0 ? Math.round((signedTotal / totalCust) * 100) : 0
  return [
    { label: '总获客数', value: totalCust, color: '#3b82f6' },
    { label: '签约转化率', value: avgRate + '%', color: '#22c55e' },
    { label: '累计回款', value: totalPay.toLocaleString('zh-CN'), color: '#f59e0b' },
    { label: '我方实收', value: totalOur.toLocaleString('zh-CN'), color: '#165dff' },
  ]
})

// ---- ECharts ----
const barChartRef = ref<HTMLDivElement>()
const pieChartRef = ref<HTMLDivElement>()
const rateChartRef = ref<HTMLDivElement>()
let barChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let rateChart: echarts.ECharts | null = null

function renderAllCharts() {
  const data = tableData.value
  if (!data.length) return

  if (barChartRef.value) {
    if (!barChart) barChart = echarts.init(barChartRef.value)
    barChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['累计签约额', '累计回款额', '我方实收'] },
      xAxis: { type: 'category', data: data.map(d => d.source), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '元' },
      series: [
        { name: '累计签约额', type: 'bar', data: data.map(d => d.totalSign), itemStyle: { color: '#3b82f6' }, barMaxWidth: 32 },
        { name: '累计回款额', type: 'bar', data: data.map(d => d.totalPayment), itemStyle: { color: '#f59e0b' }, barMaxWidth: 32 },
        { name: '我方实收', type: 'bar', data: data.map(d => d.totalOurActual), itemStyle: { color: '#22c55e' }, barMaxWidth: 32 },
      ],
      grid: { bottom: 80 }
    }, true)
  }

  if (pieChartRef.value) {
    if (!pieChart) pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{ type: 'pie', radius: ['45%', '75%'], center: ['40%', '50%'], label: { show: false }, emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } }, data: data.map(d => ({ name: d.source, value: d.totalCustomers })) }]
    }, true)
  }

  if (rateChartRef.value) {
    if (!rateChart) rateChart = echarts.init(rateChartRef.value)
    rateChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['成交转化率', '客户复购率'] },
      xAxis: { type: 'category', data: data.map(d => d.source), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '%', max: 100 },
      series: [
        { name: '成交转化率', type: 'bar', data: data.map(d => d.signRate), itemStyle: { color: '#3b82f6' }, barMaxWidth: 24 },
        { name: '客户复购率', type: 'bar', data: data.map(d => d.repurchaseRate), itemStyle: { color: '#a855f7' }, barMaxWidth: 24 },
      ],
      grid: { bottom: 80 }
    }, true)
  }
}

function handleResize() { barChart?.resize(); pieChart?.resize(); rateChart?.resize() }

watch(viewMode, (v) => { if (v === 'chart') nextTick(renderAllCharts) })
watch(filter, () => { if (viewMode.value === 'chart') nextTick(renderAllCharts) }, { deep: true })

onMounted(() => { nextTick(renderAllCharts); window.addEventListener('resize', handleResize) })
onUnmounted(() => { barChart?.dispose(); pieChart?.dispose(); rateChart?.dispose(); window.removeEventListener('resize', handleResize) })
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-label { font-size: 13px; color: #86909c; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 700; }
</style>
