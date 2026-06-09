<template>
  <div>
    <div class="page-header"><h2>驾驶舱</h2></div>

    <!-- 核心数据卡片 -->
    <div class="stat-cards">
      <a-card class="stat-card" v-for="card in statCards" :key="card.label">
        <div class="label">{{ card.label }}</div>
        <div class="value">{{ card.value }}</div>
        <div class="sub">{{ card.sub }}</div>
      </a-card>
    </div>

    <!-- 回款情况表格 -->
    <a-card title="回款情况 — 今年每月每人" style="margin-bottom:20px">
      <a-table :columns="paymentColumns" :data="paymentTableData" :pagination="false" :scroll="{ x: 1800 }"
        size="small" bordered>
        <template #cell="{ column, record }">
          <template v-if="column.dataIndex === 'name'">
            <span class="fixed-left" style="display:inline-block;width:100%">{{ record.name }}</span>
          </template>
          <template v-else-if="column.dataIndex !== 'name'">
            <div style="font-size:11px;line-height:1.4">
              <div>签: {{ fmt(record[column.dataIndex + '_sign']) }}</div>
              <div>任: {{ fmt(record[column.dataIndex + '_task']) }}</div>
              <div>回: {{ fmt(record[column.dataIndex + '_actual']) }}</div>
              <div :class="rateClass(record[column.dataIndex + '_rate'])">率: {{ record[column.dataIndex + '_rate'] }}%</div>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 图表行 -->
    <a-row :gutter="16" style="margin-bottom:20px">
      <a-col :span="12">
        <div class="chart-container"><div ref="trendRef" style="width:100%;height:380px"></div></div>
      </a-col>
      <a-col :span="12">
        <div class="chart-container"><div ref="growthRef" style="width:100%;height:380px"></div></div>
      </a-col>
    </a-row>

    <!-- 待办快捷入口 -->
    <a-row :gutter="16">
      <a-col :span="6" v-for="todo in todos" :key="todo.title">
        <a-card :hoverable="true" @click="$router.push('/todo')" style="cursor:pointer">
          <div style="text-align:center">
            <div style="font-size:13px;color:var(--color-text-3);margin-bottom:8px">{{ todo.title }}</div>
            <div :style="{ fontSize:'30px', fontWeight:700, color: todo.color }">{{ todo.count }}</div>
            <div style="font-size:12px;color:var(--color-text-4)">条待处理</div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { users, contracts, paymentRecords, paymentPlans, targets, customers, followups } from '../../mock/data'

const fmt = (v: any) => v == null ? '--' : typeof v === 'number' ? v.toLocaleString('zh-CN') : v

const statCards = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const month = dayjs().format('YYYY-MM')
  const thisMonthContracts = contracts.filter(c => c.signDate.startsWith(month))
  const thisMonthPayments = paymentRecords.filter(p => p.actualDate.startsWith(month) && p.status === 'approved')
  const todayContracts = contracts.filter(c => c.signDate === today)
  const todayPayments = paymentRecords.filter(p => p.actualDate === today && p.status === 'approved')
  const todayCustomers = customers.filter(c => c.createdAt === today)
  const yearContracts = contracts.filter(c => c.signDate.startsWith('2026'))
  const yearPayments = paymentRecords.filter(p => p.actualDate.startsWith('2026') && p.status === 'approved')
  const monthTaskTotal = targets.filter(t => t.year === 2026 && t.month === dayjs().month() + 1).reduce((s, t) => s + t.paymentTarget, 0)

  return [
    { label: '今日新增客户', value: todayCustomers.length + '个', sub: '' },
    { label: '今日签约合同', value: todayContracts.length + '份', sub: '金额 ' + fmt(todayContracts.reduce((s, c) => s + c.amount, 0)) },
    { label: '今日回款金额', value: fmt(todayPayments.reduce((s, p) => s + p.amount, 0)), sub: todayPayments.length + '笔' },
    { label: '本月签约金额', value: fmt(thisMonthContracts.reduce((s, c) => s + c.amount, 0)), sub: thisMonthContracts.length + '份合同' },
    { label: '本月回款金额', value: fmt(thisMonthPayments.reduce((s, p) => s + p.amount, 0)), sub: '完成率 ' + (monthTaskTotal ? ((thisMonthPayments.reduce((s, p) => s + p.amount, 0) / monthTaskTotal) * 100).toFixed(1) : '--') + '%' },
    { label: '本年签约金额', value: fmt(yearContracts.reduce((s, c) => s + c.amount, 0)), sub: yearContracts.length + '份合同' },
    { label: '本年回款金额', value: fmt(yearPayments.reduce((s, p) => s + p.amount, 0)), sub: yearPayments.length + '笔' },
    { label: '本月回款完成率', value: monthTaskTotal ? ((thisMonthPayments.reduce((s, p) => s + p.amount, 0) / monthTaskTotal) * 100).toFixed(1) + '%' : '--', sub: '任务 ' + fmt(monthTaskTotal) },
  ]
})

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const salesUsers = users.filter(u => u.role === 'sales' || u.role === 'manager')

const paymentColumns = computed(() => {
  const cols: any[] = [{ title: '负责人', dataIndex: 'name', width: 80, fixed: 'left' }]
  months.forEach((m, i) => {
    cols.push({ title: m, dataIndex: 'm' + (i + 1), width: 120 })
  })
  cols.push({ title: '年度汇总', dataIndex: 'year', width: 120, fixed: 'right' })
  return cols
})

