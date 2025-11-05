import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || null,
    token: localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || null,
    isAuthenticated: !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'))
  }),

  actions: {
    setAuth(user, token, rememberMe = false) {
      this.user = user
      this.token = token
      this.isAuthenticated = true

      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('authToken', token)
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('authToken')
      } else {
        sessionStorage.setItem('user', JSON.stringify(user))
        sessionStorage.setItem('authToken', token)
        localStorage.removeItem('user')
        localStorage.removeItem('authToken')
      }
    },

    clearAuth() {
      this.user = null
      this.token = null
      this.isAuthenticated = false

      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('authToken')
    },

    // NEW: Load user/token from storage to sync reactive state
    loadAuth() {
      const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'))
      const storedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      this.user = storedUser || null
      this.token = storedToken || null
      this.isAuthenticated = !!storedToken
    }
  }
})
