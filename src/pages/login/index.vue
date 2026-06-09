<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-title">CRM 系统</div>
      <div class="login-subtitle">客户关系管理系统</div>
      <a-form :model="form" layout="vertical" size="large" @submit="handleLogin">
        <a-form-item field="username" label="用户名" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model="form.username" placeholder="请输入用户名" allow-clear>
            <template #prefix><icon-user /></template>
          </a-input>
        </a-form-item>
        <a-form-item field="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model="form.password" placeholder="请输入密码" allow-clear>
            <template #prefix><icon-lock /></template>
          </a-input-password>
        </a-form-item>
        <a-form-item v-if="errorMsg" style="margin-bottom:12px">
          <span class="error-msg">{{ errorMsg }}</span>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" long :loading="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </a-button>
        </a-form-item>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.login-title {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: #165dff;
  margin-bottom: 4px;
}
.login-subtitle {
  font-size: 14px;
  text-align: center;
  color: #86909c;
  margin-bottom: 32px;
}
.error-msg {
  color: #f53f3f;
  font-size: 13px;
}
</style>
