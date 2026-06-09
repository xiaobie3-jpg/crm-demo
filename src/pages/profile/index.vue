<template>
  <div>
    <div class="page-header"><h2>个人中心</h2></div>

    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="个人信息">
          <a-descriptions :column="1" size="large" bordered>
            <a-descriptions-item label="用户名">{{ appStore.currentUser?.name }}</a-descriptions-item>
            <a-descriptions-item label="角色">{{ roleLabel(appStore.currentUser?.role) }}</a-descriptions-item>
            <a-descriptions-item label="部门">{{ appStore.currentUser?.dept }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="修改密码">
          <a-form :model="pwdForm" layout="vertical" @submit="handleChangePwd">
            <a-form-item field="oldPassword" label="原始密码" :rules="[{ required: true, message: '请输入原始密码' }]">
              <a-input-password v-model="pwdForm.oldPassword" placeholder="请输入原始密码" allow-clear />
            </a-form-item>
            <a-form-item field="newPassword" label="新密码" :rules="[{ required: true, minlength: 6, message: '新密码至少6位' }]">
              <a-input-password v-model="pwdForm.newPassword" placeholder="请输入新密码（至少6位）" allow-clear />
            </a-form-item>
            <a-form-item field="confirmPassword" label="确认新密码" :rules="[{ required: true, validator: validateConfirm }]">
              <a-input-password v-model="pwdForm.confirmPassword" placeholder="请再次输入新密码" allow-clear />
            </a-form-item>
            <a-form-item v-if="pwdMsg">
              <span :class="pwdSuccess ? 'success-msg' : 'error-msg'">{{ pwdMsg }}</span>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="pwdLoading">确认修改</a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="登录记录">
          <a-timeline>
            <a-timeline-item v-for="(log, i) in recentLogins" :key="i" :dot-color="i === 0 ? '#22c55e' : '#86909c'">
              <div style="font-size:13px">{{ log.loginTime }}</div>
              <div style="font-size:12px;color:#86909c">{{ log.ip }} · {{ log.device }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
    </a-row>

    <div style="margin-top:16px;text-align:center">
      <a-button type="outline" status="danger" size="large" @click="handleLogout"><icon-export /> 退出登录</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores'

const router = useRouter()
const appStore = useAppStore()

const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdLoading = ref(false)
const pwdMsg = ref('')
const pwdSuccess = ref(false)

function roleLabel(role?: string) {
  const map: Record<string, string> = { admin: '管理员', manager: '销售经理', sales: '销售员' }
  return map[role || ''] || role || '-'
}

function validateConfirm(value: string, callback: (err?: string) => void) {
  if (!value) { callback('请确认新密码'); return }
  if (value !== pwdForm.newPassword) { callback('两次密码不一致'); return }
  callback()
}

function handleChangePwd() {
  pwdMsg.value = ''
  if (!pwdForm.oldPassword) { pwdMsg.value = '请输入原始密码'; return }
  if (pwdForm.oldPassword !== '123456') { pwdMsg.value = '原始密码错误'; pwdSuccess.value = false; return }
  if (pwdForm.newPassword.length < 6) { pwdMsg.value = '新密码至少6位'; pwdSuccess.value = false; return }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) { pwdMsg.value = '两次密码不一致'; pwdSuccess.value = false; return }

  pwdLoading.value = true
  setTimeout(() => {
    pwdMsg.value = '密码修改成功！'
    pwdSuccess.value = true
    pwdLoading.value = false
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  }, 500)
}

const recentLogins = [
  { loginTime: '2026-06-09 09:00:00', ip: '192.168.1.1', device: 'Windows Chrome 120' },
  { loginTime: '2026-06-08 14:30:00', ip: '192.168.1.1', device: 'Windows Chrome 120' },
  { loginTime: '2026-06-08 09:00:00', ip: '192.168.1.1', device: 'Mac Safari 17' },
  { loginTime: '2026-06-07 09:15:00', ip: '192.168.1.100', device: 'Windows Chrome 120' },
]

function handleLogout() {
  appStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.error-msg { color: #f53f3f; font-size: 13px; }
.success-msg { color: #22c55e; font-size: 13px; }
</style>
