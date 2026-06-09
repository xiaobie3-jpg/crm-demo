<template>
  <div>
    <div class="page-header"><h2>待办任务</h2></div>
    <a-tabs default-active-key="1">
      <!-- 本月计划收款 -->
      <a-tab-pane key="1" :title="`本月计划收款 (${monthPlans.length})`">
        <a-table :columns="col4" :data="monthPlans" size="small" :pagination="{ pageSize: 10 }">
          <template #customer="{ record }">{{ getCust(record.contractId) }}</template>
          <template #contractNo="{ record }">{{ getCt(record.contractId)?.contractNo }}</template>
          <template #owner="{ record }">{{ users.find(u => u.id === getCt(record.contractId)?.ownerId)?.name }}</template>
          <template #amount="{ record }">{{ (record.amount / 10000).toFixed(2) }}w</template>
          <template #overdue="{ record }">
            <a-tag :color="record.status==='overdue'?'red':record.planDate===today?'orange':'green'" size="small">
              {{ record.status==='overdue'?'已逾期':record.planDate===today?'今日应收':'未到期' }}
            </a-tag>
          </template>
          <template #actions="{ record }">
            <a-button type="text" size="mini" @click="$router.push('/contract/payment-record')">新增回款</a-button>
          </template>
        </a-table>
      </a-tab-pane>

      <!-- 本月到期合同 -->
      <a-tab-pane key="2" :title="`本月到期合同 (${expiringContracts.length})`">
        <a-table :columns="col2" :data="expiringContracts" size="small" :pagination="{ pageSize: 10 }">
          <template #customer="{ record }">{{ getCust(record.id) }}</template>
          <template #owner="{ record }">{{ users.find(u => u.id === record.ownerId)?.name }}</template>
          <template #amount="{ record }">{{ (record.amount / 10000).toFixed(2) }}w</template>
          <template #unpaid="{ record }">{{ (record.unpaidAmount / 10000).toFixed(2) }}w</template>
          <template #actions="{ record }">
            <a-button type="text" size="mini" @click="$router.push(`/contract/detail/${record.id}`)">查看</a-button>
          </template>
        </a-table>
      </a-tab-pane>

      <!-- 超1月未联系 -->
      <a-tab-pane key="3" :title="`超1月未联系客户 (${inactiveCustomers.length})`">
        <a-table :columns="col3" :data="inactiveCustomers" size="small" :pagination="{ pageSize: 10 }">
          <template #owner="{ record }">{{ users.find(u => u.id === record.ownerId)?.name }}</template>
          <template #tags="{ record }"><a-tag v-for="t in record.tags" :key="t" size="small" color="arcoblue" style="margin:1px">{{ t }}</a-tag></template>
          <template #actions="{ record }">
            <a-space size="small">
              <a-button type="text" size="mini" @click="$router.push('/customer/followup')">新增跟进</a-button>
              <a-button type="text" size="mini" @click="$router.push(`/customer/detail/${record.id}`)">查看</a-button>
            </a-space>
          </template>
        </a-table>
      </a-tab-pane>

      <!-- 待审批回款 -->
      <a-tab-pane key="4" :title="`待审批回款 (${pendingPayments.length})`">
        <a-button type="primary" size="small" style="margin-bottom:12px" @click="batchApprove">批量审核通过</a-button>
        <a-table :columns="col1" :data="pendingPayments" size="small" :pagination="{ pageSize: 10 }" :row-selection="{ type: 'checkbox' }" v-model:selected-keys="selectedPaymentKeys">
          <template #id="{ record }">PR{{ String(record.id).padStart(4, '0') }}</template>
          <template #customer="{ record }">{{ getCust(record.contractId) }}</template>
          <template #contractNo="{ record }">{{ getCt(record.contractId)?.contractNo }}</template>
          <template #amount="{ record }">{{ (record.amount / 10000).toFixed(2) }}w</template>
          <template #submitter="{ record }">{{ users.find(u => u.id === record.submitterId)?.name }}</template>
          <template #actions="{ record }">
            <a-space size="small">
              <a-button type="primary" size="mini" @click="approveOne(record)">通过</a-button>
              <a-button type="text" size="mini" status="danger" @click="rejectOne(record)">驳回</a-button>
            </a-space>
          </template>
        </a-table>
      </a-tab-pane>

      <!-- 待审批合同 -->
      <a-tab-pane key="5" :title="`待审批合同 (${pendingContracts.length})`">
        <a-table :columns="col5" :data="pendingContracts" size="small" :pagination="{ pageSize: 10 }">
          <template #customer="{ record }">{{ getCust(record.id) }}</template>
          <template #owner="{ record }">{{ users.find(u => u.id === record.ownerId)?.name }}</template>
          <template #amount="{ record }">{{ (record.amount / 10000).toFixed(2) }}w</template>
          <template #actions="{ record }">
            <a-button type="text" size="mini" @click="$router.push(`/contract/detail/${record.id}`)">查看</a-button>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { paymentRecords, contracts, customers, users, paymentPlans, followups } from '../../mock/data'

