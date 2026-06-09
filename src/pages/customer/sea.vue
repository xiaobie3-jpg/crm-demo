<template>
  <div>
    <div class="page-header"><h2>公海管理</h2><a-space><a-tag color="orange">公海客户数: {{ seaCustomers.length }}</a-tag><a-button @click="handleExport">导出</a-button></a-space></div>
    <a-card size="small" style="margin-bottom:16px">
      <a-form layout="inline" size="small">
        <a-form-item label="客户等级"><a-select v-model="filter.level" allow-clear style="width:120px"><a-option v-for="l in levels" :key="l" :value="l">{{ l }}</a-option></a-select></a-form-item>
        <a-form-item label="客户来源"><a-select v-model="filter.source" allow-clear style="width:130px"><a-option v-for="s in sources" :key="s" :value="s">{{ s }}</a-option></a-select></a-form-item>
        <a-form-item label="分配日期"><a-range-picker v-model="filter.assignDateRange" size="small" style="width:220px" /></a-form-item>
        <a-form-item label="搜索"><a-input v-model="filter.keyword" placeholder="客户编号/名称" style="width:180px" allow-clear /></a-form-item>
        <a-form-item><a-button type="primary" @click="fetchData">查询</a-button></a-form-item>
      </a-form>
    </a-card>
    <a-card>
      <a-table :columns="columns" :data="filteredData" :pagination="{ pageSize: 15 }" size="small" :scroll="{ x: 1400 }">
        <template #tags="{ record }">
          <a-tag v-for="t in record.tags" :key="t" size="small" color="arcoblue" style="margin:1px">{{ t }}</a-tag>
        </template>
        <template #historyOwner="{ record }">
          <span v-if="record.historyOwners && record.historyOwners.length > 0" style="color:#666">
            {{ record.historyOwners[record.historyOwners.length - 1].name }}
            <a-tooltip>
              <template #content>
                <div v-for="h in record.historyOwners" :key="h.userId">{{ h.name }} ({{ h.date }})</div>
              </template>
              <span style="font-size:12px;color:var(--color-text-3);cursor:pointer"> (共{{ record.historyOwners.length }}任)</span>
            </a-tooltip>
          </span>
          <span v-else style="color:var(--color-text-3)">-</span>
        </template>
        <template #actions="{ record }">
          <a-space size="small">
            <a-button type="primary" size="mini" @click="claimCustomer(record)">领取</a-button>
            <a-button type="text" size="mini" @click="$router.push(`/customer/detail/${record.id}`)">详情</a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { customers } from '../../mock/data'
import { useAppStore } from '../../stores'

const appStore = useAppStore()
const seaCustomers = computed(() => customers.filter(c => c.status === 'sea'))
const levels = ['有效客户', '潜在客户', '意向客户', '靠谱客户', '签约客户']
const sources = ['百度', '抖音', '小红书', '淘宝', 'GEO', '其他', '自拓']

const filter = reactive({ level: '', source: '', assignDateRange: [] as any[], keyword: '' })

const columns = [
  { title: '客户编号', dataIndex: 'code', width: 80 },
  { title: '客户等级', dataIndex: 'level', width: 90 },
  { title: '客户名称', dataIndex: 'name', width: 140, ellipsis: { showTooltip: true } },
  { title: '电话', dataIndex: 'phone', width: 120 },
  { title: '分配日期', dataIndex: 'assignDate', width: 100 },
  { title: '客户来源', dataIndex: 'source', width: 100 },
  { title: '历史负责人', slotName: 'historyOwner', width: 120 },
  { title: '最新往来', dataIndex: 'latestFollowup', width: 150, ellipsis: { showTooltip: true } },
  { title: '最近往来日期', dataIndex: 'latestFollowupDate', width: 110 },
  { title: '客户标签', slotName: 'tags', width: 160 },
  { title: '公海进入时间', dataIndex: 'seaEnterDate', width: 110 },
  { title: '备注', dataIndex: 'remark', width: 100, ellipsis: { showTooltip: true } },
  { title: '操作', slotName: 'actions', width: 120, fixed: 'right' },
]

const filteredData = computed(() => {
  return seaCustomers.value.filter(c => {
    if (filter.level && c.level !== filter.level) return false
    if (filter.source && c.source !== filter.source) return false
    if (filter.assignDateRange && filter.assignDateRange.length === 2) {
      const [start, end] = filter.assignDateRange
      if (c.assignDate < start || c.assignDate > end) return false
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      if (!c.code.toLowerCase().includes(kw) && !c.name.toLowerCase().includes(kw)) return false
    }
    return true
  })
})

function claimCustomer(record: any) {
  record.status = 'normal'
  record.ownerId = appStore.currentUser?.id
  record.assignDate = new Date().toISOString().slice(0, 10)
  delete record.seaEnterDate
  alert(`已领取客户【${record.name}】`)
}
function handleExport() { alert('导出（演示版）') }
function fetchData() { /* reactive */ }
</script>
