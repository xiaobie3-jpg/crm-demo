<template>
  <div>
    <div class="page-header"><h2>业绩目标</h2></div>
    <a-card size="small" style="margin-bottom:16px">
      <a-form layout="inline" size="small">
        <a-form-item label="年度"><a-select v-model="year" style="width:100px"><a-option :value="2025">2025</a-option><a-option :value="2026">2026</a-option><a-option :value="2027">2027</a-option></a-select></a-form-item>
        <a-form-item label="负责人"><a-select v-model="userId" allow-clear style="width:120px" placeholder="全部"><a-option v-for="u in salesUsers" :key="u.id" :value="u.id">{{ u.name }}</a-option></a-select></a-form-item>
        <a-form-item><a-button type="primary" size="small" @click="openBatchEdit">批量设置</a-button></a-form-item>
      </a-form>
    </a-card>
    <a-card>
      <a-table :columns="cols" :data="filteredTargets" size="small" :pagination="false">
        <template #annual="{ record }">{{ fmtW(record.annualPaymentTarget) }}</template>
        <template #firstHalf="{ record }">{{ fmtW(record.firstHalfTarget) }}</template>
        <template #secondHalf="{ record }">{{ fmtW(record.secondHalfTarget) }}</template>
        <template #actions="{ record }">
          <a-button type="text" size="mini" @click="editTarget(record)">编辑</a-button>
        </template>
      </a-table>
    </a-card>

    <!-- 编辑弹窗 -->
    <a-modal v-model:visible="showEdit" title="编辑回款目标" @ok="saveTarget" width="400px">
      <a-form layout="vertical">
        <a-form-item label="全年回款目标（元）"><a-input-number v-model="editForm.annualPaymentTarget" :min="0" style="width:100%" /></a-form-item>
        <a-form-item label="上半年回款目标（元）"><a-input-number v-model="editForm.firstHalfTarget" :min="0" style="width:100%" /></a-form-item>
        <a-form-item label="下半年回款目标（元）"><a-input-number v-model="editForm.secondHalfTarget" :min="0" style="width:100%" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量设置弹窗 -->
    <a-modal v-model:visible="showBatch" title="批量设置回款目标" @ok="saveBatch" width="500px">
      <a-form layout="vertical">
        <a-form-item label="适用负责人">
          <a-select v-model="batchUserIds" multiple style="width:100%" placeholder="请选择负责人">
            <a-option v-for="u in salesUsers" :key="u.id" :value="u.id">{{ u.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="全年回款目标（元）"><a-input-number v-model="batchForm.annualPaymentTarget" :min="0" style="width:100%" /></a-form-item>
        <a-form-item label="上半年回款目标（元）"><a-input-number v-model="batchForm.firstHalfTarget" :min="0" style="width:100%" /></a-form-item>
        <a-form-item label="下半年回款目标（元）"><a-input-number v-model="batchForm.secondHalfTarget" :min="0" style="width:100%" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { users } from '../../mock/data'
import { Message } from '@arco-design/web-vue'

interface TargetItem {
  id: number; userId: number; year: number; annualPaymentTarget: number; firstHalfTarget: number; secondHalfTarget: number;
}

const year = ref(2026)
const userId = ref(null as any)
const showEdit = ref(false)
const showBatch = ref(false)
const editingId = ref(0)

// 生成演示目标数据
const initTargets = (): TargetItem[] => {
  const result: TargetItem[] = []
  const salesUsersList = users.filter(u => u.role === 'sales' || u.role === 'manager')
  salesUsersList.forEach(u => {
    result.push({
      id: result.length + 1, userId: u.id, year: 2026,
      annualPaymentTarget: 800000 + Math.floor(Math.random() * 400000),
      firstHalfTarget: 400000 + Math.floor(Math.random() * 200000),
      secondHalfTarget: 400000 + Math.floor(Math.random() * 200000),
    })
  })
  return result
}

const allTargets = ref<TargetItem[]>(initTargets())
const editForm = reactive({ annualPaymentTarget: 0, firstHalfTarget: 0, secondHalfTarget: 0 })
const batchForm = reactive({ annualPaymentTarget: 0, firstHalfTarget: 0, secondHalfTarget: 0 })
const batchUserIds = ref<number[]>([])

const salesUsers = computed(() => users.filter(u => u.role === 'sales' || u.role === 'manager'))

const filteredTargets = computed(() => {
  return allTargets.value.filter(t => {
    if (t.year !== year.value) return false
    if (userId.value && t.userId !== userId.value) return false
    return true
  })
})

const cols = [
  { title: '负责人', dataIndex: 'userId', width: 80, render: ({ record }: any) => users.find(u => u.id === record.userId)?.name || '—' },
  { title: '年度', dataIndex: 'year', width: 70 },
  { title: '全年回款目标', slotName: 'annual', width: 140 },
  { title: '上半年回款目标', slotName: 'firstHalf', width: 140 },
  { title: '下半年回款目标', slotName: 'secondHalf', width: 140 },
  { title: '操作', slotName: 'actions', width: 80 },
]

// 必须在template中注册slot render
function fmtW(v: number) { return v === 0 ? '0' : v.toLocaleString('zh-CN') }

function editTarget(r: TargetItem) {
  editingId.value = r.id
  editForm.annualPaymentTarget = r.annualPaymentTarget
  editForm.firstHalfTarget = r.firstHalfTarget
  editForm.secondHalfTarget = r.secondHalfTarget
  showEdit.value = true
}

function saveTarget() {
  const idx = allTargets.value.findIndex(t => t.id === editingId.value)
  if (idx >= 0) {
    allTargets.value[idx].annualPaymentTarget = editForm.annualPaymentTarget
    allTargets.value[idx].firstHalfTarget = editForm.firstHalfTarget
    allTargets.value[idx].secondHalfTarget = editForm.secondHalfTarget
  }
  showEdit.value = false
  Message.success('目标已更新')
}

function openBatchEdit() {
  batchUserIds.value = []
  batchForm.annualPaymentTarget = 0
  batchForm.firstHalfTarget = 0
  batchForm.secondHalfTarget = 0
  showBatch.value = true
}

function saveBatch() {
  const ids = batchUserIds.value
  if (ids.length === 0) { Message.warning('请选择负责人'); return }
  ids.forEach(uid => {
    const existing = allTargets.value.find(t => t.userId === uid && t.year === year.value)
    if (existing) {
      existing.annualPaymentTarget = batchForm.annualPaymentTarget
      existing.firstHalfTarget = batchForm.firstHalfTarget
      existing.secondHalfTarget = batchForm.secondHalfTarget
    } else {
      allTargets.value.push({
        id: Math.max(0, ...allTargets.value.map(t => t.id)) + 1,
        userId: uid, year: year.value,
        annualPaymentTarget: batchForm.annualPaymentTarget,
        firstHalfTarget: batchForm.firstHalfTarget,
        secondHalfTarget: batchForm.secondHalfTarget,
      })
    }
  })
  showBatch.value = false
  Message.success(`已批量设置 ${ids.length} 人的回款目标`)
}
</script>
