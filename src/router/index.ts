import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppStore } from '../stores'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../pages/dashboard/index.vue'), meta: { title: '驾驶舱' } },
      { path: 'todo', name: 'Todo', component: () => import('../pages/todo/index.vue'), meta: { title: '待办任务' } },
      { path: 'customer/list', name: 'CustomerList', component: () => import('../pages/customer/list.vue'), meta: { title: '客户列表' } },
      { path: 'customer/detail/:id', name: 'CustomerDetail', component: () => import('../pages/customer/detail.vue'), meta: { title: '客户详情' } },
      { path: 'customer/followup', name: 'Followup', component: () => import('../pages/customer/followup.vue'), meta: { title: '跟进管理' } },
      { path: 'customer/sea', name: 'CustomerSea', component: () => import('../pages/customer/sea.vue'), meta: { title: '公海管理' } },
      { path: 'contract/list', name: 'ContractList', component: () => import('../pages/contract/list.vue'), meta: { title: '合同列表' } },
      { path: 'contract/detail/:id', name: 'ContractDetail', component: () => import('../pages/contract/detail.vue'), meta: { title: '合同详情' } },
      { path: 'contract/payment-plan', name: 'PaymentPlan', component: () => import('../pages/contract/payment-plan.vue'), meta: { title: '回款计划' } },
      { path: 'contract/payment-record', name: 'PaymentRecord', component: () => import('../pages/contract/payment-record.vue'), meta: { title: '回款录入' } },
      { path: 'contract/channel-fee', name: 'ChannelFee', component: () => import('../pages/contract/channel-fee.vue'), meta: { title: '渠道费支出明细' } },
      { path: 'report/personal-payment', name: 'PersonalPayment', component: () => import('../pages/report/personal-payment.vue'), meta: { title: '个人回款报表' } },
      { path: 'report/customer-data', name: 'CustomerData', component: () => import('../pages/report/customer-data.vue'), meta: { title: '客户数据报表' } },
      { path: 'report/product-type', name: 'ProductType', component: () => import('../pages/report/product-type.vue'), meta: { title: '产品类型报表' } },
      { path: 'report/source', name: 'Source', component: () => import('../pages/report/source.vue'), meta: { title: '推广来源报表' } },
      { path: 'report/sales-performance', name: 'SalesPerformance', component: () => import('../pages/report/sales-performance.vue'), meta: { title: '销售业绩报表' } },
      { path: 'settings/permissions', name: 'Permissions', component: () => import('../pages/settings/permissions.vue'), meta: { title: '权限配置' } },
      { path: 'settings/targets', name: 'Targets', component: () => import('../pages/settings/targets.vue'), meta: { title: '业绩目标' } },
      { path: 'settings/system', name: 'System', component: () => import('../pages/settings/system.vue'), meta: { title: '系统配置' } },
      { path: 'settings/approval', name: 'Approval', component: () => import('../pages/settings/approval.vue'), meta: { title: '审批配置' } },
      { path: 'settings/product-types', name: 'ProductTypes', component: () => import('../pages/settings/product-types.vue'), meta: { title: '产品类型' } },
      { path: 'settings/notifications', name: 'Notifications', component: () => import('../pages/settings/notifications.vue'), meta: { title: '消息通知' } },
      { path: 'settings/wecom', name: 'Wecom', component: () => import('../pages/settings/wecom.vue'), meta: { title: '企微配置' } },
      { path: 'settings/logs', name: 'Logs', component: () => import('../pages/settings/logs.vue'), meta: { title: '操作日志' } },
      { path: 'profile', name: 'Profile', component: () => import('../pages/profile/index.vue'), meta: { title: '个人中心' } },
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const appStore = useAppStore()
  if (to.name !== 'Login' && !appStore.isLoggedIn) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && appStore.isLoggedIn) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
