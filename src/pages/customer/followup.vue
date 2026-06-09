<template>
  <div>
    <div class="page-header"><h2>跟进管理</h2><a-space><a-button type="primary" @click="showAdd=true"><icon-plus /> 新增跟进</a-button><a-button @click="handleExport">导出</a-button></a-space></div>
    <a-card style="margin-bottom:16px" size="small">
      <a-form layout="inline" size="small">
        <a-form-item label="负责人"><a-select v-model="filter.ownerId" allow-clear style="width:120px" placeholder="全部"><a-option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</a-option></a-select></a-form-item>
        <a-form-item label="跟进方式"><a-select v-model="filter.method" allow-clear style="width:100px"><a-option value="电话">电话</a-option><a-option value="面谈">面谈</a-option><a-option value="微信">微信</a-option></a-select></a-form-item>
        <a-form-item label="跟进日期"><a-range-picker v-model="filter.dateRange" size="small" /></a-form-item>
        <a-form-item label="搜索"><a-input v-model="filter.keyword" placeholder="客户名称/跟进内容" style="width:180px" allow-clear /></a-form-item>
        <a-form-item><a-button type="primary" @click="fetchData">查询</a-button></a-form-item>
      </a-form>
    </a-card>
    <a-card>
      <a-table :columns="columns" :data="filteredData" :pagination="{ pageSize: 15 }" size="small">
        <template #ownerName="{ record }">{{ users.find(u => u.id === record.ownerId)?.name || '未分配' }}</template>
        <template #customerName="{ record }">{{ customers.find(c => c.id === record.customerId)?.name }}</template>
        <template #actions="{ record }">
          <a-space size="small">
            <a-button type="text" size="mini" @click="$router.push(`/customer/detail/${record.customerId}`)">客户详情</a-button>
            <a-button type="text" size="mini" status="warning" @click="editFollowup(record)">编辑</a-button>
            <a-popconfirm content="确认删除？" @ok="deleteFollowup(record.id)"><a-button type="text" size="mini" status="danger">删除</a-button></a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="showAdd" :title="editingId?'编辑跟进':'新增跟进'" @ok="saveFollowup" width="500px">
      <a-form :model="form" layout="vertical">
        <a-form-item label="客户"><a-select v-model="form.customerId" :disabled="!!editingId"><a-option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</a-option></a-select></a-form-item>
        <a-form-item label="跟进方式"><a-select v-model="form.method"><a-option value="电话">电话</a-option><a-option value="面谈">面谈</a-option><a-option value="微信">微信</a-option></a-select></a-form-item>
        <a-form-item label="跟进日期"><a-date-picker v-model="form.date" style="width:100%" /></a-form-item>
        <a-form-item label="跟进内容"><a-textarea v-model="form.content" :rows="3" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import dayjs from 'dayjs'
import { followups, customers, users } from '../../mock/data'

const allFollowups = ref([...followups])
const showAdd = ref(false)
const editingId = ref(0)

const filter = reactive({ ownerId: null as any, method: '', dateRange: [] as any[], keyword: '' })
const form = reactive({ customerId: 1, method: '电话', date: '', content: '' })

const columns = [
  { title: '负责人', slotName: 'ownerName', width: 70 },
  { title: '客户名称', slotName: 'customerName', width: 130, ellipsis: { showTooltip: true } },
  { title: '跟进内容', dataIndex: 'content', ellipsis: { showTooltip: true } },
  { title: '跟进方式', dataIndex: 'method', width: 80 },
  { title: '跟进日期', dataIndex: 'date', width: 100 },
  { title: '操作', slotName: 'actions', width: 160, fixed: 'right' },
]

const filteredData = computed(() => {
  return allFollowups.value.filter(f => {
    const cust = customers.find(c => c.id === f.customerId)
    if (filter.ownerId && f.ownerId !== filter.ownerId) return false
    if (filter.method && f.method !== filter.method) return false
    if (filter.dateRange && filter.dateRange.length === 2) {
      const [start, end] = filter.dateRange
      if (f.date < start || f.date > end) return false
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      if (!cust?.name.toLowerCase().includes(kw) && !f.content.toLowerCase().includes(kw)) return false
    }
    return true
  })
})

function saveFollowup() {
  if (editingId.value) {
    const idx = allFollowups.value.findIndex(f => f.id === editingId.value)
    if (idx >= 0) Object.assign(allFollowups.value[idx], form, { date: form.date || dayjs().format('YYYY-MM-DD') })
  } else {
    allFollowups.value.push({ id: allFollowups.value.length + 1, ownerId: 1, ...form, date: form.date || dayjs().format('YYYY-MM-DD') } as any)
  }
  showAdd.value = false; editingId.value = 0
}
function editFollowup(r: any) { editingId.value = r.id; Object.assign(form, r); showAdd.value = true }
function deleteFollowup(id: number) { allFollowups.value = allFollowups.value.filter(f => f.id !== id) }
function handleExport() { alert('导出（演示版）') }
function fetchData() { /* reactive */ }
</script>
