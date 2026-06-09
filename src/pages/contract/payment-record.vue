<template>
  <div>
    <div class="page-header">
      <h2>回款录入</h2>
      <a-space>
        <a-button type="primary" @click="openAdd"><icon-plus /> 新增回款</a-button>
        <a-button @click="batchSubmit" :disabled="selectedRowKeys.length===0">提交审核</a-button>
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
        <a-form-item label="回款状态">
          <a-select v-model="filter.status" allow-clear style="width:120px" placeholder="全部">
            <a-option value="pending">待审批</a-option>
            <a-option value="approved">已通过</a-option>
            <a-option value="rejected">已驳回</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="实际回款日期">
          <a-range-picker v-model="filter.dateRange" style="width:240px" />
        </a-form-item>
        <a-form-item label="回款方式">
          <a-select v-model="filter.method" allow-clear style="width:120px" placeholder="全部">
            <a-option value="银行转账">银行转账</a-option>
            <a-option value="微信支付">微信支付</a-option>
            <a-option value="支付宝">支付宝</a-option>
            <a-option value="现金">现金</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="搜索">
          <a-input v-model="filter.keyword" placeholder="客户名称/项目名称/备注" style="width:220px" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchData">查询</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card>
      <a-table
        row-key="id"
        :row-selection="{ selectedRowKeys, onlyCurrent: false, type: 'checkbox' }"
        v-model:selected-keys="selectedRowKeys"
        :columns="columns"
        :data="filteredData"
        :pagination="{ pageSize: 15 }"
        size="small"
        :scroll="{ x: 1700 }"
      >
        <template #ownerName="{ record }">{{ getUserName(getContract(record.contractId)?.ownerId) }}</template>
        <template #customerName="{ record }">{{ getCustomerName(getContract(record.contractId)?.customerId) }}</template>
        <template #contractName="{ record }">{{ getContract(record.contractId)?.name }}</template>
        <template #contractNo="{ record }">{{ getContract(record.contractId)?.contractNo }}</template>
        <template #source="{ record }">{{ getContract(record.contractId)?.source }}</template>
        <template #productType="{ record }">{{ getContract(record.contractId)?.productType }}</template>
        <template #amount="{ record }">{{ fmtWan(record.amount) }}</template>
        <template #channelFee="{ record }">{{ fmtWan(record.channelFee) }}</template>
        <template #ourActual="{ record }">{{ fmtWan(record.ourActual) }}</template>
        <template #status="{ record }">
          <a-tag size="small" :color="record.status === 'pending' ? 'orange' : record.status === 'approved' ? 'green' : 'red'">
            {{ { pending: '待审批', approved: '已通过', rejected: '已驳回' }[record.status] }}
          </a-tag>
        </template>
        <template #actions="{ record }">
          <a-space size="small">
            <a-button type="text" size="mini" @click="openEdit(record)">编辑</a-button>
            <a-button type="text" size="mini" status="danger" @click="handleDelete(record)">删除</a-button>
            <a-button type="text" size="mini" @click="singleSubmit(record)">提交审核</a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="showModal" :title="modalTitle" @ok="saveRecord" width="600px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="项目名称">
              <a-select v-model="form.contractId" placeholder="请选择合同" :disabled="!!editId" @change="onContractChange">
                <a-option v-for="c in contracts" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.contractNo }})
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="回款计划（仅供参考，不关联）">
              <a-select v-model="form.planId" placeholder="请选择（可选，仅作参考）" allow-clear>
                <a-option v-for="p in availablePlans" :key="p.id" :value="p.id">
                  {{ p.phase }} - {{ fmtWan(p.amount) }} ({{ p.planDate }})
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="回款金额">
              <a-input-number v-model="form.amount" :min="0" style="width:100%" placeholder="元" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="渠道费">
              <a-input-number v-model="form.channelFee" :min="0" style="width:100%" placeholder="元" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="我方实收">
              <a-input-number :model-value="computedOurActual" disabled style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="回款方式">
              <a-select v-model="form.method" placeholder="请选择">
                <a-option value="银行转账">银行转账</a-option>
                <a-option value="微信支付">微信支付</a-option>
                <a-option value="支付宝">支付宝</a-option>
                <a-option value="现金">现金</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="实际回款日期">
              <a-date-picker v-model="form.actualDate" style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="备注">
              <a-textarea v-model="form.remark" :rows="2" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { paymentRecords, paymentPlans, contracts, customers, users, channelFeeRecords } from '../../mock/data'