const paymentTableData = computed(() => {
  return salesUsers.map(u => {
    const row: any = { name: u.name, key: u.id }
    months.forEach((_, i) => {
      const monthStr = `2026-${String(i + 1).padStart(2, '0')}`
      const signAmt = contracts.filter(c => c.ownerId === u.id && c.signDate.startsWith(monthStr)).reduce((s, c) => s + c.amount, 0)
      const taskAmt = targets.find(t => t.userId === u.id && t.year === 2026 && t.month === i + 1)?.paymentTarget || 0
      const actualAmt = paymentRecords.filter(p => {
        const c = contracts.find(c2 => c2.id === p.contractId)
        return c && c.ownerId === u.id && p.actualDate.startsWith(monthStr) && p.status === 'approved'
      }).reduce((s, p) => s + p.amount, 0)
      const rate = taskAmt > 0 ? Math.round((actualAmt / taskAmt) * 100) : 0
      const key = 'm' + (i + 1)
      row[key + '_sign'] = signAmt
      row[key + '_task'] = taskAmt
      row[key + '_actual'] = actualAmt
      row[key + '_rate'] = rate
    })
    // Year summary
    let ySign = 0, yTask = 0, yActual = 0
    months.forEach((_, i) => {
      ySign += row['m' + (i + 1) + '_sign'] || 0
      yTask += row['m' + (i + 1) + '_task'] || 0
      yActual += row['m' + (i + 1) + '_actual'] || 0
    })
    row['year_sign'] = ySign
    row['year_task'] = yTask
    row['year_actual'] = yActual
    row['year_rate'] = yTask > 0 ? Math.round((yActual / yTask) * 100) : 0
    return row
  })
})

function rateClass(rate: number) {
  if (rate >= 100) return 'rate-green'
  if (rate >= 80) return 'rate-yellow'
  return 'rate-red'
}

// 待办统计
const todos = computed(() => {
  const pendingPayments = paymentRecords.filter(p => p.status === 'pending').length
  const expiringContracts = contracts.filter(c => c.status === 'executing' && c.expireDate >= dayjs().startOf('month').format('YYYY-MM-DD') && c.expireDate <= dayjs().endOf('month').format('YYYY-MM-DD')).length
  const inactiveThreshold = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
  const inactiveCustomers = customers.filter(c => {
    const lastF = followups.filter(f => f.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    return c.status === 'normal' && lastF && lastF.date < inactiveThreshold && contracts.some(ct => ct.customerId === c.id && ct.status === 'executing')
  }).length
  const monthPlans = paymentPlans.filter(p => p.planDate >= dayjs().startOf('month').format('YYYY-MM-DD') && p.planDate <= dayjs().endOf('month').format('YYYY-MM-DD') && p.status === 'pending').length
  return [
    { title: '待审批回款', count: pendingPayments, color: '#f59e0b' },
    { title: '本月到期合同', count: expiringContracts, color: '#ef4444' },
    { title: '超1月未联系客户', count: inactiveCustomers, color: '#3b82f6' },
    { title: '本月计划收款', count: monthPlans, color: '#22c55e' },
  ]
})

const trendRef = ref<HTMLDivElement>()
const growthRef = ref<HTMLDivElement>()

onMounted(() => {
  // 年度回款趋势图
  if (trendRef.value) {
    const chart = echarts.init(trendRef.value)
    const signData: number[] = [], actualData: number[] = []
    for (let m = 1; m <= 12; m++) {
      const ms = `2026-${String(m).padStart(2, '0')}`
      signData.push(contracts.filter(c => c.signDate.startsWith(ms)).reduce((s, c) => s + c.amount, 0))
      actualData.push(paymentRecords.filter(p => p.status === 'approved' && p.actualDate.startsWith(ms)).reduce((s, p) => s + p.amount, 0))
    }
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['签约金额', '实际回款'] },
      xAxis: { data: months },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v.toLocaleString('zh-CN') } },
      series: [
        { name: '签约金额', type: 'line', data: signData, smooth: true, itemStyle: { color: '#3b82f6' } },
        { name: '实际回款', type: 'line', data: actualData, smooth: true, itemStyle: { color: '#22c55e' } },
      ]
    })
    chart.resize()
  }

  // 客户增长概览
  if (growthRef.value) {
    const chart = echarts.init(growthRef.value)
    const newCust: number[] = [], signCust: number[] = []
    for (let m = 1; m <= 12; m++) {
      const ms = `2026-${String(m).padStart(2, '0')}`
      newCust.push(customers.filter(c => c.createdAt.startsWith(ms)).length)
      signCust.push(contracts.filter(c => c.signDate.startsWith(ms)).map(c => c.customerId).filter((v, i, a) => a.indexOf(v) === i).length)
    }
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增客户', '签约客户'] },
      xAxis: { data: months },
      yAxis: { type: 'value' },
      series: [
        { name: '新增客户', type: 'bar', data: newCust, itemStyle: { color: '#3b82f6' } },
        { name: '签约客户', type: 'bar', data: signCust, itemStyle: { color: '#22c55e' } },
      ]
    })
    chart.resize()
  }
})
</script>
