<template>
  <div>
    <div class="page-header">
      <a-button type="text" @click="$router.back()">
        <template #icon><icon-left /></template>
        返回
      </a-button>
      <h2 style="margin: 0 16px;">客户详情</h2>
    </div>
    <a-spin :loading="!customer">
      <template v-if="customer">
        <!-- 客户信息 -->
        <div class="detail-section">
          <h3>客户信息 <a-button type="text" size="small" @click="$router.push('/customer/list')">编辑</a-button></h3>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">客户编号</span><span class="value">{{ customer.code }}</span></div>
            <div class="detail-item"><span class="label">客户名称</span><span class="value">{{ customer.name }}</span></div>
            <div class="detail-item"><span class="label">客户等级</span><span class="value"><a-tag :color="customer.level==='签约客户'?'green':'blue'">{{ customer.level }}</a-tag></span></div>
            <div class="detail-item"><span class="label">联系人</span><span class="value">{{ customer.contact }}</span></div>
            <div class="detail-item"><span class="label">电话</span><span class="value">{{ customer.phone }}</span></div>
            <div class="detail-item"><span class="label">客户来源</span><span class="value">{{ customer.source }}</span></div>
            <div class="detail-item"><span class="label">分配日期</span><span class="value">{{ customer.assignDate }}</span></div>
            <div class="detail-item"><span class="label">负责人</span><span class="value">{{ getUser(customer.ownerId)?.name || '未分配' }}</span></div>
            <div class="detail-item"><span class="label">客户标签</span><span class="value"><a-tag v-for="t in customer.tags" :key="t" size="small" color="arcoblue" style="margin:1px">{{ t }}</a-tag></span></div>
            <div class="detail-item"><span class="label">备注</span><span class="value">{{ customer.remark }}</span></div>
            <div class="detail-item"><span class="label">创建日期</span><span class="value">{{ customer.createdAt }}</span></div>
            <div class="detail-item"><span class="label">最新往来</span><span class="value">{{ customer.latestFollowup }}</span></div>
          </div>
        </div>

        <!-- 数据概览 -->
        <div class="detail-section">
          <h3>数据概览</h3>
          <div class="stat-cards" style="grid-template-columns:repeat(5,1fr)">
            <a-card class="stat-card" v-for="(s, idx) in overviewStats" :key="s.label" :style="{ background: s.gradient }">
              <div class="icon-bg"><component :is="s.icon" /></div>
              <div class="label">{{ s.label }}</div>
              <div class="value" style="font-size:20px">{{ s.value }}</div>
            </a-card>
          </div>
        </div>

        <!-- 合同列表 -->
        <div class="detail-section">
          <h3>合同列表</h3>
          <a-table :columns="contractCols" :data="custContracts" size="small" :pagination="false"
            @row-click="(r:any) => $router.push(`/contract/detail/${r.id}`)" row-class="cursor-pointer">
            <template #name="{ record }">{{ record.name }}</template>
            <template #amount="{ record }">{{ fmtW(record.amount) }}</template>
            <template #accumPayment="{ record }">{{ fmtW(record.accumPayment) }}</template>
            <template #accumChannelFee="{ record }">{{ fmtW(record.accumChannelFee) }}</template>
            <template #expireDate="{ record }">{{ record.expireDate }}</template>
          </a-table>
        </div>

        <!-- 回款记录 -->
        <div class="detail-section">
          <h3>回款记录</h3>
          <a-table :columns="paymentCols" :data="custPayments" size="small" :pagination="false">
            <template #amount="{ record }">{{ fmtW(record.amount) }}</template>
            <template #channelFee="{ record }">{{ fmtW(record.channelFee) }}</template>
            <template #ourActual="{ record }">{{ fmtW(record.ourActual) }}</template>
            <template #contractNo="{ record }">{{ getContract(record.contractId)?.contractNo }}</template>
            <template #status="{ record }">
              <a-tag :color="record.status==='approved'?'green':record.status==='pending'?'orange':'red'" size="small">{{ record.status==='approved'?'已通过':record.status==='pending'?'待审批':'已驳回' }}</a-tag>
            </template>
          </a-table>
        </div>

        <!-- 往来列表 -->
        <div class="detail-section">
          <h3>往来列表（跟进记录）</h3>
          <a-table :columns="fwCols" :data="custFollowups" size="small" :pagination="false">
            <template #ownerId="{ record }">{{ getUser(record.ownerId)?.name }}</template>
          </a-table>
        </div>
      </template>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IconLeft } from '@arco-design/web-vue/es/icon'
