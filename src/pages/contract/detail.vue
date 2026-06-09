<template>
  <div class="contract-detail-page">
    <div v-if="loading" style="text-align:center;padding:80px 0">
      <a-spin tip="加载中..." />
    </div>

    <template v-else>
      <div class="page-header">
        <a-button type="text" @click="$router.back()">
          <template #icon><icon-left /></template>
          返回
        </a-button>
        <h2 style="margin: 0 16px;">合同详情</h2>
      </div>

      <template v-if="contract">
        <!-- 合同基本信息 -->
        <a-card class="section-card" title="合同信息">
          <a-descriptions :column="3" bordered>
            <a-descriptions-item label="合同名称">{{ contractName }}</a-descriptions-item>
            <a-descriptions-item label="项目名称">{{ contract.name }}</a-descriptions-item>
            <a-descriptions-item label="合同编号">{{ contract.contractNo }}</a-descriptions-item>
            <a-descriptions-item label="客户名称">
              <a-link @click="$router.push(`/customer/detail/${contract.customerId}`)">
                {{ getCustomerName(contract.customerId) }}
              </a-link>
            </a-descriptions-item>
            <a-descriptions-item label="负责人">{{ getUserName(contract.ownerId) }}</a-descriptions-item>
            <a-descriptions-item label="客户来源">{{ contract.source }}</a-descriptions-item>
            <a-descriptions-item label="产品类型">{{ contract.productType }}</a-descriptions-item>
            <a-descriptions-item label="签约日期">{{ contract.signDate }}</a-descriptions-item>
            <a-descriptions-item label="到期日期">{{ contract.expireDate }}</a-descriptions-item>
            <a-descriptions-item label="合同状态">
              <a-tag :color="contractStatusColor(contract.status)">
                {{ contractStatusText(contract.status) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="维护费">
              {{ formatMoney(contract.maintenanceFee) }}
            </a-descriptions-item>
            <a-descriptions-item label="备注" :span="3">{{ contract.remark || '—' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 回款金额汇总 -->
        <a-card class="section-card" title="回款金额汇总">
          <a-row :gutter="16">
            <a-col :span="6" v-for="item in amountSummary" :key="item.label">
              <div class="amount-item">
                <div class="amount-label">{{ item.label }}</div>
                <div class="amount-value" :class="item.color">{{ item.value }}</div>
              </div>
            </a-col>
          </a-row>
        </a-card>

        <!-- 回款计划列表 -->
        <a-card class="section-card" title="回款计划">
          <a-table
            :data="planList"
            :columns="planColumns"
            :pagination="false"
            size="small"
            :bordered="true"
            row-key="id"
          >
            <template #status="{ record }">
              <a-tag :color="planStatusColor(record.status)">
                {{ planStatusText(record.status) }}
              </a-tag>
            </template>
          </a-table>
          <a-empty v-if="planList.length === 0" description="暂无回款计划" />
        </a-card>

        <!-- 回款记录列表 -->
        <a-card class="section-card" title="回款记录">
          <a-table
            :data="recordList"
            :columns="recordColumns"
            :pagination="false"
            size="small"
            :bordered="true"
            row-key="id"
          >
            <template #status="{ record }">
              <a-tag :color="recordStatusColor(record.status)">
                {{ recordStatusText(record.status) }}
              </a-tag>
            </template>
            <template #submitterId="{ record }">
              {{ getUserName(record.submitterId) }}
            </template>
            <template #approverId="{ record }">
              {{ record.approverId ? getUserName(record.approverId) : '—' }}
            </template>
          </a-table>
          <a-empty v-if="recordList.length === 0" description="暂无回款记录" />
        </a-card>

        <!-- 渠道费支付列表 -->
        <a-card class="section-card" title="渠道费支付记录">
          <a-table
            :data="feeList"
            :columns="feeColumns"
            :pagination="false"
            size="small"
            :bordered="true"
            row-key="id"
          >
            <template #status="{ record }">
              <a-tag color="green">{{ record.status }}</a-tag>
            </template>
          </a-table>
          <a-empty v-if="feeList.length === 0" description="暂无渠道费支付记录" />
        </a-card>
      </template>

      <a-result v-else status="404" title="合同不存在" subtitle="请检查合同ID是否正确">
        <template #extra>
          <a-button type="primary" @click="$router.back()">返回</a-button>
        </template>
      </a-result>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconLeft } from '@arco-design/web-vue/es/icon'

import {
  contracts,
  customers,
  users,
  paymentRecords,
  paymentPlans,
  channelFeeRecords,
} from '../../mock/data'

// ---------- 类型 ----------
interface Contract { id: number; ownerId: number; customerId: number; name: string; contractNo: string; source: string; productType: string; amount: number; channelFee: number; ourReceivable: number; accumPayment: number; accumChannelFee: number; accumOurActual: number; unpaidAmount: number; signDate: string; expireDate: string; maintenanceFee: number; remark: string; status: string }
interface PaymentPlan { id: number; contractId: number; phase: string; amount: number; channelFee: number; ourReceivable: number; planDate: string; status: string }
interface PaymentRecord { id: number; contractId: number; planId: number; amount: number; channelFee: number; ourActual: number; method: string; actualDate: string; status: string; approverId?: number; submitterId: number }
interface ChannelFeeRecord { id: number; paymentRecordId: number; amount: number; payDate: string; status: string; remark: string }

// ---------- 路由 ----------
const route = useRoute()
const contractId = computed(() => Number(route.params.id))

// ---------- 状态 ----------
const loading = ref(true)
const contract = ref<Contract | null>(null)

const contractName = computed(() => {
  if (!contract.value) return '—'
  return `${getCustomerName(contract.value.customerId)}_${contract.value.name}`
})

// ---------- 格式化 ----------
const formatMoney = (val: number): string => {
  if (val === 0) return '0'
  return val.toLocaleString('zh-CN')
}

const getCustomerName = (id: number): string => {
  const c = customers.find((item: any) => item.id === id)
  return c ? c.name : '—'
}

const getUserName = (id: number): string => {
  const u = users.find((item: any) => item.id === id)
  return u ? u.name : '—'
}

// ---------- 状态映射 ----------
const contractStatusColor = (s: string) => ({ pending: 'orange', executing: 'blue', completed: 'green', terminated: 'red' }[s] || 'gray')
const contractStatusText = (s: string) => ({ pending: '待执行', executing: '执行中', completed: '已完成', terminated: '已终止' }[s] || s)

const planStatusColor = (s: string) => ({ pending: 'orange', paid: 'green', overdue: 'red' }[s] || 'gray')
const planStatusText = (s: string) => ({ pending: '待回款', paid: '已回款', overdue: '逾期' }[s] || s)

const recordStatusColor = (s: string) => ({ approved: 'green', pending: 'orange', rejected: 'red' }[s] || 'gray')
const recordStatusText = (s: string) => ({ approved: '已通过', pending: '待审批', rejected: '已驳回' }[s] || s)

// ---------- 金额汇总 ----------
const amountSummary = computed(() => {
  if (!contract.value) return []
  const c = contract.value
  return [
    { label: '合同金额', value: formatMoney(c.amount), color: '' },
    { label: '渠道费', value: formatMoney(c.channelFee), color: 'orange' },
    { label: '我方应收', value: formatMoney(c.ourReceivable), color: 'blue' },
    { label: '累计回款', value: formatMoney(c.accumPayment), color: 'green' },
    { label: '累计渠道费', value: formatMoney(c.accumChannelFee), color: 'orange' },
    { label: '累计我方实收', value: formatMoney(c.accumOurActual), color: 'green' },
    { label: '未回款金额', value: formatMoney(c.unpaidAmount), color: 'red' },
  ]
})

// ---------- 表格数据 ----------
const planList = computed(() =>
  paymentPlans.filter((p: any) => p.contractId === contractId.value)
)

const recordList = computed(() =>
  paymentRecords.filter((r: any) => r.contractId === contractId.value)
)

const feeList = computed(() => {
  const recordIds = recordList.value.map((r: any) => r.id)
  return channelFeeRecords.filter((f: any) => recordIds.includes(f.paymentRecordId))
})

// ---------- 表格列 ----------
const planColumns = [
  { title: '期次', dataIndex: 'phase' },
  { title: '计划金额', dataIndex: 'amount', render: (_: any, r: any) => formatMoney(r.amount) },
  { title: '渠道费', dataIndex: 'channelFee', render: (_: any, r: any) => formatMoney(r.channelFee) },
  { title: '我方应收', dataIndex: 'ourReceivable', render: (_: any, r: any) => formatMoney(r.ourReceivable) },
  { title: '计划日期', dataIndex: 'planDate' },
  { title: '状态', slotName: 'status' },
]

const recordColumns = [
  { title: '回款金额', dataIndex: 'amount', render: (_: any, r: any) => formatMoney(r.amount) },
  { title: '渠道费', dataIndex: 'channelFee', render: (_: any, r: any) => formatMoney(r.channelFee) },
  { title: '我方实收', dataIndex: 'ourActual', render: (_: any, r: any) => formatMoney(r.ourActual) },
  { title: '付款方式', dataIndex: 'method' },
  { title: '实际日期', dataIndex: 'actualDate' },
  { title: '提交人', slotName: 'submitterId' },
  { title: '审批人', slotName: 'approverId' },
  { title: '审批状态', slotName: 'status' },
]

const feeColumns = [
  { title: '渠道费金额', dataIndex: 'amount', render: (_: any, r: any) => formatMoney(r.amount) },
  { title: '支付日期', dataIndex: 'payDate' },
  { title: '状态', slotName: 'status' },
  { title: '备注', dataIndex: 'remark' },
]

// ---------- 加载合同 ----------
const fetchContract = () => {
  loading.value = true
  const found = contracts.find((c: any) => c.id === contractId.value)
  if (found) {
    contract.value = found as any
  } else {
    contract.value = null
    Message.error('未找到对应合同')
  }
  loading.value = false
}

onMounted(() => {
  fetchContract()
})
</script>

<style scoped>
.contract-detail-page {
  padding: 16px;
  background: #f5f6f7;
  min-height: 100vh;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 16px;
}
.section-card {
  margin-bottom: 16px;
}
.amount-item {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.amount-label {
  font-size: 13px;
  color: #86909c;
  margin-bottom: 8px;
}
.amount-value {
  font-size: 22px;
  font-weight: 600;
  color: #1d2129;
}
.amount-value.orange { color: #ff7d00; }
.amount-value.blue   { color: #165dff; }
.amount-value.green  { color: #00b42a; }
.amount-value.red    { color: #f53f3f; }
</style>