import type { PaymentRecord, PaymentPlan } from '../../mock/data'

const route = useRoute()

// ============ 数据 ============
const allRecords = ref<PaymentRecord[]>([...paymentRecords])

// ============ 表格选择 ============
const selectedRowKeys = ref<number[]>([])

// ============ 工具函数 ============
const fmtWan = (v: number) => v === 0 ? '0万' : (v / 10000).toFixed(2) + '万'

function getContract(id: number | undefined) {
  if (!id && id !== 0) return undefined
  return contracts.find(c => c.id === id)
}
function getCustomer(id: number | undefined) {
  if (!id && id !== 0) return undefined
  return customers.find(c => c.id === id)
}
function getUserName(id: number | undefined) {
  if (!id && id !== 0) return '-'
  return users.find(u => u.id === id)?.name ?? '-'
}
function getCustomerName(id: number | undefined) {
  if (!id && id !== 0) return '-'
  return getCustomer(id)?.name ?? '-'
}

// ============ 来源/产品类型（从合同数据派生） ============
const allSources = computed(() => [...new Set(contracts.map(c => c.source))])
const allProductTypes = computed(() => [...new Set(contracts.map(c => c.productType))])

// ============ 获取当前合同可选的回款计划 ============
const availablePlans = computed(() => {
  if (!form.contractId) return []
  return paymentPlans.filter(p => p.contractId === form.contractId && p.status !== 'paid')
})

// ============ 筛选 ============
const filter = reactive({
  ownerIds: [] as number[],
  sources: [] as string[],
  productType: '' as string,
  status: '' as string,
  dateRange: [] as string[],
  method: '' as string,
  keyword: '',
})

const filteredData = computed(() => {
  return allRecords.value.filter(r => {
    const contract = getContract(r.contractId)
    const cust = contract ? getCustomer(contract.customerId) : undefined

    // 负责人
    if (filter.ownerIds.length && contract && !filter.ownerIds.includes(contract.ownerId)) return false

    // 客户来源
    if (filter.sources.length && contract && !filter.sources.includes(contract.source)) return false

    // 产品类型
    if (filter.productType && contract?.productType !== filter.productType) return false

    // 回款状态
    if (filter.status && r.status !== filter.status) return false

    // 实际回款日期段
    if (filter.dateRange.length === 2) {
      const [start, end] = filter.dateRange
      if (r.actualDate < start || r.actualDate > end) return false
    }

    // 回款方式
    if (filter.method && r.method !== filter.method) return false

    // 搜索：客户名称/项目名称/备注
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      const matchContract = contract?.name.toLowerCase().includes(kw)
      const matchCust = cust?.name.toLowerCase().includes(kw)
      const matchRemark = r.remark.toLowerCase().includes(kw)
      if (!matchContract && !matchCust && !matchRemark) return false
    }

    return true
  })
})

function fetchData() { /* 由 computed 驱动筛选 */ }

// ============ 新增/编辑弹窗 ============
const showModal = ref(false)
const editId = ref<number | null>(null)

const modalTitle = computed(() => (editId.value ? '编辑回款' : '新增回款'))

const emptyForm = () => ({
  contractId: undefined as number | undefined,
  planId: undefined as number | undefined,
  amount: 0,
  channelFee: 0,
  method: '银行转账' as string,
  actualDate: '',
  remark: '',
})

const form = reactive(emptyForm())

const computedOurActual = computed(() => {
  const a = Number(form.amount) || 0
  const c = Number(form.channelFee) || 0
  return a - c
})

function onContractChange() {
  form.planId = undefined
  form.amount = 0
  form.channelFee = 0
}

function resetForm() {
  editId.value = null
  Object.assign(form, emptyForm())
}

function openAdd() {
  resetForm()
  // 如果从合同列表跳转过来，预选合同
  const cid = route.query.contractId
  if (cid) {
    form.contractId = Number(cid)
  }
  showModal.value = true
}