import { customers, users, contracts, paymentRecords, followups } from '../../mock/data'
const route = useRoute()
const customer = ref<any>(null)

onMounted(() => {
  const id = Number(route.params.id)
  customer.value = customers.find(c => c.id === id) || null
})

function getUser(id: number) { return users.find(u => u.id === id) }
function getContract(id: number) { return contracts.find(c => c.id === id) }
function fmtW(v: number) { return v === 0 ? '0' : v.toLocaleString('zh-CN') }

const custContracts = computed(() => customer.value ? contracts.filter(c => c.customerId === customer.value.id) : [])
const custPayments = computed(() => customer.value ? paymentRecords.filter(p => custContracts.value.some(ct => ct.id === p.contractId)) : [])
const custFollowups = computed(() => customer.value ? followups.filter(f => f.customerId === customer.value.id) : [])

const overviewStats = computed(() => {
  const gradients = [
    'linear-gradient(135deg, #165dff 0%, #4080ff 100%)',
    'linear-gradient(135deg, #00b42a 0%, #4cd263 100%)',
    'linear-gradient(135deg, #f77234 0%, #ff9a5e 100%)',
    'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #0fc6c2 0%, #5ce1e6 100%)',
  ]
  const icons = ['IconFile', 'IconMoney', 'IconSafe', 'IconCoin', 'IconMessage'] as any[]
  const stats = [
    { label: '签约合同数', value: custContracts.value.length },
    { label: '累计签约金额', value: custContracts.value.reduce((s, c) => s + c.amount, 0).toLocaleString('zh-CN') },
    { label: '累计回款金额', value: custPayments.value.filter(p => p.status === 'approved').reduce((s, p) => s + p.amount, 0).toLocaleString('zh-CN') },
    { label: '未回款金额', value: custContracts.value.reduce((s, c) => s + c.unpaidAmount, 0).toLocaleString('zh-CN') },
    { label: '跟进次数', value: custFollowups.value.length },
  ]
  return stats.map((s, i) => ({ ...s, gradient: gradients[i], icon: icons[i] }))
})

const contractCols = [
  { title: '合同编号', dataIndex: 'contractNo', width: 200 },
  { title: '项目名称', dataIndex: 'name', width: 180 },
  { title: '产品类型', dataIndex: 'productType', width: 100 },
  { title: '签约日期', dataIndex: 'signDate', width: 100 },
  { title: '到期日期', dataIndex: 'expireDate', width: 100 },
  { title: '合同金额', slotName: 'amount', width: 100 },
  { title: '累计回款', slotName: 'accumPayment', width: 100 },
  { title: '累计渠道费', slotName: 'accumChannelFee', width: 100 },
]

const paymentCols = [
  { title: '合同编号', slotName: 'contractNo', width: 180 },
  { title: '回款日期', dataIndex: 'actualDate', width: 100 },
  { title: '回款金额', slotName: 'amount', width: 100 },
  { title: '应付渠道费', slotName: 'channelFee', width: 100 },
  { title: '我方实收', slotName: 'ourActual', width: 100 },
  { title: '回款方式', dataIndex: 'method', width: 100 },
  { title: '状态', slotName: 'status', width: 80 },
]

const fwCols = [
  { title: '跟进日期', dataIndex: 'date', width: 100 },
  { title: '跟进方式', dataIndex: 'method', width: 80 },
  { title: '跟进内容', dataIndex: 'content' },
  { title: '跟进人', slotName: 'ownerId', width: 80 },
]

</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 16px;
}
</style>
