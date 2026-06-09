<template>
  <div>
    <div class="page-header"><h2>审批配置</h2></div>
    <a-card title="回款审批流程" style="margin-bottom:16px">
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="审批级别">一级审批</a-descriptions-item>
        <a-descriptions-item label="审批人角色">
          <a-select v-model="approvalRole" style="width:150px" size="small">
            <a-option value="manager">销售经理</a-option>
            <a-option value="admin">管理员</a-option>
          </a-select>
        </a-descriptions-item>
        <a-descriptions-item label="启用状态">
          <a-switch v-model="approvalEnabled" size="small" />
        </a-descriptions-item>
        <a-descriptions-item label="流程说明">回款录入 → 销售经理审批 → 审批通过/驳回</a-descriptions-item>
      </a-descriptions>
      <a-button type="primary" size="small" style="margin-top:12px" @click="saveApproval">保存</a-button>
    </a-card>

    <a-card title="合同审批流程">
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="审批级别">一级审批</a-descriptions-item>
        <a-descriptions-item label="审批人角色">
          <a-select v-model="contractApprovalRole" style="width:150px" size="small">
            <a-option value="admin">管理员</a-option>
            <a-option value="manager">销售经理</a-option>
          </a-select>
        </a-descriptions-item>
        <a-descriptions-item label="启用状态"><a-switch v-model="contractApprovalEnabled" size="small" /></a-descriptions-item>
        <a-descriptions-item label="流程说明">合同创建 → {{ contractApprovalRole === 'admin' ? '管理员' : '销售经理' }}审批 → 审批通过后合同生效</a-descriptions-item>
      </a-descriptions>
      <a-button type="primary" size="small" style="margin-top:12px" @click="saveContractApproval">保存</a-button>
    </a-card>

    <a-card title="审批记录" style="margin-top:16px">
      <a-table :columns="logCols" :data="approvalLogs" size="small" :pagination="{ pageSize: 10 }">
        <template #action="{ record }">
          <a-tag :color="record.action==='approved'?'green':'red'" size="small">{{ record.action==='approved'?'通过':'驳回' }}</a-tag>
        </template>
        <template #userId="{ record }">{{ users.find(u=>u.id===record.userId)?.name }}</template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { approvalLogs, users } from '../../mock/data'

const approvalEnabled = ref(true)
const approvalRole = ref('manager')
const contractApprovalEnabled = ref(true)
const contractApprovalRole = ref('admin')

const logCols = [
  { title: '类型', dataIndex: 'type', width: 80, render: () => '回款审批' },
  { title: '记录ID', dataIndex: 'recordId', width: 80 },
  { title: '操作', slotName: 'action', width: 60 },
  { title: '审批人', slotName: 'userId', width: 80 },
  { title: '备注', dataIndex: 'comment' },
  { title: '时间', dataIndex: 'createdAt', width: 160 },
]

function saveApproval() { alert('审批配置已保存（演示版）') }
function saveContractApproval() { alert('合同审批配置已保存（演示版）') }
</script>