function openEdit(record: PaymentRecord) {
  resetForm()
  editId.value = record.id
  form.contractId = record.contractId
  form.planId = record.planId
  form.amount = record.amount
  form.channelFee = record.channelFee
  form.method = record.method
  form.actualDate = record.actualDate
  form.remark = record.remark
  showModal.value = true
}

function saveRecord() {
  if (!form.contractId) return

  let savedRecord: PaymentRecord | null = null

  if (editId.value) {
    const idx = allRecords.value.findIndex(r => r.id === editId.value)
    if (idx !== -1) {
      allRecords.value[idx] = {
        ...allRecords.value[idx],
        contractId: form.contractId,
        planId: form.planId || 0,
        amount: form.amount,
        channelFee: form.channelFee,
        ourActual: computedOurActual.value,
        method: form.method,
        actualDate: form.actualDate || dayjs().format('YYYY-MM-DD'),
        remark: form.remark,
      }
      savedRecord = allRecords.value[idx]
    }
  } else {
    const newRecord: PaymentRecord = {
      id: Math.max(0, ...allRecords.value.map(r => r.id)) + 1,
      contractId: form.contractId!,
      planId: form.planId || 0,
      amount: form.amount,
      channelFee: form.channelFee,
      ourActual: computedOurActual.value,
      method: form.method,
      actualDate: form.actualDate || dayjs().format('YYYY-MM-DD'),
      remark: form.remark,
      status: 'pending',
      submitterId: 3,
    }
    allRecords.value.push(newRecord)
    // 同步到原始数组
    paymentRecords.push(newRecord)
    savedRecord = newRecord
  }

  // 如果有渠道费，自动生成渠道费支出明细记录
  if (savedRecord && savedRecord.channelFee > 0) {
    channelFeeRecords.push({
      id: Math.max(0, ...channelFeeRecords.map(cf => cf.id)) + 1,
      paymentRecordId: savedRecord.id,
      amount: savedRecord.channelFee,
      payDate: savedRecord.actualDate || dayjs().format('YYYY-MM-DD'),
      status: '自动生成',
      remark: `回款${savedRecord.id}自动生成`
    })
  }

  showModal.value = false
  resetForm()
}

// ============ 删除 ============
function handleDelete(record: PaymentRecord) {
  allRecords.value = allRecords.value.filter(r => r.id !== record.id)
}

// ============ 提交审核 ============
function singleSubmit(record: PaymentRecord) {
  const idx = allRecords.value.findIndex(r => r.id === record.id)
  if (idx !== -1) {
    allRecords.value[idx] = { ...allRecords.value[idx], status: 'pending' }
  }
}

function batchSubmit() {
  for (const id of selectedRowKeys.value) {
    const idx = allRecords.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      allRecords.value[idx] = { ...allRecords.value[idx], status: 'pending' }
    }
  }
  selectedRowKeys.value = []
}

// ============ 导出 ============
function handleExport() {
  alert('导出（演示版）')
}

// ============ 表格列定义 ============
const columns = [
  { title: '负责人', slotName: 'ownerName', width: 80 },
  { title: '客户名称', slotName: 'customerName', width: 130 },
  { title: '项目名称', slotName: 'contractName', width: 180, ellipsis: { showTooltip: true } },
  { title: '合同编号', slotName: 'contractNo', width: 200 },
  { title: '客户来源', slotName: 'source', width: 110 },
  { title: '产品类型', slotName: 'productType', width: 100 },
  { title: '回款金额', slotName: 'amount', width: 100 },
  { title: '渠道费', slotName: 'channelFee', width: 100 },
  { title: '我方实收', slotName: 'ourActual', width: 100 },
  { title: '回款方式', dataIndex: 'method', width: 100 },
  { title: '回款状态', slotName: 'status', width: 90 },
  { title: '实际回款日期', dataIndex: 'actualDate', width: 120 },
  { title: '备注', dataIndex: 'remark', width: 150, ellipsis: { showTooltip: true } },
  { title: '操作', slotName: 'actions', width: 200, fixed: 'right' as const },
]
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
