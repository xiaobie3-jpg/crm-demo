<template>
  <div class="login-wrapper">
    <div class="login-bg-decoration">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
    </div>
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-icon"><icon-apps /></div>
        <div class="login-title">CRM 系统</div>
        <div class="login-subtitle">客户关系管理系统</div>
      </div>
      <a-form :model="form" layout="vertical" size="large" @submit="handleLogin">
        <a-form-item field="username" label="用户名" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model="form.username" placeholder="请输入用户名" allow-clear size="large">
            <template #prefix><icon-user style="color:#86909c" /></template>
          </a-input>
        </a-form-item>
        <a-form-item field="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model="form.password" placeholder="请输入密码" allow-clear size="large">
            <template #prefix><icon-lock style="color:#86909c" /></template>
          </a-input-password>
        </a-form-item>
        <a-form-item v-if="errorMsg" style="margin-bottom:12px">
          <a-alert type="error" :content="errorMsg" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" long :loading="loading" size="large" style="border-radius:10px">
            {{ loading ? '登录中...' : '登 录' }}
          </a-button>
        </a-form-item>
        <div class="login-hint">演示账号：admin / 123456</div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores'
import { users } from '../../mock/data'

const router = useRouter()
const appStore = useAppStore()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

function handleLogin() {
  errorMsg.value = ''
  if (!form.username || !form.password) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  // 模拟异步登录
  setTimeout(() => {
    const user = users.find(u => u.name === form.username)
    if (!user) {
      errorMsg.value = '用户不存在'
      loading.value = false
      return
    }
    // 演示版密码为 123456
    if (form.password !== '123456') {
      errorMsg.value = '密码错误'
      loading.value = false
      return
    }
    appStore.login({ id: user.id, name: user.name, role: user.role, dept: user.dept || '销售部' })
    loading.value = false
    router.push('/dashboard')
  }, 600)
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #165dff 0%, #4080ff 50%, #6b8cff 100%);
  position: relative;
  overflow: hidden;
}
.login-bg-decoration { position: absolute; inset: 0; pointer-events: none; }
.circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.06); }
.c1 { width: 600px; height: 600px; top: -200px; right: -150px; }
.c2 { width: 400px; height: 400px; bottom: -100px; left: -100px; }
.c3 { width: 200px; height: 200px; top: 50%; left: 60%; background: rgba(255,255,255,0.04); }
.login-card {
  width: 420px;
  padding: 40px 36px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.15);
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
.login-brand { text-align: center; margin-bottom: 32px; }
.brand-icon {
  width: 60px; height: 60px;
  background: linear-gradient(135deg,#165dff,#4080ff);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  color: #fff;
  font-size: 28px;
  box-shadow: 0 8px 24px rgba(22,119,255,0.3);
}
.login-title { font-size: 24px; font-weight: 700; color: #1d2129; margin-bottom: 4px; }
.login-subtitle { font-size: 14px; color: #86909c; }
.login-hint { text-align: center; font-size: 13px; color: #86909c; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e5e6eb; }
:deep(.arco-input-wrapper), :deep(.arco-input-password) { border-radius: 10px !important; }
</style>