const today = dayjs().format('YYYY-MM-DD')
const selectedPaymentKeys = ref<number[]>([])

function getCust(contractId: number) { const ct = contracts.find(c => c.id === contractId); if (!ct) return '-'; return customers.find(cu => cu.id === ct.customerId)?.name || '-' }
function getCt(id: number) { return contracts.find(c => c.id === id) }

const pendingPayments = computed(() => paymentRecords.filter(p => p.status === 'pending'))
const pendingContracts = computed(() => contracts.filter(c => c.status === 'pending'))
const expiringContracts = computed(() => contracts.filter(c => c.status === 'executing' && c.expireDate >= dayjs().startOf('month').format('YYYY-MM-DD') && c.expireDate <= dayjs().endOf('month').format('YYYY-MM-DD')))
const inactiveCustomers = computed(() => {
  const threshold = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
  return customers.filter(c => {
    const last = followups.filter(f => f.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    return c.status === 'normal' && last && last.date < threshold && contracts.some(ct => ct.customerId === c.id)
  })
})
const monthPlans = computed(() => paymentPlans.filter(p => {
  return p.planDate >= dayjs().startOf('month').format('YYYY-MM-DD') && p.planDate <= dayjs().endOf('month').format('YYYY-MM-DD') && p.status === 'pending'
}))

const col1 = [
  { title: '回款编号', slotName: 'id', width: 90 },
  { title: '客户名称', slotName: 'customer', width: 130 },
  { title: '合同编号', slotName: 'contractNo', width: 180 },
  { title: '回款金额', slotName: 'amount', width: 100 },
  { title: '提交人', slotName: 'submitter', width: 80 },
  { title: '提交时间', dataIndex: 'actualDate', width: 100 },
  { title: '操作', slotName: 'actions', width: 120 },
]
const col2 = [
  { title: '合同编号', dataIndex: 'contractNo', width: 180 },
  { title: '客户名称', slotName: 'customer', width: 130 },
  { title: '负责人', slotName: 'owner', width: 80 },
  { title: '到期日期', dataIndex: 'expireDate', width: 100 },
  { title: '合同金额', slotName: 'amount', width: 100 },
  { title: '未回款金额', slotName: 'unpaid', width: 100 },
  { title: '操作', slotName: 'actions', width: 80 },
]
const col3 = [
  { title: '客户名称', dataIndex: 'name', width: 140 },
  { title: '负责人', slotName: 'owner', width: 80 },
  { title: '客户来源', dataIndex: 'source', width: 110 },
  { title: '最后跟进日期', dataIndex: 'latestFollowupDate', width: 110 },
  { title: '最后跟进内容', dataIndex: 'latestFollowup', ellipsis: { showTooltip: true } },
  { title: '操作', slotName: 'actions', width: 150 },
]
const col4 = [
  { title: '合同编号', slotName: 'contractNo', width: 180 },
  { title: '客户名称', slotName: 'customer', width: 130 },
  { title: '负责人', slotName: 'owner', width: 80 },
  { title: '计划金额', slotName: 'amount', width: 100 },
  { title: '计划日期', dataIndex: 'planDate', width: 100 },
  { title: '逾期状态', slotName: 'overdue', width: 90 },
  { title: '操作', slotName: 'actions', width: 80 },
]

const col5 = [
  { title: '合同编号', dataIndex: 'contractNo', width: 180 },
  { title: '客户名称', slotName: 'customer', width: 130 },
  { title: '负责人', slotName: 'owner', width: 80 },
  { title: '合同金额', slotName: 'amount', width: 100 },
  { title: '签约日期', dataIndex: 'signDate', width: 100 },
  { title: '操作', slotName: 'actions', width: 80 },
]

function approveOne(r: any) { r.status = 'approved'; alert('已审核通过') }
function rejectOne(r: any) { r.status = 'rejected'; alert('已驳回') }
function batchApprove() {
  pendingPayments.value.filter(p => selectedPaymentKeys.value.includes(p.id)).forEach(p => p.status = 'approved')
  alert('已批量审核通过')
}
</script>
