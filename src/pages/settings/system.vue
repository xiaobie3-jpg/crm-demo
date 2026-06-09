<template>
  <div>
    <div class="page-header"><h2>系统配置</h2><a-button type="primary" size="small" @click="saveConfig">保存配置</a-button></div>
    <a-card title="基础配置" style="margin-bottom:16px">
      <a-form :model="config" layout="vertical" style="max-width:500px">
        <a-form-item label="客户名称唯一性">
          <a-switch v-model="config.customerNameUnique" />
          <span style="margin-left:8px;color:#86909c">{{ config.customerNameUnique ? '已开启（新增客户时校验名称不重复）' : '已关闭' }}</span>
        </a-form-item>
        <a-form-item label="客户电话唯一性">
          <a-switch v-model="config.customerPhoneUnique" />
          <span style="margin-left:8px;color:#86909c">{{ config.customerPhoneUnique ? '已开启（新增客户时校验电话不重复）' : '已关闭' }}</span>
        </a-form-item>
        <a-form-item label="公海自动回收天数"><a-input-number v-model="config.seaAutoRecycleDays" :min="1" :max="365" /> 天未跟进自动进入公海</a-form-item>
        <a-form-item label="单人每日领取上限"><a-input-number v-model="config.seaDailyClaimLimit" :min="1" :max="100" /> 个</a-form-item>
        <a-form-item label="合同编号前缀"><a-input v-model="config.contractNoPrefix" style="width:100px" /></a-form-item>
      </a-form>
    </a-card>

    <a-card title="数据字典管理">
      <a-tabs default-active-key="level">
        <a-tab-pane v-for="dict in dictionaries" :key="dict.key" :title="dict.title">
          <a-button type="primary" size="small" style="margin-bottom:12px" @click="addItem(dict.key)">+ 新增</a-button>
          <a-table :columns="dictCols" :data="dict.items" size="small" :pagination="false" style="max-width:600px">
            <template #enabled="{ record }">
              <a-switch v-model="record.enabled" size="small" />
            </template>
            <template #actions="{ record }">
              <a-space size="small">
                <a-button type="text" size="mini" @click="editItem(dict.key, record)">编辑</a-button>
                <a-popconfirm content="确认删除？" @ok="deleteItem(dict.key, record)"><a-button type="text" size="mini" status="danger">删除</a-button></a-popconfirm>
              </a-space>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <a-modal v-model:visible="showDict" title="编辑字典项" @ok="saveDictItem" width="400px">
      <a-form layout="vertical">
        <a-form-item label="名称"><a-input v-model="dictForm.name" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { sysConfig } from '../../mock/data'

const config = reactive({ ...sysConfig })

const dictionaries = reactive([
  { key: 'level', title: '客户等级', items: [
    { name: '有效客户', enabled: true }, { name: '潜在客户', enabled: true }, { name: '意向客户', enabled: true },
    { name: '靠谱客户', enabled: true }, { name: '签约客户', enabled: true }
  ]},
  { key: 'source', title: '客户来源', items: [
    { name: '百度', enabled: true }, { name: '抖音', enabled: true }, { name: '小红书', enabled: true },
    { name: '淘宝', enabled: true }, { name: 'GEO', enabled: true }, { name: '其他', enabled: true }, { name: '自拓', enabled: true }
  ]},
  { key: 'tag', title: '客户标签', items: [
    { name: 'H5', enabled: true }, { name: '小程序', enabled: true }, { name: 'APP', enabled: true },
    { name: '物联网', enabled: true }, { name: 'AI', enabled: true }, { name: 'WEB', enabled: true }, { name: '客户端', enabled: true }
  ]},
  { key: 'productType', title: '产品类型', items: [
    { name: '定制首期', enabled: true }, { name: '定制迭代', enabled: true }, { name: '模板新开', enabled: true },
    { name: '模板续费', enabled: true }, { name: '代办', enabled: true }
  ]},
  { key: 'method', title: '跟进方式', items: [
    { name: '电话', enabled: true }, { name: '面谈', enabled: true }, { name: '微信', enabled: true }
  ]},
  { key: 'payMethod', title: '回款方式', items: [
    { name: '银行转账', enabled: true }, { name: '微信支付', enabled: true }, { name: '支付宝', enabled: true }, { name: '现金', enabled: true }
  ]},
])

const dictCols = [
  { title: '名称', dataIndex: 'name' },
  { title: '启用', slotName: 'enabled', width: 80 },
  { title: '操作', slotName: 'actions', width: 120 },
]

const showDict = ref(false)
const currentDictKey = ref('')
const editingName = ref('')
const dictForm = reactive({ name: '' })

function addItem(key: string) { currentDictKey.value = key; editingName.value = ''; dictForm.name = ''; showDict.value = true }
function editItem(key: string, record: any) { currentDictKey.value = key; editingName.value = record.name; dictForm.name = record.name; showDict.value = true }
function saveDictItem() {
  const dict = dictionaries.find(d => d.key === currentDictKey.value)
  if (!dict) return
  if (editingName.value) {
    const item = dict.items.find((i: any) => i.name === editingName.value)
    if (item) item.name = dictForm.name
  } else {
    dict.items.push({ name: dictForm.name, enabled: true })
  }
  showDict.value = false
}
function deleteItem(key: string, record: any) {
  const dict = dictionaries.find(d => d.key === key)
  if (dict) dict.items = dict.items.filter((i: any) => i.name !== record.name)
}

function saveConfig() {
  Object.assign(sysConfig, config)
  alert('系统配置已保存（演示版）')
}
</script>
