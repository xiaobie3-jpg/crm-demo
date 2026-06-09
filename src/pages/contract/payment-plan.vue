<template>
  <div>
    <div class="page-header">
      <h2>回款计划</h2>
      <a-space>
        <a-button type="primary" @click="openAdd"><icon-plus /> 新增回款计划</a-button>
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
            <a-option value="pending">待回款</a-option>
            <a-option value="paid">已回款</a-option>
            <a-option value="overdue">逾期</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="计划回款日期">
          <a-range-picker v-model="filter.dateRange" style="width:240px" />
        </a-form-item>
        <a-form-item label="逾期">
          <a-select v-model="filter.isOverdue" allow-clear style="width:100px" placeholder="全部">
            <a-option :value="true">是</a-option>
            <a-option :value="false">否</a-option>
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
        :columns="columns"
        :data="filteredData"
        :pagination="{ pageSize: 15 }"
        size="small"
        :scroll="{ x: 1800 }"
      >
        <template #ownerName="{ record }">{{ getUserName(getContract(record.contractId)?.ownerId) }}</template>
        <template #customerName="{ record }">{{ getCustomerName(getContract(record.contractId)?.customerId) }}</template>
        <template #contractName="{ record }">{{ getContract(record.contractId)?.name }}</template>
        <template #contractNo="{ record }">{{ getContract(record.contractId)?.contractNo }}</template>
        <template #source="{ record }">{{ getContract(record.contractId)?.source }}</template>
        <template #productType="{ record }">{{ getContract(record.contractId)?.productType }}</template>
        <template #status="{ record }">
          <a-tag size="small" :color="effectiveStatus(record) === 'pending' ? 'orange' : effectiveStatus(record) === 'paid' ? 'green' : 'red'">
            {{ { pending: '待回款', paid: '已回款', overdue: '逾期' }[effectiveStatus(record)] }}
          </a-tag>
        </template>
        <template #isOverdue="{ record }">
          <a-tag size="small" :color="isPlanOverdue(record) ? 'red' : 'green'">
            {{ isPlanOverdue(record) ? '是' : '否' }}
          </a-tag>
        </template>
        <template #amount="{ record }">{{ fmtWan(record.amount) }}</template>
        <template #channelFee="{ record }">{{ fmtWan(record.channelFee) }}</template>
        <template #ourReceivable="{ record }">{{ fmtWan(record.ourReceivable) }}</template>
        <template #actions="{ record }">
          <a-space size="small">
            <a-button type="text" size="mini" @click="openEdit(record)">编辑</a-button>
            <a-button type="text" size="mini" status="danger" @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="showModal" :title="modalTitle" @ok="savePlan" @cancel="resetForm" width="600px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="合同">
              <a-select v-model="form.contractId" placeholder="请选择合同" :disabled="!!editId">
                <a-option v-for="c in contracts" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.contractNo }})
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="阶段">
              <a-input v-model="form.phase" placeholder="如：首付款、中期款、尾款" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="计划回款日期">
              <a-date-picker v-model="form.planDate" style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="金额">
              <a-input-number v-model="form.amount" :min="0" style="width:100%" placeholder="元" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="渠道费">
              <a-input-number v-model="form.channelFee" :min="0" style="width:100%" placeholder="元" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="我方应收">
              <a-input-number :model-value="computedOurReceivable" disabled style="width:100%" />
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
import { ref, reactive, computed } from 'vue'
import dayjs from 'dayjs'
import { paymentPlans, contracts, customers, users } from '../../mock/data'
import type { PaymentPlan } from '../../mock/data'

// ============ 数据 ============
const allPlans = ref<PaymentPlan[]>([...paymentPlans])

// ============ 工具函数 ============
const fmtWan = (v: number) => v === 0 ? '0万' : (v / 10000).toFixed(2) + '万'
const today = dayjs().format('YYYY-MM-DD')

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

/**
 * 计算有效回款状态：
 * - status 为 'paid'/'overdue' 时直接返回
 * - status 为 'pending' 但 planDate 已过 -> 视为 overdue
 */
function effectiveStatus(plan: PaymentPlan): 'pending' | 'paid' | 'overdue' {
  if (plan.status === 'paid' || plan.status === 'overdue') return plan.status
  if (plan.planDate < today) return 'overdue'
  return 'pending'
}

/** 判断是否逾期（用于「逾期」列和筛选） */
function isPlanOverdue(plan: PaymentPlan): boolean {
  return effectiveStatus(plan) === 'overdue'
}

