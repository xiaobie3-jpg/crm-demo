<template>
  <div class="wecom-config-page">
    <a-card title="企微配置">
      <!-- 基础配置 -->
      <a-divider orientation="left">基础配置</a-divider>
      <a-form :model="baseForm" layout="vertical" style="max-width: 560px;">
        <a-form-item label="CorpID (企业ID)" required field="corpId">
          <a-input v-model="baseForm.corpId" placeholder="请在企微管理后台获取企业ID" />
        </a-form-item>
        <a-form-item label="Secret (应用密钥)" required field="secret">
          <a-input-password v-model="baseForm.secret" placeholder="请输入应用的Secret密钥" />
        </a-form-item>
        <a-form-item label="AgentId (应用ID)" required field="agentId">
          <a-input v-model="baseForm.agentId" placeholder="请输入自建应用的AgentId" />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="testing" @click="testConnection">
              测试连接
            </a-button>
            <a-tag v-if="connectionStatus !== ''" :color="connectionStatus === 'success' ? 'green' : 'red'">
              {{ connectionStatus === 'success' ? '连接成功' : '连接失败' }}
            </a-tag>
          </a-space>
        </a-form-item>
      </a-form>

      <!-- 消息推送 -->
      <a-divider orientation="left">消息推送</a-divider>
      <a-form :model="msgForm" layout="vertical" style="max-width: 700px;">
        <a-form-item label="消息模板配置" field="template" extra="支持变量：{用户名}、{内容}、{时间}、{链接}">
          <a-textarea v-model="msgForm.template" :auto-size="{ minRows: 4, maxRows: 8 }"
            placeholder="输入消息模板内容，例如：
您好{用户名}，您有一条新的{类型}待处理。
{内容}
处理时间：{时间}" />
        </a-form-item>
      </a-form>

      <!-- 通讯录同步 -->
      <a-divider orientation="left">通讯录同步</a-divider>
      <div class="sync-section">
        <a-descriptions :column="2" bordered size="small" style="max-width: 600px; margin-bottom: 16px;">
          <a-descriptions-item label="最近同步时间">{{ syncInfo.lastSyncTime || '从未同步' }}</a-descriptions-item>
          <a-descriptions-item label="同步状态">
            <a-badge :status="syncInfo.statusBadge" :text="syncInfo.statusText" />
          </a-descriptions-item>
        </a-descriptions>
        <a-space>
          <a-button type="primary" :loading="syncing" @click="handleSync">
            <template #icon><icon-refresh /></template>
            立即同步
          </a-button>
          <a-button @click="handleAutoSyncToggle">
            {{ syncInfo.autoSync ? '关闭自动同步' : '开启自动同步' }}
          </a-button>
        </a-space>
      </div>

      <!-- 保存 -->
      <div class="save-bar">
        <a-button type="primary" size="large" @click="handleSaveAll" :loading="saving">
          保存所有配置
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'

const baseConfigKey = 'crm_wecom_base_config'
const msgConfigKey = 'crm_wecom_msg_config'
const syncConfigKey = 'crm_wecom_sync_config'

const baseForm = reactive({
  corpId: '',
  secret: '',
  agentId: '',
})

const msgForm = reactive({
  template: `您好{用户名}，您有一条新的{类型}待处理。

【详情】
{内容}

请及时登录系统进行处理。
处理时间截止：{时间}`,
})

const syncInfo = reactive({
  lastSyncTime: '',
  statusText: '未同步',
  statusBadge: 'default' as 'success' | 'processing' | 'warning' | 'danger' | 'default',
  autoSync: false,
})

const testing = ref(false)
const syncing = ref(false)
const saving = ref(false)
const connectionStatus = ref('')

// 从 localStorage 恢复
function loadFromStorage() {
  try {
    const savedBase = localStorage.getItem(baseConfigKey)
    if (savedBase) Object.assign(baseForm, JSON.parse(savedBase))

    const savedMsg = localStorage.getItem(msgConfigKey)
    if (savedMsg) Object.assign(msgForm, JSON.parse(savedMsg))

    const savedSync = localStorage.getItem(syncConfigKey)
    if (savedSync) Object.assign(syncInfo, JSON.parse(savedSync))
  } catch {
    // ignore parse error
  }
}
loadFromStorage()

async function testConnection() {
  if (!baseForm.corpId || !baseForm.secret || !baseForm.agentId) {
    Message.warning('请先填写完整的企微基础配置信息')
    return
  }
  testing.value = true
  connectionStatus.value = ''
  await new Promise(resolve => setTimeout(resolve, 1200))
  testing.value = false
  // Demo: 模拟连接成功
  connectionStatus.value = 'success'
  Message.success('企微连接测试成功')
}

async function handleSync() {
  syncing.value = true
  syncInfo.statusText = '同步中...'
  syncInfo.statusBadge = 'processing'
  await new Promise(resolve => setTimeout(resolve, 1500))
  syncing.value = false
  syncInfo.lastSyncTime = new Date().toLocaleString('zh-CN')
  syncInfo.statusText = '同步完成'
  syncInfo.statusBadge = 'success'
  localStorage.setItem(syncConfigKey, JSON.stringify(syncInfo))
  Message.success('通讯录同步完成')
}

function handleAutoSyncToggle() {
  syncInfo.autoSync = !syncInfo.autoSync
  Message.info(syncInfo.autoSync ? '已开启自动同步（每小时）' : '已关闭自动同步')
  localStorage.setItem(syncConfigKey, JSON.stringify(syncInfo))
}

async function handleSaveAll() {
  if (!baseForm.corpId || !baseForm.secret || !baseForm.agentId) {
    Message.warning('请填写完整的基础配置信息')
    return
  }
  saving.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  localStorage.setItem(baseConfigKey, JSON.stringify(baseForm))
  localStorage.setItem(msgConfigKey, JSON.stringify(msgForm))
  localStorage.setItem(syncConfigKey, JSON.stringify(syncInfo))

  saving.value = false
  Message.success('所有配置已保存')
}
</script>

<style scoped>
.wecom-config-page {
  padding: 16px;
}

.sync-section {
  margin-bottom: 8px;
}

.save-bar {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--color-fill-2);
  display: flex;
  justify-content: center;
}
</style>
