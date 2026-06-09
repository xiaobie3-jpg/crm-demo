<template>
  <a-layout>
    <a-layout-sider :collapsed="appStore.collapsed" collapsible @collapse="appStore.toggleCollapse()" :width="240" class="main-sider">
      <div class="logo">
        <icon-apps class="logo-icon" />
        <span v-if="!appStore.collapsed" class="logo-text">CRM 系统</span>
        <span v-else class="logo-text-mini">CRM</span>
      </div>
      <a-menu :default-selected-keys="[activeKey]" :default-open-keys="openKeys" @menu-item-click="onMenuClick">
        <a-menu-item key="/dashboard"><icon-dashboard /> 驾驶舱</a-menu-item>
        <a-menu-item key="/todo"><icon-clock-circle /> 待办任务</a-menu-item>
        <a-sub-menu key="customer">
          <template #title><icon-user-group /> 客户管理</template>
          <a-menu-item key="/customer/list">客户列表</a-menu-item>
          <a-menu-item key="/customer/followup">跟进管理</a-menu-item>
          <a-menu-item key="/customer/sea">公海管理</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="contract">
          <template #title><icon-file /> 合同管理</template>
          <a-menu-item key="/contract/list">合同列表</a-menu-item>
          <a-menu-item key="/contract/payment-plan">回款计划</a-menu-item>
          <a-menu-item key="/contract/payment-record">回款录入</a-menu-item>
          <a-menu-item key="/contract/channel-fee">渠道费支出明细</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="report">
          <template #title><icon-bar-chart /> 数据报表</template>
          <a-menu-item key="/report/personal-payment">个人回款报表</a-menu-item>
          <a-menu-item key="/report/customer-data">客户数据报表</a-menu-item>
          <a-menu-item key="/report/product-type">产品类型报表</a-menu-item>
          <a-menu-item key="/report/source">推广来源报表</a-menu-item>
          <a-menu-item key="/report/sales-performance">销售业绩报表</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="settings">
          <template #title><icon-settings /> 系统设置</template>
          <a-menu-item key="/settings/permissions">权限配置</a-menu-item>
          <a-menu-item key="/settings/targets">业绩目标</a-menu-item>
          <a-menu-item key="/settings/system">系统配置</a-menu-item>
          <a-menu-item key="/settings/approval">审批配置</a-menu-item>
          <a-menu-item key="/settings/notifications">消息通知</a-menu-item>
          <a-menu-item key="/settings/wecom">企微配置</a-menu-item>
          <a-menu-item key="/settings/logs">操作日志</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="layout-header">
        <a-breadcrumb>
          <a-breadcrumb-item v-for="(item, idx) in crumbs" :key="idx">
            <icon-home v-if="idx === 0" style="margin-right:4px" />{{ item }}
          </a-breadcrumb-item>
        </a-breadcrumb>
        <div class="header-right">
          <a-space>
            <a-tooltip content="消息通知">
              <a-button type="text" shape="circle"><icon-bell /></a-button>
            </a-tooltip>
            <a-dropdown trigger="hover">
              <a-space style="cursor:pointer;padding:4px 8px;border-radius:8px;transition:background 0.2s" class="user-dropdown">
                <a-avatar :size="32" :style="{ background: 'linear-gradient(135deg,#165dff,#4080ff)' }">{{ appStore.currentUser?.name?.charAt(0) }}</a-avatar>
                <span style="font-weight:600;font-size:14px">{{ appStore.currentUser?.name }}</span>
                <icon-down style="color:var(--color-text-3)" />
              </a-space>
              <template #content>
                <a-doption @click="router.push('/profile')"><icon-user /> 个人中心</a-doption>
                <a-doption @click="handleLogout"><icon-export /> 退出登录</a-doption>
              </template>
            </a-dropdown>
            <a-tag color="arcoblue" size="small" style="font-weight:500">{{ appStore.currentUser?.dept }}</a-tag>
          </a-space>
        </div>
      </a-layout-header>
      <a-layout-content class="layout-content">
        <div class="page-container">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const activeKey = computed(() => route.path)
const openKeys = computed(() => {
  const parts = route.path.split('/')
  return [parts[1]] as string[]
})

const crumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  const map: Record<string, string> = {
    dashboard: '驾驶舱', todo: '待办任务',
    customer: '客户管理', list: '客户列表', followup: '跟进管理', sea: '公海管理',
    contract: '合同管理', 'payment-plan': '回款计划', 'payment-record': '回款录入', 'channel-fee': '渠道费管理',
    report: '数据报表', 'personal-payment': '个人回款报表', 'customer-data': '客户数据报表',
    'product-type': '产品类型报表', source: '推广来源报表', 'sales-performance': '销售业绩报表',
    settings: '系统设置', permissions: '权限配置', targets: '业绩目标', system: '系统配置',
    approval: '审批配置', notifications: '消息通知', wecom: '企微配置', logs: '操作日志',
    profile: '个人中心',
  }
  return parts.map(p => map[p] || p)
})

function onMenuClick(key: string) {
  router.push(key)
}

function handleLogout() {
  appStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  color: #fff;
}
.logo-icon { font-size: 22px; }
.logo-text { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
.logo-text-mini { font-size: 16px; font-weight: 700; }
.main-sider :deep(.arco-layout-sider-children) { background: transparent; }
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.header-right { display: flex; gap: 8px; align-items: center; }
.user-dropdown:hover { background: #f2f7ff; }
.layout-content { padding: 0; }
</style>
