import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import UserPage from '../views/UserPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'users',
      component: UserPage,
      meta: { requiresAuth: true }
    }
    // {
    //   path: '/login',
    //   name: 'login',
    //   component: () => import('../views/Login.vue'),
    // },
    // {
    //   path: '/profile',
    //   name: 'profile',
    //   component: () => import('../views/Profile.vue'),
    //   meta: { requiresAuth: true }
    // }
  ],
})

// Navigation guard
// router.beforeEach((to, from, next) => {
//   const token = localStorage.getItem('token')
//   if (to.meta.requiresAuth && !token) {
//     next('/login')
//   } else {
//     next()
//   }
// })

export default router