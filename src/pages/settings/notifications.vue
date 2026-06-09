<template>
  <div class="notifications-page">
    <a-card title="消息通知设置">
      <p class="page-desc">配置系统通知提醒方式，控制各类通知的开关与推送渠道。</p>

      <a-list :bordered="false">
        <a-list-item v-for="item in notifications" :key="item.key" class="notif-item">
          <div class="notif-content">
            <div class="notif-info">
              <div class="notif-name">{{ item.name }}</div>
              <div class="notif-desc">{{ item.desc }}</div>
            </div>
            <div class="notif-actions">
              <a-tooltip v-if="item.disabled" content="功能预留">
                <a-switch :model-value="false" disabled size="medium" />
              </a-tooltip>
              <a-switch v-else v-model="item.enabled" size="medium" />

              <div class="notif-channels" v-if="item.enabled || !item.disabled">
                <span class="channel-label">通知方式：</span>
                <a-checkbox-group v-model="item.channels" :disabled="!item.enabled && !item.disabled">
                  <a-checkbox value="system">系统内消息</a-checkbox>
                  <a-checkbox value="wecom">企微消息</a-checkbox>
                  <a-checkbox value="sms">短信</a-checkbox>
                </a-checkbox-group>
              </div>
            </div>
          </div>
        </a-list-item>
      </a-list>

      <div class="save-bar">
        <a-button type="primary" @click="handleSave" :loading="saving">
          保存设置
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'

interface NotificationItem {
  key: string
  name: string
  desc: string
  enabled: boolean
  channels: string[]
  disabled?: boolean
}

const savedKey = 'crm_notification_settings'

const defaultNotifications: NotificationItem[] = [
  {
    key: 'todo',
    name: '待办任务提醒',
    desc: '当有待办任务即将到期或已到期时，通过所选渠道发送提醒',
    enabled: true,
    channels: ['system', 'wecom'],
  },
  {
    key: 'approval',
    name: '审批提醒',
    desc: '有新的审批任务提交或审批结果变更时发送通知',
    enabled: true,
    channels: ['system', 'wecom'],
  },
  {
    key: 'payment',
    name: '回款到账提醒',
    desc: '回款记录审批通过或实际到账时发送提醒通知',
    enabled: true,
    channels: ['system', 'wecom'],
  },
  {
    key: 'contract',
    name: '合同到期提醒',
    desc: '合同即将到期（默认提前30天）时发送续约提醒',
    enabled: true,
    channels: ['system', 'wecom'],
  },
  {
    key: 'wecom_push',
    name: '企微消息推送',
    desc: '通过企业微信工作台推送系统通知消息',
    enabled: false,
    channels: ['wecom'],
  },
  {
    key: 'sms',
    name: '短信通知',
    desc: '通过短信渠道发送重要通知（需开通短信服务）',
    enabled: false,
    channels: ['sms'],
    disabled: true,
  },
]

// 从 localStorage 恢复或使用默认值
const stored = localStorage.getItem(savedKey)
const notifications = reactive<NotificationItem[]>(
  stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(defaultNotifications))
)

const saving = ref(false)

async function handleSave() {
  saving.value = true
  // 模拟保存延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  localStorage.setItem(savedKey, JSON.stringify(notifications))
  saving.value = false
  Message.success('通知设置已保存')
}
</script>

<style scoped>
.notifications-page {
  padding: 16px;
}

.page-desc {
  color: var(--color-text-3);
  margin-bottom: 20px;
  font-size: 13px;
}

.notif-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--color-fill-2);
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.notif-info {
  flex: 1;
  min-width: 0;
}

.notif-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

.notif-desc {
  color: var(--color-text-3);
  font-size: 12px;
}

.notif-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.notif-channels {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.channel-label {
  color: var(--color-text-3);
  white-space: nowrap;
}

.save-bar {
  margin-top: 24px;
  text-align: right;
  padding-top: 16px;
  border-top: 1px solid var(--color-fill-2);
}
</style>
