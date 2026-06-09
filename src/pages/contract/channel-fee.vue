<template>
  <div>
    <div class="page-header">
      <h2>渠道费支出明细</h2>
      <a-space>
        <a-tag color="arcoblue" size="medium">自动同步</a-tag>
        <span style="color:#86909c;font-size:13px">回款录入时系统自动生成支出记录</span>
        <a-button @click="handleExport">导出</a-button>
      </a-space>
    </div>
    <a-card size="small" style="margin-bottom:16px">
      <a-form layout="inline" size="small">
        <a-form-item label="负责人">
          <a-select v-model="filter.ownerIds" multiple allow-clear style="width:160px" placeholder="全部">
            <a-option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="支出日期">
          <a-range-picker v-model="filter.dateRange" size="small" />
        </a-form-item>
        <a-form-item label="客户来源">
          <a-select v-model="filter.sources" multiple allow-clear style="width:160px" placeholder="全部">
            <a-option v-for="s in allSources" :key="s" :value="s">{{ s }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="产品类型">
          <a-select v-model="filter.productType" allow-clear style="width:120px" placeholder="全部">
            <a-option v-for="p in allProductTypes" :key="p" :value="p">{{ p }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="搜索">
          <a-input v-model="filter.keyword" placeholder="合同编号/客户名称/备注" style="width:220px" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchData">查询</a-button>
        </a-form-item>
      </a-form>
    </a-card>
    <a-card>
      <a-table :columns="columns" :data="filteredData" size="small" :pagination="{ pageSize: 15 }" :scroll="{ x: 1400 }">
        <template #paymentRecordId="{ record }">PR{{ String(record.paymentRecordId).padStart(4, '0') }}</template>
        <template #contractNo="{ record }">{{ getContractNo(record) }}</template>
        <template #customerName="{ record }">{{ getCustName(record) }}</template>
        <template #ownerName="{ record }">{{ getOwnerName(record) }}</template>
        <template #amount="{ record }">{{ fmtWan(record.amount) }}</template>
        <template #status="{ record }">
          <a-tag :color="record.status==='已支付'?'green':record.status==='自动生成'?'arcoblue':'gray'" size="small">{{ record.status }}</a-tag>
        </template>
        <template #actions="{ record }">
          <a-button type="text" size="mini" @click="markDone(record)">标记已支付</a-button>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import dayjs from 'dayjs'
import { channelFeeRecords, paymentRecords, contracts, customers, users } from '../../mock/data'

const allRecords = ref([...channelFeeRecords])
const fmtWan = (v: number) => v === 0 ? '0万' : (v / 10000).toFixed(2) + '万'

const filter = reactive({
  ownerIds: [] as number[],
  dateRange: [] as any[],
  sources: [] as string[],
  productType: '' as string,
  keyword: ''
})

const allSources = computed(() => [...new Set(contracts.map(c => c.source))])
const allProductTypes = computed(() => [...new Set(contracts.map(c => c.productType))])

function getContractNo(record: any) {
  const pr = paymentRecords.find(p => p.id === record.paymentRecordId)
  if (!pr) return '-'
  return contracts.find(c => c.id === pr.contractId)?.contractNo || '-'
}
function getCustName(record: any) {
  const pr = paymentRecords.find(p => p.id === record.paymentRecordId)
  if (!pr) return '-'
  const ct = contracts.find(c => c.id === pr.contractId)
  if (!ct) return '-'
  return customers.find(cu => cu.id === ct.customerId)?.name || '-'
}
function getOwnerName(record: any) {
  const pr = paymentRecords.find(p => p.id === record.paymentRecordId)
  if (!pr) return '-'
  const ct = contracts.find(c => c.id === pr.contractId)
  if (!ct) return '-'
  return users.find(u => u.id === ct.ownerId)?.name || '-'
}

const columns = [
  { title: '序列号', dataIndex: 'id', width: 80, render: ({ record }: any) => 'CF' + String(record.id).padStart(4, '0') },
  { title: '关联回款', slotName: 'paymentRecordId', width: 100 },
  { title: '负责人', slotName: 'ownerName', width: 80 },
  { title: '合同编号', slotName: 'contractNo', width: 200 },
  { title: '客户名称', slotName: 'customerName', width: 130 },
  { title: '支出金额', slotName: 'amount', width: 100 },
  { title: '支出日期', dataIndex: 'payDate', width: 110 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '备注', dataIndex: 'remark', ellipsis: { showTooltip: true } },
  { title: '操作', slotName: 'actions', width: 100, fixed: 'right' },
]

const filteredData = computed(() => {
  return allRecords.value.filter(r => {
    // 负责人筛选
    if (filter.ownerIds.length) {
      const pr = paymentRecords.find(p => p.id === r.paymentRecordId)
      if (!pr) return false
      const ct = contracts.find(c => c.id === pr.contractId)
      if (!ct || !filter.ownerIds.includes(ct.ownerId)) return false
    }
    // 客户来源筛选
    if (filter.sources.length) {
      const pr = paymentRecords.find(p => p.id === r.paymentRecordId)
      if (!pr) return false
      const ct = contracts.find(c => c.id === pr.contractId)
      if (!ct || !filter.sources.includes(ct.source)) return false
    }
    // 产品类型筛选
    if (filter.productType) {
      const pr = paymentRecords.find(p => p.id === r.paymentRecordId)
      if (!pr) return false
      const ct = contracts.find(c => c.id === pr.contractId)
      if (!ct || ct.productType !== filter.productType) return false
    }
    // 支出日期段
    if (filter.dateRange && filter.dateRange.length === 2) {
      const [start, end] = filter.dateRange
      if (r.payDate < start || r.payDate > end) return false
    }
    // 搜索
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      const cn = getContractNo(r).toLowerCase()
      const cust = getCustName(r).toLowerCase()
      if (!String(r.id).includes(kw) && !cn.includes(kw) && !cust.includes(kw) && !r.remark.toLowerCase().includes(kw)) return false
    }
    return true
  })
})

function markDone(r: any) { r.status = '已支付' }
function handleExport() { alert('导出（演示版）') }
function fetchData() { /* reactive */ }
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
}
</style>
