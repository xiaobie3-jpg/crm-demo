import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const currentUser = ref<{ id: number; name: string; role: string; dept: string } | null>(null)
  const isLoggedIn = ref(false)
  const collapsed = ref(false)
  const breadcrumbs = ref<{ title: string; path?: string }[]>([])

  function login(user: { id: number; name: string; role: string; dept: string }) {
    currentUser.value = user
    isLoggedIn.value = true
  }
  function logout() {
    currentUser.value = null
    isLoggedIn.value = false
  }
  function toggleCollapse() { collapsed.value = !collapsed.value }
  function setBreadcrumbs(crumbs: { title: string; path?: string }[]) { breadcrumbs.value = crumbs }

  return { currentUser, isLoggedIn, collapsed, breadcrumbs, login, logout, toggleCollapse, setBreadcrumbs }
})
