import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Login', component: () => import('../components/auth/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../components/auth/Register.vue') },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('../components/auth/ForgotPassword.vue') },
  { path: '/reset-password', name: 'ResetPassword', component: () => import('../components/auth/ResetPassword.vue') },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

  if (to.meta.requiresAuth && !token) {
    next('/')
  } else if ((to.name === 'Login' || to.name === 'Register') && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