// ============ 来源/产品类型（从合同数据派生） ============
const allSources = computed(() => [...new Set(contracts.map(c => c.source))])
const allProductTypes = computed(() => [...new Set(contracts.map(c => c.productType))])

// ============ 筛选 ============
const filter = reactive({
  ownerIds: [] as number[],
  sources: [] as string[],
  productType: '' as string,
  status: '' as string,
  dateRange: [] as string[],
  isOverdue: null as boolean | null,
  keyword: '',
})

const filteredData = computed(() => {
  return allPlans.value.filter(p => {
    const contract = getContract(p.contractId)
    const cust = contract ? getCustomer(contract.customerId) : undefined

    // 负责人
    if (filter.ownerIds.length && contract && !filter.ownerIds.includes(contract.ownerId)) return false

    // 客户来源
    if (filter.sources.length && contract && !filter.sources.includes(contract.source)) return false

    // 产品类型
    if (filter.productType && contract?.productType !== filter.productType) return false

    // 回款状态
    if (filter.status && effectiveStatus(p) !== filter.status) return false

    // 计划回款日期段
    if (filter.dateRange.length === 2) {
      const [start, end] = filter.dateRange
      if (p.planDate < start || p.planDate > end) return false
    }

    // 逾期筛选
    if (filter.isOverdue !== null && isPlanOverdue(p) !== filter.isOverdue) return false

    // 搜索：客户名称/项目名称/备注
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      const matchContract = contract?.name.toLowerCase().includes(kw)
      const matchCust = cust?.name.toLowerCase().includes(kw)
      const matchRemark = p.remark.toLowerCase().includes(kw)
      if (!matchContract && !matchCust && !matchRemark) return false
    }

    return true
  })
})

function fetchData() { /* 由 computed 驱动筛选，无需额外操作 */ }

// ============ 新增/编辑弹窗 ============
const showModal = ref(false)
const editId = ref<number | null>(null)

const modalTitle = computed(() => (editId.value ? '编辑回款计划' : '新增回款计划'))

const emptyForm = () => ({
  contractId: undefined as number | undefined,
  phase: '',
  amount: 0,
  channelFee: 0,
  planDate: '',
  remark: '',
})

const form = reactive(emptyForm())

const computedOurReceivable = computed(() => {
  const a = Number(form.amount) || 0
  const c = Number(form.channelFee) || 0
  return a - c
})

function resetForm() {
  editId.value = null
  Object.assign(form, emptyForm())
}

function openAdd() {
  resetForm()
  showModal.value = true
}

function openEdit(record: PaymentPlan) {
  resetForm()
  editId.value = record.id
  form.contractId = record.contractId
  form.phase = record.phase
  form.amount = record.amount
  form.channelFee = record.channelFee
  form.planDate = record.planDate
  form.remark = record.remark
  showModal.value = true
}

function savePlan() {
  if (!form.contractId) {
    return
  }
  const ourReceivable = computedOurReceivable.value

  if (editId.value) {
    // 编辑
    const idx = allPlans.value.findIndex(p => p.id === editId.value)
    if (idx !== -1) {
      allPlans.value[idx] = {
        ...allPlans.value[idx],
        contractId: form.contractId,
        phase: form.phase,
        amount: form.amount,
        channelFee: form.channelFee,
        ourReceivable,
        planDate: form.planDate || dayjs().format('YYYY-MM-DD'),
        remark: form.remark,
      }
    }
  } else {
    // 新增
    const newPlan: PaymentPlan = {
      id: Math.max(0, ...allPlans.value.map(p => p.id)) + 1,
      contractId: form.contractId!,
      phase: form.phase,
      amount: form.amount,
      channelFee: form.channelFee,
      ourReceivable,
      planDate: form.planDate || dayjs().format('YYYY-MM-DD'),
      remark: form.remark,
      status: 'pending',
    }
    allPlans.value.push(newPlan)
  }

  showModal.value = false
  resetForm()
}

// ============ 删除 ============
function handleDelete(record: PaymentPlan) {
  allPlans.value = allPlans.value.filter(p => p.id !== record.id)
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
  { title: '阶段', dataIndex: 'phase', width: 90 },
  { title: '回款状态', slotName: 'status', width: 90 },
  { title: '逾期', slotName: 'isOverdue', width: 70 },
  { title: '金额', slotName: 'amount', width: 100 },
  { title: '渠道费', slotName: 'channelFee', width: 100 },
  { title: '我方应收', slotName: 'ourReceivable', width: 100 },
  { title: '计划回款日期', dataIndex: 'planDate', width: 120 },
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
