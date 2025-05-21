import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import UserPage from "../views/UserPage.vue";
import RideManagement from "../views/RideManagement.vue";
import Booking from "../views/Booking.vue";
import Feedback from "../views/Feedback.vue";
import Login from "../views/Login.vue";
import DriverApplicationManagement from "../views/DriverApplicationManagement.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "root",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "login",
      component: Login,
      meta: { requiresAuth: false },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: Dashboard,
      meta: { requiresAuth: true },
    },
    {
      path: "/users",
      name: "users",
      component: UserPage,
      meta: { requiresAuth: true },
    },
    {
      path: "/rides",
      name: "rides",
      component: RideManagement,
      meta: { requiresAuth: true },
    },
    {
      path: "/bookings",
      name: "bookings",
      component: Booking,
      meta: { requiresAuth: true },
    },
    {
      path: "/feedback",
      name: "feedback",
      component: Feedback,
      meta: { requiresAuth: true },
    },
    {
      path: "/driver-applications",
      name: "driver-applications",
      component: DriverApplicationManagement,
      meta: { requiresAuth: true },
    },
  ],
});

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("token");

  // If route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: "login" });
  }
  // If user is authenticated and trying to access login page
  else if (isAuthenticated && to.name === "login") {
    next({ name: "dashboard" });
  } else {
    next();
  }
});

export default router;
