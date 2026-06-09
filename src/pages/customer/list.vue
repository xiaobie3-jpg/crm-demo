<template>
  <div>
    <div class="page-header"><h2>客户列表</h2><a-space><a-button type="primary" @click="showAdd = true"><icon-plus /> 新增客户</a-button><a-button @click="handleExport">导出</a-button></a-space></div>

    <!-- 统计卡片 -->
    <div class="stat-cards" style="grid-template-columns:repeat(auto-fit, minmax(160px, 1fr))">
      <a-card class="stat-card" v-for="s in stats" :key="s.label">
        <div class="label">{{ s.label }}</div><div class="value" style="font-size:22px">{{ s.value }}</div>
      </a-card>
    </div>

    <!-- 筛选 -->
    <a-card style="margin-bottom:16px" size="small">
      <a-form :model="filter" layout="inline" size="small">
        <a-form-item label="负责人">
          <a-select v-model="filter.ownerIds" multiple allow-clear style="width:160px" placeholder="全部">
            <a-option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="客户等级">
          <a-select v-model="filter.levels" multiple allow-clear style="width:180px" placeholder="全部">
            <a-option v-for="l in levels" :key="l" :value="l">{{ l }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="客户来源">
          <a-select v-model="filter.sources" multiple allow-clear style="width:180px" placeholder="全部">
            <a-option v-for="s in availableSources" :key="s" :value="s">{{ s }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="分配日期">
          <a-range-picker v-model="filter.assignDateRange" size="small" style="width:220px" />
        </a-form-item>
        <a-form-item label="客户标签">
          <a-select v-model="filter.tag" allow-clear style="width:140px" placeholder="全部">
            <a-option v-for="t in availableTags" :key="t" :value="t">{{ t }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="产品类型">
          <a-select v-model="filter.productType" allow-clear style="width:120px" placeholder="全部">
            <a-option v-for="p in productTypes" :key="p" :value="p">{{ p }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="搜索">
          <a-input v-model="filter.keyword" placeholder="客户编号/名称/跟进内容" style="width:200px" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchData">查询</a-button>
          <a-button style="margin-left:8px" @click="resetFilter">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 批量操作栏 -->
    <div v-if="selectedKeys.length > 0" style="margin-bottom:12px;padding:8px 12px;background:#e8f4ff;border-radius:6px;display:flex;align-items:center;gap:12px">
      <span>已选 <strong>{{ selectedKeys.length }}</strong> 个客户</span>
      <a-button size="small" @click="batchTransferOwner">批量转移负责人</a-button>
      <a-button size="small" status="warning" @click="batchToSea">批量转移至公海</a-button>
      <a-button size="small" @click="selectedKeys = []">取消选择</a-button>
    </div>

    <!-- 列表 -->
    <a-card>
      <a-table :columns="columns" :data="filteredData" :pagination="{ pageSize: 15, showTotal: true, showPageSize: true }"
        size="small" :scroll="{ x: 1500 }" :row-selection="rowSelection" @row-click="goDetail" row-class="cursor-pointer">
        <template #ownerId="{ record }">{{ users.find(u => u.id === record.ownerId)?.name || '未分配' }}</template>
        <template #level="{ record }">
          <a-tag size="small" :color="record.level === '签约客户' ? 'green' : record.level === '靠谱客户' ? 'blue' : record.level === '意向客户' ? 'cyan' : 'gray'">{{ record.level }}</a-tag>
        </template>
        <template #tags="{ record }">
          <a-tag v-for="t in record.tags" :key="t" size="small" color="arcoblue" style="margin:1px">{{ t }}</a-tag>
        </template>
        <template #actions="{ record }">
          <a-space size="small">
            <a-button type="text" size="mini" @click.stop="goDetail(record)">详情</a-button>
            <a-button type="text" size="mini" status="warning" @click.stop="editCustomer(record)">编辑</a-button>
            <a-button type="text" size="mini" @click.stop="addFollowupFor(record)">新增跟进</a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:visible="showAdd" :title="editingId ? '编辑客户' : '新增客户'" @ok="saveCustomer" width="600px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12"><a-form-item label="客户名称"><a-input v-model="form.name" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="客户编号"><a-input v-model="form.code" placeholder="如：C011" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="联系人"><a-input v-model="form.contact" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="电话"><a-input v-model="form.phone" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="客户来源"><a-select v-model="form.source"><a-option v-for="s in availableSources" :key="s" :value="s">{{ s }}</a-option></a-select></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="客户等级"><a-select v-model="form.level"><a-option v-for="l in levels" :key="l" :value="l">{{ l }}</a-option></a-select></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="负责人"><a-select v-model="form.ownerId"><a-option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</a-option></a-select></a-form-item></a-col>
          <a-col :span="24"><a-form-item label="客户标签"><a-select v-model="form.tags" multiple allow-clear placeholder="选择标签"><a-option v-for="t in availableTags" :key="t" :value="t">{{ t }}</a-option></a-select></a-form-item></a-col>
          <a-col :span="24"><a-form-item label="备注"><a-textarea v-model="form.remark" :rows="2" /></a-form-item></a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 跟进弹窗 -->
    <a-modal v-model:visible="showFollowup" title="新增跟进" @ok="saveFollowup" width="500px">
      <a-form layout="vertical">
        <a-form-item label="客户"><a-input :model-value="followupCustName" disabled /></a-form-item>
        <a-form-item label="跟进方式"><a-select v-model="fwForm.method"><a-option value="电话">电话</a-option><a-option value="面谈">面谈</a-option><a-option value="微信">微信</a-option></a-select></a-form-item>
        <a-form-item label="跟进日期"><a-date-picker v-model="fwForm.date" style="width:100%" /></a-form-item>
        <a-form-item label="跟进内容"><a-textarea v-model="fwForm.content" :rows="3" placeholder="请输入跟进内容" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量转移负责人弹窗 -->
    <a-modal v-model:visible="showTransfer" title="批量转移负责人" @ok="confirmTransfer" width="400px">
      <a-form layout="vertical">
        <a-form-item label="新负责人"><a-select v-model="transferTargetId"><a-option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</a-option></a-select></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { customers, users, contracts, paymentRecords, channelFeeRecords, followups, sysConfig } from '../../mock/data'
import { Message } from '@arco-design/web-vue'

const router = useRouter()
const allCustomers = ref([...customers])
const showAdd = ref(false)
const editingId = ref(0)
const showFollowup = ref(false)
const followupCustId = ref(0)
const showTransfer = ref(false)
const transferTargetId = ref(1)

// 可配置的数据字典（从系统配置读取）
const availableSources = ['百度', '抖音', '小红书', '淘宝', 'GEO', '其他', '自拓']
const availableTags = ['H5', '小程序', 'APP', '物联网', 'AI', 'WEB', '客户端']
const levels = ['有效客户', '潜在客户', '意向客户', '靠谱客户', '签约客户']
const productTypes = ['定制首期', '定制迭代', '模板新开', '模板续费', '代办']

const selectedKeys = ref<number[]>([])

const rowSelection = computed(() => ({
  type: 'checkbox' as const,
  showCheckedAll: true,
  selectedRowKeys: selectedKeys.value,
  onChange: (keys: number[]) => { selectedKeys.value = keys },
}))

const filter = reactive({
  ownerIds: [] as number[],
  levels: [] as string[],
  sources: [] as string[],
  assignDateRange: [] as any[],
  tag: '',
  productType: '',
  keyword: ''
})

const form = reactive({ name: '', code: '', contact: '', phone: '', source: '自拓', level: '潜在客户', ownerId: 1, tags: [] as string[], remark: '' })
const fwForm = reactive({ method: '电话', date: '', content: '' })

const columns = [
  { title: '负责人', slotName: 'ownerId', width: 70 },
  { title: '客户编号', dataIndex: 'code', width: 80, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '客户等级', slotName: 'level', width: 90 },
  { title: '客户名称', dataIndex: 'name', width: 140 },
  { title: '电话', dataIndex: 'phone', width: 120 },
  { title: '分配日期', dataIndex: 'assignDate', width: 100, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '客户来源', dataIndex: 'source', width: 100 },
  { title: '最新往来', dataIndex: 'latestFollowup', width: 150, ellipsis: { showTooltip: true } },
  { title: '最近往来日期', dataIndex: 'latestFollowupDate', width: 110, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '客户标签', slotName: 'tags', width: 160 },
  { title: '备注', dataIndex: 'remark', width: 120, ellipsis: { showTooltip: true } },
  { title: '创建日期', dataIndex: 'createdAt', width: 100, sortable: { sortDirections: ['ascend', 'descend'] } },
  { title: '操作', slotName: 'actions', width: 170, fixed: 'right' },
]

const filteredData = computed(() => {
  return allCustomers.value.filter(c => {
    if (filter.ownerIds.length && !filter.ownerIds.includes(c.ownerId)) return false
    if (filter.levels.length && !filter.levels.includes(c.level)) return false
    if (filter.sources.length && !filter.sources.includes(c.source)) return false
    if (filter.assignDateRange && filter.assignDateRange.length === 2) {
      const [start, end] = filter.assignDateRange
      if (c.assignDate < start || c.assignDate > end) return false
    }
    if (filter.tag && !c.tags.includes(filter.tag)) return false
    if (filter.productType) {
      const hasProductType = contracts.some(ct => ct.customerId === c.id && ct.productType === filter.productType)
      if (!hasProductType) return false
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      if (!c.code.toLowerCase().includes(kw) && !c.name.toLowerCase().includes(kw) && !c.latestFollowup.toLowerCase().includes(kw)) return false
    }
    return true
  })
})

const followupCustName = computed(() => {
  const c = allCustomers.value.find(c => c.id === followupCustId.value)
  return c?.name || ''
})

const stats = computed(() => {
  const data = filteredData.value
  const ids = data.map(c => c.id)
  const relContracts = contracts.filter(ct => ids.includes(ct.customerId))
  const relPayments = paymentRecords.filter(p => relContracts.some(ct => ct.id === p.contractId) && p.status === 'approved')
  const relChannelFees = channelFeeRecords.filter(cf => relPayments.some(p => p.id === cf.paymentRecordId))
  return [
    { label: '累计客户数', value: data.length },
    { label: '累计签约客户', value: data.filter(c => contracts.some(ct => ct.customerId === c.id)).length },
    { label: '累计签约合同数', value: relContracts.length },
    { label: '累计签约金额', value: relContracts.reduce((s, ct) => s + ct.amount, 0).toLocaleString('zh-CN') },
    { label: '累计回款金额', value: relPayments.reduce((s, p) => s + p.amount, 0).toLocaleString('zh-CN') },
    { label: '累计支付渠道费', value: relChannelFees.reduce((s, cf) => s + cf.amount, 0).toLocaleString('zh-CN') },
  ]
})

function goDetail(record: any) { router.push(`/customer/detail/${record.id}`) }
function resetFilter() {
  filter.ownerIds = []; filter.levels = []; filter.sources = [];
  filter.assignDateRange = []; filter.tag = '';
  filter.productType = ''; filter.keyword = ''
}
function fetchData() { /* reactive */ }

function editCustomer(record: any) {
  editingId.value = record.id
  form.name = record.name; form.code = record.code; form.contact = record.contact; form.phone = record.phone
  form.source = record.source; form.level = record.level; form.ownerId = record.ownerId
  form.tags = [...record.tags]; form.remark = record.remark
  showAdd.value = true
}

function saveCustomer() {
  if (editingId.value) {
    const idx = allCustomers.value.findIndex(c => c.id === editingId.value)
    if (idx >= 0) Object.assign(allCustomers.value[idx], { ...form, tags: [...form.tags] })
  } else {
    const newCust: any = {
      id: allCustomers.value.length + 1, ...form, tags: [...form.tags],
      code: form.code || 'C' + String(allCustomers.value.length + 1).padStart(3, '0'),
      assignDate: dayjs().format('YYYY-MM-DD'), latestFollowup: '',
      latestFollowupDate: '', createdAt: dayjs().format('YYYY-MM-DD'), status: 'normal',
    }
    allCustomers.value.push(newCust)
  }
  showAdd.value = false
  editingId.value = 0
  form.name = ''; form.code = ''; form.contact = ''; form.phone = ''; form.tags = []; form.remark = ''
}

// 新增跟进
function addFollowupFor(record: any) {
  followupCustId.value = record.id
  fwForm.method = '电话'
  fwForm.date = dayjs().format('YYYY-MM-DD')
  fwForm.content = ''
  showFollowup.value = true
}

function saveFollowup() {
  const cust = allCustomers.value.find(c => c.id === followupCustId.value)
  followups.push({
    id: followups.length + 1,
    ownerId: cust?.ownerId || 1,
    customerId: followupCustId.value,
    content: fwForm.content,
    method: fwForm.method,
    date: fwForm.date || dayjs().format('YYYY-MM-DD'),
  })
  if (cust) {
    cust.latestFollowup = fwForm.content
    cust.latestFollowupDate = fwForm.date || dayjs().format('YYYY-MM-DD')
  }
  showFollowup.value = false
  Message.success('跟进记录已添加')
}

// 批量转移负责人
function batchTransferOwner() {
  if (selectedKeys.value.length === 0) return
  showTransfer.value = true
}

function confirmTransfer() {
  const count = selectedKeys.value.length
  selectedKeys.value.forEach(id => {
    const cust = allCustomers.value.find(c => c.id === id)
    if (cust) {
      // 记录历史负责人
      const oldOwner = users.find(u => u.id === cust.ownerId)
      if (cust.ownerId && cust.ownerId !== transferTargetId.value) {
        if (!cust.historyOwners) cust.historyOwners = []
        cust.historyOwners.push({ userId: cust.ownerId, name: oldOwner?.name || '未知', date: dayjs().format('YYYY-MM-DD') })
      }
      cust.ownerId = transferTargetId.value
      cust.assignDate = dayjs().format('YYYY-MM-DD')
    }
  })
  showTransfer.value = false
  selectedKeys.value = []
  const targetUser = users.find(u => u.id === transferTargetId.value)
  Message.success(`已将 ${count} 个客户转移给【${targetUser?.name}】`)
}

// 批量转入公海
function batchToSea() {
  selectedKeys.value.forEach(id => {
    const cust = allCustomers.value.find(c => c.id === id)
    if (cust) {
      const oldOwner = users.find(u => u.id === cust.ownerId)
      if (cust.ownerId && !cust.historyOwners) cust.historyOwners = []
      if (cust.ownerId) cust.historyOwners!.push({ userId: cust.ownerId, name: oldOwner?.name || '未知', date: dayjs().format('YYYY-MM-DD') })
      cust.status = 'sea'
      cust.seaEnterDate = dayjs().format('YYYY-MM-DD')
      cust.ownerId = 0
    }
  })
  const count = selectedKeys.value.length
  selectedKeys.value = []
  Message.success(`已将 ${count} 个客户转入公海`)
}

function handleExport() { alert('导出功能（演示版）') }
</script>
