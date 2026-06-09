<template>
  <div>
    <div class="page-header"><h2>权限配置</h2></div>
    <a-tabs default-active-key="users">
      <a-tab-pane key="users" title="用户管理">
        <div style="margin-bottom:12px;display:flex;gap:8px">
          <a-button type="primary" size="small" @click="syncWecom">企微同步员工</a-button>
        </div>
        <a-table :columns="userCols" :data="userList" size="small" :pagination="false">
          <template #wecomUserId="{ record }">{{ record.wecomUserId || '未绑定' }}</template>
          <template #loginType="{ record }">
            <a-tag size="small" :color="record.loginType==='wecom'?'green':'arcoblue'">{{ record.loginType==='wecom'?'企微登录':'手机号登录' }}</a-tag>
          </template>
          <template #enabled="{ record }">
            <a-switch v-model="record.enabled" size="small" />
          </template>
          <template #actions="{ record }">
            <a-space size="small">
              <a-button type="text" size="mini" @click="editUserRole(record)">编辑角色</a-button>
              <a-button type="text" size="mini" @click="resetUserPwd(record)">重置密码</a-button>
            </a-space>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="roles" title="角色管理">
        <a-button type="primary" size="small" style="margin-bottom:12px" @click="openRoleModal()"><icon-plus /> 新增角色</a-button>
        <a-table :columns="roleCols" :data="roleList" size="small" :pagination="false">
          <template #permissions="{ record }">
            <a-tag v-for="p in record.permissions" :key="p" size="small" color="arcoblue" style="margin:1px">{{ p }}</a-tag>
          </template>
          <template #actions="{ record }">
            <a-button type="text" size="mini" @click="openRoleModal(record)">编辑</a-button>
            <a-popconfirm content="确认删除？" @ok="deleteRole(record.id)"><a-button type="text" size="mini" status="danger">删除</a-button></a-popconfirm>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <!-- 角色编辑弹窗 -->
    <a-modal v-model:visible="showRole" title="编辑角色" @ok="saveRole" width="500px">
      <a-form layout="vertical">
        <a-form-item label="角色名称"><a-input v-model="roleForm.name" /></a-form-item>
        <a-form-item label="权限列表">
          <a-checkbox-group v-model="roleForm.permissions">
            <a-checkbox value="all">全部</a-checkbox>
            <a-checkbox value="customer:view">客户查看</a-checkbox>
            <a-checkbox value="customer:edit">客户编辑</a-checkbox>
            <a-checkbox value="contract:view">合同查看</a-checkbox>
            <a-checkbox value="contract:edit">合同编辑</a-checkbox>
            <a-checkbox value="payment:view">回款查看</a-checkbox>
            <a-checkbox value="payment:edit">回款编辑</a-checkbox>
            <a-checkbox value="report:view">报表查看</a-checkbox>
            <a-checkbox value="settings:view">设置查看</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 用户角色编辑弹窗 -->
    <a-modal v-model:visible="showUser" title="编辑用户" @ok="saveUserRole" width="400px">
      <a-form layout="vertical">
        <a-form-item label="用户">{{ editingUser?.name }}</a-form-item>
        <a-form-item label="角色"><a-select v-model="userRoleForm"><a-option v-for="r in roleList" :key="r.id" :value="r.name">{{ r.name }}</a-option></a-select></a-form-item>
        <a-form-item label="登录方式">
          <a-radio-group v-model="loginTypeForm">
            <a-radio value="wecom">企微登录</a-radio>
            <a-radio value="phone">手机号+密码登录</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { roles, users } from '../../mock/data'
import { Message } from '@arco-design/web-vue'

const userList = ref(users.map(u => ({
  ...u,
  wecomUserId: ['', '', 'wm_zhangsan', 'wm_lisi', 'wm_wangwu', 'wm_zhaoliu'][u.id] || '',
  phone: ['13800138000', '13800138001', '13800138002', '13800138003', '13800138004', '13800138005'][u.id] || '',
  password: '******',
  enabled: true,
  loginType: 'phone' as 'wecom' | 'phone',
})))

const roleList = ref([...roles])
const showRole = ref(false); const showUser = ref(false)
const editingRoleId = ref(0); const editingUser = ref<any>(null); const userRoleForm = ref('')
const loginTypeForm = ref<'wecom' | 'phone'>('phone')
const roleForm = reactive({ name: '', permissions: [] as string[] })

const userCols = [
  { title: '姓名', dataIndex: 'name', width: 80 },
  { title: '企微账号', slotName: 'wecomUserId', width: 130 },
  { title: '手机号', dataIndex: 'phone', width: 130 },
  { title: '角色', dataIndex: 'role', width: 100 },
  { title: '部门', dataIndex: 'dept', width: 110 },
  { title: '登录方式', slotName: 'loginType', width: 100 },
  { title: '启用', slotName: 'enabled', width: 70 },
  { title: '操作', slotName: 'actions', width: 150 },
]

const roleCols = [
  { title: '角色名称', dataIndex: 'name', width: 120 },
  { title: '权限列表', slotName: 'permissions' },
  { title: '操作', slotName: 'actions', width: 150 },
]

function syncWecom() {
  Message.success('已触发企微通讯录同步（演示版），新增2名员工')
}
function resetUserPwd(record: any) {
  Message.success(`已重置【${record.name}】的登录密码`)
}
function openRoleModal(record?: any) {
  if (record) { editingRoleId.value = record.id; roleForm.name = record.name; roleForm.permissions = [...record.permissions] }
  else { editingRoleId.value = 0; roleForm.name = ''; roleForm.permissions = [] }
  showRole.value = true
}
function saveRole() {
  if (editingRoleId.value) {
    const idx = roleList.value.findIndex(r => r.id === editingRoleId.value)
    if (idx >= 0) { roleList.value[idx].name = roleForm.name; roleList.value[idx].permissions = [...roleForm.permissions] }
  } else {
    roleList.value.push({ id: roleList.value.length + 1, name: roleForm.name, permissions: [...roleForm.permissions] })
  }
  showRole.value = false
}
function deleteRole(id: number) { roleList.value = roleList.value.filter(r => r.id !== id) }
function editUserRole(u: any) { editingUser.value = u; userRoleForm.value = u.role; loginTypeForm.value = u.loginType; showUser.value = true }
function saveUserRole() {
  if (editingUser.value) {
    editingUser.value.role = userRoleForm.value
    editingUser.value.loginType = loginTypeForm.value
  }
  showUser.value = false
  Message.success('用户信息已更新')
}
</script>
