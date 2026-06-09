<template>
  <div class="product-types-page">
    <a-card title="产品类型管理">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><icon-plus /></template>
          新增类型
        </a-button>
      </template>

      <a-table :data="tableData" :pagination="false" row-key="id" size="small">
        <template #columns>
          <a-table-column title="排序" data-index="sort" width="80" align="center">
            <template #cell="{ rowIndex }">
              <a-space>
                <a-button size="mini" type="text" :disabled="rowIndex === 0"
                  @click="moveUp(rowIndex)">
                  <template #icon><icon-up /></template>
                </a-button>
                <a-button size="mini" type="text" :disabled="rowIndex === tableData.length - 1"
                  @click="moveDown(rowIndex)">
                  <template #icon><icon-down /></template>
                </a-button>
                <span>{{ tableData[rowIndex].sort }}</span>
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="产品类型名称" data-index="name" />
          <a-table-column title="状态" data-index="enabled" width="100" align="center">
            <template #cell="{ record }">
              <a-switch v-model="record.enabled" size="small" />
            </template>
          </a-table-column>
          <a-table-column title="操作" width="160" align="center">
            <template #cell="{ record }">
              <a-space>
                <a-button size="small" type="text" @click="handleEdit(record)">编辑</a-button>
                <a-popconfirm content="确定删除该类型？" @ok="handleDelete(record.id)">
                  <a-button size="small" status="danger" type="text">删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- 编辑/新增弹窗 -->
    <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑产品类型' : '新增产品类型'"
      @ok="handleSave" @cancel="modalVisible = false" :mask-closable="false">
      <a-form :model="form" layout="vertical" style="margin-top: 16px;">
        <a-form-item label="类型名称" field="name" :rules="[{ required: true, message: '请输入类型名称' }]">
          <a-input v-model="form.name" placeholder="请输入产品类型名称" />
        </a-form-item>
        <a-form-item label="排序号" field="sort" :rules="[{ required: true, message: '请输入排序号' }]">
          <a-input-number v-model="form.sort" placeholder="数字越小越靠前" :min="1" style="width: 100%;" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { productTypes as mockProductTypes } from '../../mock/data'

interface ProductType {
  id: number
  name: string
  sort: number
  enabled: boolean
}

const tableData = ref<ProductType[]>(JSON.parse(JSON.stringify(mockProductTypes)))
const modalVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const form = reactive({
  name: '',
  sort: 1,
})

function resetForm() {
  form.name = ''
  form.sort = 1
  isEdit.value = false
  editId.value = null
}

function handleAdd() {
  resetForm()
  const maxSort = tableData.value.reduce((max, item) => Math.max(max, item.sort), 0)
  form.sort = maxSort + 1
  modalVisible.value = true
}

function handleEdit(record: ProductType) {
  resetForm()
  isEdit.value = true
  editId.value = record.id
  form.name = record.name
  form.sort = record.sort
  modalVisible.value = true
}

function handleSave() {
  if (!form.name.trim()) {
    Message.warning('请输入类型名称')
    return
  }
  if (isEdit.value && editId.value !== null) {
    const idx = tableData.value.findIndex(item => item.id === editId.value)
    if (idx !== -1) {
      tableData.value[idx].name = form.name.trim()
      tableData.value[idx].sort = form.sort
    }
    Message.success('修改成功')
  } else {
    const newId = tableData.value.length > 0 ? Math.max(...tableData.value.map(i => i.id)) + 1 : 1
    tableData.value.push({
      id: newId,
      name: form.name.trim(),
      sort: form.sort,
      enabled: true,
    })
    reSort()
    Message.success('新增成功')
  }
  modalVisible.value = false
}

function handleDelete(id: number) {
  const idx = tableData.value.findIndex(item => item.id === id)
  if (idx !== -1) {
    tableData.value.splice(idx, 1)
    reSort()
    Message.success('删除成功')
  }
}

function moveUp(index: number) {
  if (index <= 0) return
  const temp = tableData.value[index]
  tableData.value[index] = tableData.value[index - 1]
  tableData.value[index - 1] = temp
  reSort()
}

function moveDown(index: number) {
  if (index >= tableData.value.length - 1) return
  const temp = tableData.value[index]
  tableData.value[index] = tableData.value[index + 1]
  tableData.value[index + 1] = temp
  reSort()
}

function reSort() {
  tableData.value.forEach((item, index) => {
    item.sort = index + 1
  })
}
</script>

<style scoped>
.product-types-page {
  padding: 16px;
}
</style>
