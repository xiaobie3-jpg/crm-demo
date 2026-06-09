<template>
  <div>
    <div class="page-header"><h2>合同列表</h2><a-space><a-button type="primary" @click="showAdd=true"><icon-plus /> 新增合同</a-button><a-button @click="handleExport">导出</a-button></a-space></div>

    <!-- 统计卡片 -->
    <div class="stat-cards" style="grid-template-columns:repeat(auto-fit, minmax(160px, 1fr))">
      <a-card class="stat-card" v-for="(s, idx) in contractStats" :key="s.label" :style="{ background: contractGradients[idx] }">
        <div class="icon-bg"><component :is="contractIcons[idx]" /></div>
        <div class="label">{{ s.label }}</div>
        <div class="value" style="font-size:22px">{{ s.value }}</div>
      </a-card>
    </div>

    <a-card size="small" style="margin-bottom:16px">
      <a-form layout="inline" size="small">
        <a-form-item label="负责人">
          <a-select v-model="filter.ownerIds" multiple allow-clear style="width:160px" placeholder="全部">
            <a-option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="合同金额">
          <a-input-number v-model="filter.amountMin" :min="0" placeholder="最小" style="width:90px" />
          <span style="margin:0 4px">-</span>
          <a-input-number v-model="filter.amountMax" :min="0" placeholder="最大" style="width:90px" />
        </a-form-item>
        <a-form-item label="客户来源">
          <a-select v-model="filter.source" multiple allow-clear style="width:160px">
            <a-option v-for="s in sources" :key="s" :value="s">{{ s }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="产品类型">
          <a-select v-model="filter.productType" allow-clear style="width:120px">
            <a-option v-for="p in productTypes" :key="p" :value="p">{{ p }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="渠道费">
          <a-select v-model="filter.hasChannel" allow-clear style="width:90px">
            <a-option :value="true">有</a-option>
            <a-option :value="false">无</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="合同开始日期">
          <a-range-picker v-model="filter.signDateRange" style="width:220px" />
        </a-form-item>
        <a-form-item label="回款状态">
          <a-select v-model="filter.paymentStatus" allow-clear style="width:120px">
            <a-option value="unpaid">未回款</a-option>
            <a-option value="partial">部分回款</a-option>
            <a-option value="paid">已回款</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="搜索">
          <a-input v-model="filter.keyword" placeholder="项目名/客户名/备注" style="width:200px" allow-clear />
        </a-form-item>
        <a-form-item><a-button type="primary" @click="fetchData">查询</a-button></a-form-item>
      </a-form>
    </a-card>

    <!-- 颜色标记说明 -->
    <a-alert style="margin-bottom:12px" type="info">
      合同编号规则：H{年月日}-{合同号}-{项目号}-{期号}，例：H260608-1599-01-02。
      <span style="margin-left:16px">颜色说明：</span>
      <span style="background:#e8f4ff;padding:2px 8px;border-radius:4px;margin:0 4px">蓝色客户名</span>= 该客户第一个项目
      <span style="background:#e8ffe8;padding:2px 8px;border-radius:4px;margin:0 4px">绿色项目名</span>= 该项目第一期
      <span style="background:#ffe8e8;padding:2px 8px;border-radius:4px;margin:0 4px">红色</span>= 逾期未回款
    </a-alert>

    <a-card>
      <a-table :columns="columns" :data="filteredData" :pagination="{ pageSize: 15 }" size="small" :scroll="{ x: 1900 }"
        @row-click="goDetail" row-class="cursor-pointer">
        <template #ownerName="{ record }">{{ users.find(u => u.id === record.ownerId)?.name || '-' }}</template>
        <template #customerName="{ record }">
          <span :style="getCustomerNameStyle(record)">{{ getCust(record.customerId)?.name }}</span>
        </template>
        <template #contractName="{ record }">
          <span :style="getContractNameStyle(record)">{{ record.name }}</span>
        </template>
        <template #amount="{ record }">{{ fmt(record.amount) }}</template>
        <template #channelFee="{ record }">{{ fmt(record.channelFee) }}</template>
        <template #ourReceivable="{ record }">{{ fmt(record.ourReceivable) }}</template>
        <template #accumPayment="{ record }">{{ fmt(record.accumPayment) }}</template>
        <template #accumChannelFee="{ record }">{{ fmt(record.accumChannelFee) }}</template>
        <template #accumOurActual="{ record }">{{ fmt(record.accumOurActual) }}</template>
        <template #unpaidAmount="{ record }">{{ fmt(record.unpaidAmount) }}</template>
        <template #maintenanceFee="{ record }">{{ fmt(record.maintenanceFee) }}</template>
        <template #status="{ record }">
          <a-tag size="small" :color="record.status==='executing'?'blue':record.status==='completed'?'green':'gray'">
            {{ {pending:'待执行',executing:'执行中',completed:'已完成',terminated:'已终止'}[record.status] }}
          </a-tag>
        </template>
        <template #actions="{ record }">
          <div style="display:flex;flex-direction:column;gap:4px">
            <a-button type="text" size="mini" @click.stop="goDetail(record)">详情</a-button>
            <a-space size="small">
              <a-button v-if="record.unpaidAmount > 0" type="text" size="mini" status="success" @click.stop="openPaymentModal(record)">新增回款</a-button>
              <a-button v-if="sysConfig.contractApproval !== false" type="text" size="mini" status="warning" @click.stop="submitApproval(record)">提交审核</a-button>
            </a-space>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- 新增合同弹窗 -->
    <a-modal v-model:visible="showAdd" title="新增合同" @ok="saveContract" @cancel="planItems = []" width="800px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="客户">
              <a-select v-model="form.customerId" style="width:100%">
                <a-option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12"><a-form-item label="项目名称"><a-input v-model="form.name" style="width:100%" /></a-form-item></a-col>
          <a-col :span="12">
            <a-form-item label="合同名称">
              <a-input :model-value="contractName" disabled style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="6"><a-form-item label="合同号"><a-input v-model="form.autoNo" placeholder="如：1599" style="width:100%" /></a-form-item></a-col>
          <a-col :span="6"><a-form-item label="项目编号"><a-input v-model="form.projectNo" placeholder="如：01" style="width:100%" /></a-form-item></a-col>
          <a-col :span="6"><a-form-item label="期号"><a-input v-model="form.phaseNo" placeholder="如：01" style="width:100%" /></a-form-item></a-col>
          <a-col :span="6">
            <a-form-item label="合同编号预览">
              <a-input :model-value="contractNoPreview" disabled style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="产品类型">
              <a-select v-model="form.productType" style="width:100%">
                <a-option v-for="p in productTypes" :key="p" :value="p">{{ p }}</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="客户来源">
              <a-select v-model="form.source" style="width:100%">
                <a-option v-for="s in sources" :key="s" :value="s">{{ s }}</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8"><a-form-item label="合同金额（元）"><a-input-number v-model="form.amount" :min="0" style="width:100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="渠道费（元）"><a-input-number v-model="form.channelFee" :min="0" style="width:100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="我方应收（元）"><a-input-number :model-value="ourReceivable" disabled style="width:100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="签约日期"><a-date-picker v-model="form.signDate" style="width:100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="到期日期"><a-date-picker v-model="form.expireDate" style="width:100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="年维护费（元）"><a-input-number v-model="form.maintenanceFee" :min="0" style="width:100%" /></a-form-item></a-col>
          <a-col :span="24"><a-form-item label="备注"><a-textarea v-model="form.remark" :rows="2" /></a-form-item></a-col>
        </a-row>
      </a-form>

      <!-- 回款计划 -->
      <a-divider>回款计划录入</a-divider>
      <div v-if="totalRatio !== 100 && planItems.length > 0" style="color:#f53f3f;margin-bottom:8px;font-size:13px">
        ⚠️ 当前总比例 {{ totalRatio }}%，必须等于 100%
      </div>
      <div v-for="(item, idx) in planItems" :key="idx" style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
        <a-input-number v-model="item.amount" :min="0" style="width:140px" placeholder="回款金额" @change="onPlanAmountChange(idx)" />
        <a-input-number v-model="item.ratio" :min="0" :max="100" disabled style="width:100px" placeholder="比例%">
          <template #suffix>%</template>
        </a-input-number>
        <a-date-picker v-model="item.date" style="width:160px" placeholder="计划日期" />
        <a-button type="text" size="mini" status="danger" @click="removePlanItem(idx)">删除</a-button>
      </div>
      <a-button type="dashed" long @click="addPlanItem" style="margin-bottom:8px">
        <template #icon>+</template> 新增一笔回款计划
      </a-button>
      <div v-if="planItems.length > 0" style="font-size:13px;color:#86909c">
        总比例：<strong :style="{ color: totalRatio === 100 ? '#00b42a' : '#f53f3f' }">{{ totalRatio }}%</strong>
        <span v-if="totalRatio === 100" style="color:#00b42a"> ✓</span>
      </div>
    </a-modal>

    <!-- 新增回款弹窗 -->
    <a-modal v-model:visible="showPayment" title="新增回款" @ok="savePayment" width="700px">
      <a-form :model="payForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="24"><a-form-item label="项目名称"><a-input :model-value="payContractName" disabled /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="回款金额（元）"><a-input-number v-model="payForm.amount" :min="0" style="width:100%" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="渠道费（元）"><a-input-number v-model="payForm.channelFee" :min="0" style="width:100%" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="回款方式"><a-select v-model="payForm.method"><a-option value="银行转账">银行转账</a-option><a-option value="微信支付">微信支付</a-option><a-option value="支付宝">支付宝</a-option></a-select></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="实际回款日期"><a-date-picker v-model="payForm.actualDate" style="width:100%" /></a-form-item></a-col>
          <a-col :span="24"><a-form-item label="备注"><a-textarea v-model="payForm.remark" :rows="2" /></a-form-item></a-col>
        </a-row>
      </a-form>
      <a-divider>本合同时回款计划（仅供参考）</a-divider>
      <a-table :columns="payPlanCols" :data="currentPlans" size="small" :pagination="false" style="margin-bottom:8px">
        <template #amount="{ record }">{{ fmt(record.amount) }}</template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { contracts, customers, users, paymentPlans, paymentRecords, channelFeeRecords, sysConfig } from '../../mock/data'
import { Message } from '@arco-design/web-vue'

const router = useRouter()
const allContracts = ref([...contracts])
const showAdd = ref(false)
const showPayment = ref(false)
const payContractId = ref(0)
const productTypes = ['定制首期', '定制迭代', '模板新开', '模板续费', '代办']
const sources = ['百度', '抖音', '小红书', '淘宝', 'GEO', '其他', '自拓']
const fmt = (v: number) => v === 0 ? '0' : v.toLocaleString('zh-CN')

const contractGradients = [
  'linear-gradient(135deg, #165dff 0%, #4080ff 100%)',
  'linear-gradient(135deg, #00b42a 0%, #4cd263 100%)',
  'linear-gradient(135deg, #f77234 0%, #ff9a5e 100%)',
  'linear-gradient(135deg, #722ed1 0%, #a855f7 100%)',
  'linear-gradient(135deg, #0fc6c2 0%, #5ce1e6 100%)',
  'linear-gradient(135deg, #f53f3f 0%, #ff7d7d 100%)',
]
const contractIcons = ['IconFile', 'IconMoney', 'IconSafe', 'IconCoin', 'IconCheckCircle', 'IconExclamationCircle'] as any[]

const contractStats = computed(() => {
  const data = filteredData.value
  return [
    { label: '合同总数', value: data.length },
    { label: '合同总额', value: fmt(data.reduce((s, c) => s + c.amount, 0)) },
    { label: '累计回款', value: fmt(data.reduce((s, c) => s + c.accumPayment, 0)) },
    { label: '未回款金额', value: fmt(data.reduce((s, c) => s + c.unpaidAmount, 0)) },
    { label: '执行中合同', value: data.filter(c => c.status === 'executing').length },
    { label: '逾期合同', value: data.filter(c => c.unpaidAmount > 0 && c.expireDate < dayjs().format('YYYY-MM-DD')).length },
  ]
})

const payForm = reactive({ amount: 0, channelFee: 0, method: '银行转账', actualDate: '', remark: '' })

const filter = reactive({
  ownerIds: [] as number[],
  amountMin: null as any,
  amountMax: null as any,
  source: [] as string[],
  productType: '',
  hasChannel: null as any,
  signDateRange: [] as any[],
  paymentStatus: '',
  keyword: ''
})

const form = reactive({
  customerId: 1, name: '', autoNo: '', projectNo: '', phaseNo: '',
  productType: '定制首期', source: '自拓', amount: 0, channelFee: 0, maintenanceFee: 0,
  signDate: '', expireDate: '', remark: ''
})

// 回款计划条目
interface PlanItem { amount: number; ratio: number; date: string }
const planItems = ref<PlanItem[]>([])

const contractName = computed(() => {
  const cust = customers.find(c => c.id === form.customerId)
  return cust ? `${cust.name}_${form.name || '(项目名称)'}` : form.name || ''
})

const ourReceivable = computed(() => {
  return (form.amount || 0) - (form.channelFee || 0)
})

const totalRatio = computed(() => {
  return planItems.value.reduce((s, p) => s + (p.ratio || 0), 0)
})

const contractNoPreview = computed(() => {
  const signDate = form.signDate || dayjs().format('YYYY-MM-DD')
  const date = dayjs(signDate).format('YYMMDD')
  const a = form.autoNo || '????'
  const p = form.projectNo || '??'
  const ph = form.phaseNo || '??'
  return `H${date}-${a}-${p}-${ph}`
})

function getCust(id: number) { return customers.find(c => c.id === id) }

// 颜色标记：客户名（该客户第一个项目）
function getCustomerNameStyle(record: any) {
  const custContracts = allContracts.value.filter(c => c.customerId === record.customerId)
  // 按签约时间排序，判断该合同的项目号是否是最早出现的
  const projectNos = custContracts.map(c => c.projectNo)
  const uniqueProjects = [...new Set(projectNos)]
  // 找到合同所在项目是否是该客户的第一个项目（最早签约的项目编号）
  const sortedByDate = [...custContracts].sort((a, b) => a.signDate.localeCompare(b.signDate))
  const firstProjectNo = sortedByDate[0]?.projectNo
  if (record.projectNo === firstProjectNo && sortedByDate.findIndex(c => c.id === record.id) === 0) {
    return 'background:#dbeafe;padding:2px 6px;border-radius:4px;font-weight:500'
  }
  return ''
}

// 颜色标记：合同名（该项目的第一期）
function getContractNameStyle(record: any) {
  const today = dayjs().format('YYYY-MM-DD')
  // 逾期未回款优先显示红色
  if (record.unpaidAmount > 0 && record.expireDate < today) {
    return 'color:#f53f3f;font-weight:500'
  }
  // 同项目下按签约时间最早的合同为第一期
  const projContracts = allContracts.value
    .filter(c => c.customerId === record.customerId && c.projectNo === record.projectNo)
    .sort((a, b) => a.signDate.localeCompare(b.signDate))
  if (projContracts[0]?.id === record.id) {
    return 'background:#dcfce7;padding:2px 6px;border-radius:4px;font-weight:500'
  }
  return ''
}

const columns = [
  { title: '负责人', slotName: 'ownerName', width: 70, fixed: 'left' },
  { title: '客户名称', slotName: 'customerName', width: 140, ellipsis: { showTooltip: true }, fixed: 'left' },
  { title: '项目名称', slotName: 'contractName', width: 180, ellipsis: { showTooltip: true }, fixed: 'left' },
  { title: '合同编号', dataIndex: 'contractNo', width: 200 },
  { title: '客户来源', dataIndex: 'source', width: 110 },
  { title: '产品类型', dataIndex: 'productType', width: 100 },
  { title: '合同额', slotName: 'amount', width: 90, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '渠道费', slotName: 'channelFee', width: 80, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '我方应收', slotName: 'ourReceivable', width: 90, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '累计回款', slotName: 'accumPayment', width: 90, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '累计渠道费', slotName: 'accumChannelFee', width: 90, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '累计实收', slotName: 'accumOurActual', width: 90, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '未回款', slotName: 'unpaidAmount', width: 90, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '签约时间', dataIndex: 'signDate', width: 100, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '到期时间', dataIndex: 'expireDate', width: 100, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '维护费', slotName: 'maintenanceFee', width: 80 },
  { title: '状态', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'actions', width: 130, fixed: 'right' },
]

const filteredData = computed(() => {
  return allContracts.value.filter(c => {
    if (filter.ownerIds.length && !filter.ownerIds.includes(c.ownerId)) return false
    if (filter.amountMin && c.amount < filter.amountMin) return false
    if (filter.amountMax && c.amount > filter.amountMax) return false
    if (filter.source.length && !filter.source.includes(c.source)) return false
    if (filter.productType && c.productType !== filter.productType) return false
    if (filter.hasChannel === true && c.channelFee <= 0) return false
    if (filter.hasChannel === false && c.channelFee > 0) return false
    // 合同开始日期段筛选
    if (filter.signDateRange && filter.signDateRange.length === 2) {
      const [start, end] = filter.signDateRange
      if (c.signDate < start || c.signDate > end) return false
    }
    if (filter.paymentStatus === 'unpaid' && c.unpaidAmount !== c.amount) return false
    if (filter.paymentStatus === 'partial' && (c.unpaidAmount === 0 || c.unpaidAmount === c.amount)) return false
    if (filter.paymentStatus === 'paid' && c.unpaidAmount !== 0) return false
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      const cust = getCust(c.customerId)
      if (!c.name.toLowerCase().includes(kw) && !c.remark.toLowerCase().includes(kw) && !cust?.name.toLowerCase().includes(kw)) return false
    }
    return true
  })
})

function goDetail(r: any) { router.push(`/contract/detail/${r.id}`) }
function fetchData() { /* reactive */ }

// --- 新增回款 ---
const payContractName = computed(() => {
  const ct = allContracts.value.find(c => c.id === payContractId.value)
  if (!ct) return ''
  const cust = getCust(ct.customerId)
  return cust ? `${ct.name} (${cust.name})` : ct.name
})

const currentPlans = computed(() => {
  return paymentPlans.filter(p => p.contractId === payContractId.value)
})

const payPlanCols = [
  { title: '期数', dataIndex: 'phase', width: 80 },
  { title: '计划金额', slotName: 'amount', width: 100 },
  { title: '计划日期', dataIndex: 'planDate', width: 110 },
]

function openPaymentModal(record: any) {
  payContractId.value = record.id
  payForm.amount = 0
  payForm.channelFee = 0
  payForm.method = '银行转账'
  payForm.actualDate = dayjs().format('YYYY-MM-DD')
  payForm.remark = ''
  showPayment.value = true
}

function savePayment() {
  const newId = Math.max(0, ...paymentRecords.map(r => r.id)) + 1
  const newRecord: any = {
    id: newId, contractId: payContractId.value, planId: 0,
    amount: payForm.amount, channelFee: payForm.channelFee,
    ourActual: payForm.amount - payForm.channelFee,
    method: payForm.method, actualDate: payForm.actualDate || dayjs().format('YYYY-MM-DD'),
    remark: payForm.remark, status: 'approved', submitterId: 3,
  }
  paymentRecords.push(newRecord)

  // 更新合同累计数据
  const ct = allContracts.value.find(c => c.id === payContractId.value)
  if (ct) {
    ct.accumPayment += payForm.amount
    ct.accumChannelFee += payForm.channelFee
    ct.accumOurActual += (payForm.amount - payForm.channelFee)
    ct.unpaidAmount = Math.max(0, ct.unpaidAmount - payForm.amount)
  }

  // 自动生成渠道费支出明细
  if (payForm.channelFee > 0) {
    channelFeeRecords.push({
      id: Math.max(0, ...channelFeeRecords.map(cf => cf.id)) + 1,
      paymentRecordId: newId,
      amount: payForm.channelFee,
      payDate: payForm.actualDate || dayjs().format('YYYY-MM-DD'),
      status: '自动生成',
      remark: `回款${newId}自动生成`
    })
  }

  showPayment.value = false
  Message.success('回款录入成功')
}

function submitApproval(record: any) {
  Message.info(`合同【${record.name}】已提交审核（演示版）`)
}

function saveContract() {
  const signDate = form.signDate || dayjs().format('YYYY-MM-DD')
  const date = dayjs(signDate).format('YYMMDD')
  const contractNo = `H${date}-${form.autoNo}-${form.projectNo}-${form.phaseNo}`
  const newId = Math.max(0, ...allContracts.value.map(c => c.id)) + 1
  const newContract: any = {
    id: newId, ownerId: 1, ...form,
    contractNo, ourReceivable: ourReceivable.value,
    accumPayment: 0, accumChannelFee: 0, accumOurActual: 0, unpaidAmount: form.amount,
    signDate: form.signDate || dayjs().format('YYYY-MM-DD'),
    expireDate: form.expireDate || dayjs().add(12, 'month').format('YYYY-MM-DD'),
    status: 'executing' as const,
  }
  allContracts.value.push(newContract)
  // 同步到原始 contracts 数组，确保详情页能查到
  contracts.push(newContract)

  // 保存回款计划
  const actualAmount = form.amount || 0
  const ratioSum = totalRatio.value
  planItems.value.forEach((item, idx) => {
    const planAmount = ratioSum > 0 ? Math.round(actualAmount * item.ratio / 100) : 0
    const planChannelFee = ratioSum > 0 ? Math.round((form.channelFee || 0) * item.ratio / 100) : 0
    paymentPlans.push({
      id: Math.max(0, ...paymentPlans.map(p => p.id)) + 1,
      contractId: newId,
      phase: `第${idx + 1}期`,
      amount: planAmount,
      channelFee: planChannelFee,
      ourReceivable: planAmount - planChannelFee,
      planDate: item.date || dayjs().add((idx + 1) * 30, 'day').format('YYYY-MM-DD'),
      remark: `比例${item.ratio}%`,
      status: 'pending' as const,
    })
  })

  // 签约自动将客户等级转为"签约客户"
  const cust = customers.find(c => c.id === form.customerId)
  if (cust && cust.level !== '签约客户') {
    cust.level = '签约客户'
    Message.success(`客户【${cust.name}】等级已自动升级为「签约客户」`)
  }
  showAdd.value = false
  planItems.value = []
}
function handleExport() { alert('导出（演示版）') }

// 回款计划条目操作
function addPlanItem() {
  planItems.value.push({ amount: 0, ratio: 0, date: '' })
}
function removePlanItem(idx: number) {
  planItems.value.splice(idx, 1)
}
function onPlanAmountChange(idx: number) {
  const item = planItems.value[idx]
  if (!item || !form.amount) return
  item.ratio = form.amount > 0 ? Math.round((item.amount / form.amount) * 100 * 100) / 100 : 0
}
</script>
