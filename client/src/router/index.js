import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import UserPage from '../views/UserPage.vue'
import RideManagement from '../views/RideManagement.vue'
import Booking from '../views/Booking.vue'
import Feedback from '../views/Feedback.vue'

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
    },
    {
      path: '/rides',
      name: 'rides',
      component: RideManagement,
      meta: { requiresAuth: true }
    },
    {
      path: '/bookings',
      name: 'bookings',
      component: Booking,
      meta: { requiresAuth: true }
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: Feedback,
      meta: { requiresAuth: true }
    }
  ]
})

export default router