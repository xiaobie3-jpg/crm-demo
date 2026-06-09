<template>
  <div>
    <div class="page-header"><h2>操作日志</h2></div>
    <a-tabs default-active-key="operation">
      <a-tab-pane key="operation" title="操作日志">
        <a-card size="small" style="margin-bottom:16px">
          <a-form layout="inline" size="small">
            <a-form-item label="用户"><a-select v-model="filter.userId" allow-clear style="width:120px" placeholder="全部"><a-option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</a-option></a-select></a-form-item>
            <a-form-item label="时间范围"><a-range-picker v-model="filter.dateRange" size="small" /></a-form-item>
            <a-form-item label="操作类型"><a-select v-model="filter.action" allow-clear style="width:120px"><a-option value="新增">新增</a-option><a-option value="编辑">编辑</a-option><a-option value="删除">删除</a-option><a-option value="审批">审批</a-option><a-option value="登录">登录</a-option><a-option value="导出">导出</a-option></a-select></a-form-item>
            <a-form-item label="模块"><a-select v-model="filter.module" allow-clear style="width:120px"><a-option value="客户管理">客户管理</a-option><a-option value="合同管理">合同管理</a-option><a-option value="回款管理">回款管理</a-option><a-option value="审批管理">审批管理</a-option><a-option value="系统设置">系统设置</a-option></a-select></a-form-item>
            <a-form-item><a-button type="primary" @click="fetchData">查询</a-button></a-form-item>
          </a-form>
        </a-card>
        <a-card>
          <a-table :columns="opLogCols" :data="filteredLogs" size="small" :pagination="{ pageSize: 10 }">
            <template #action="{ record }"><a-tag size="small">{{ record.action }}</a-tag></template>
            <template #userName="{ record }">{{ users.find(u => u.id === record.userId)?.name }}</template>
          </a-table>
        </a-card>
      </a-tab-pane>
      <a-tab-pane key="login" title="登录日志">
        <a-card>
          <a-table :columns="loginCols" :data="loginLogs" size="small" :pagination="{ pageSize: 10 }"></a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { operationLogs, users } from '../../mock/data'

const filter = reactive({ userId: null as any, dateRange: [] as any[], action: '', module: '' })

const loginLogs = [
  { id: 1, userId: 1, loginTime: '2026-06-08 09:00:00', ip: '192.168.1.1', device: 'Windows Chrome 120' },
  { id: 2, userId: 3, loginTime: '2026-06-08 09:15:00', ip: '192.168.1.100', device: 'Mac Safari 17' },
  { id: 3, userId: 4, loginTime: '2026-06-08 09:20:00', ip: '192.168.1.101', device: 'Windows Edge 120' },
  { id: 4, userId: 6, loginTime: '2026-06-07 10:00:00', ip: '192.168.1.102', device: 'iPhone iOS 17' },
  { id: 5, userId: 1, loginTime: '2026-06-07 08:30:00', ip: '192.168.1.1', device: 'Windows Chrome 120' },
]

const opLogCols = [
  { title: '用户', slotName: 'userName', width: 80 },
  { title: '操作类型', slotName: 'action', width: 100 },
  { title: '模块', dataIndex: 'module', width: 100 },
  { title: '详情', dataIndex: 'detail', ellipsis: { showTooltip: true } },
  { title: 'IP', dataIndex: 'ip', width: 130 },
  { title: '时间', dataIndex: 'createdAt', width: 160 },
]

const loginCols = [
  { title: '用户', dataIndex: 'userId', width: 80, render: ({ record }: any) => users.find(u => u.id === record.userId)?.name },
  { title: '登录时间', dataIndex: 'loginTime', width: 180 },
  { title: 'IP地址', dataIndex: 'ip', width: 130 },
  { title: '设备信息', dataIndex: 'device' },
]

const filteredLogs = computed(() => {
  return operationLogs.filter(log => {
    if (filter.userId && log.userId !== filter.userId) return false
    if (filter.action && !log.action.includes(filter.action)) return false
    if (filter.module && log.module !== filter.module) return false
    return true
  })
})

function fetchData() { /* reactive */ }
</script>
