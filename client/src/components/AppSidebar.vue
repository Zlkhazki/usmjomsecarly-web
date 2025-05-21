<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Drawer from "primevue/drawer";
import Button from "primevue/button";

defineExpose({
  visible: ref(false),
});

const visible = ref(false);
const router = useRouter();

const navigate = (path) => {
  router.push(path);
  visible.value = false;
};

const logout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};
</script>

<template>
  <div class="h-full">
    <!-- Desktop Sidebar -->
    <div
      class="hidden lg:flex flex-col bg-[#330b4f] text-white h-full shadow-lg transition-all duration-300 w-[70px] hover:w-64 group"
    >
      <div
        class="p-5 border-b border-[#4a1572] flex items-center overflow-hidden"
      >
        <img src=".\icons\usm-logo.png" alt="USM Jomsecarly" class="h-8 mr-2" />
        <span
          class="text-xl font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >Jom SeCarly</span
        >
      </div>
      <div class="flex flex-col flex-1 p-4">
        <div class="mb-4">
          <div
            class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2 text-center group-hover:text-left transition-all"
          >
            <span class="hidden group-hover:inline">Main</span>
            <span class="group-hover:hidden">M</span>
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1 justify-center group-hover:justify-start"
            :class="{ 'bg-[#4a1572]': $route.path === '/dashboard' }"
            @click="navigate('/dashboard')"
          >
            <i class="pi pi-chart-line group-hover:mr-2"></i>
            <span class="hidden group-hover:inline">Dashboard</span>
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1 justify-center group-hover:justify-start"
            :class="{ 'bg-[#4a1572]': $route.path === '/users' }"
            @click="navigate('/users')"
          >
            <i class="pi pi-users group-hover:mr-2"></i>
            <span class="hidden group-hover:inline">Users</span>
          </div>
        </div>

        <div class="mb-4">
          <div
            class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2 text-center group-hover:text-left transition-all"
          >
            <span class="hidden group-hover:inline">Rides</span>
            <span class="group-hover:hidden">R</span>
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1 justify-center group-hover:justify-start"
            :class="{ 'bg-[#4a1572]': $route.path === '/rides' }"
            @click="navigate('/rides')"
          >
            <i class="pi pi-car group-hover:mr-2"></i>
            <span class="hidden group-hover:inline">Ride Management</span>
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1 justify-center group-hover:justify-start"
            :class="{ 'bg-[#4a1572]': $route.path === '/driver-applications' }"
            @click="navigate('/driver-applications')"
          >
            <i class="pi pi-id-card group-hover:mr-2"></i>
            <span class="hidden group-hover:inline">Driver Applications</span>
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1 justify-center group-hover:justify-start"
            :class="{ 'bg-[#4a1572]': $route.path === '/bookings' }"
            @click="navigate('/bookings')"
          >
            <i class="pi pi-ticket group-hover:mr-2"></i>
            <span class="hidden group-hover:inline">Bookings</span>
          </div>
        </div>

        <div class="mb-4">
          <div
            class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2 text-center group-hover:text-left transition-all"
          >
            <span class="hidden group-hover:inline">System</span>
            <span class="group-hover:hidden">S</span>
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1 justify-center group-hover:justify-start"
            :class="{ 'bg-[#4a1572]': $route.path === '/feedback' }"
            @click="navigate('/feedback')"
          >
            <i class="pi pi-comments group-hover:mr-2"></i>
            <span class="hidden group-hover:inline">Feedback & Reports</span>
          </div>
        </div>

        <div class="mt-auto">
          <button
            @click="logout"
            class="w-full flex items-center justify-center p-2 bg-[#4a1572] hover:bg-[#5c1a8c] rounded-lg text-white group-hover:justify-start"
          >
            <i class="pi pi-sign-out group-hover:mr-2"></i>
            <span class="hidden group-hover:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>    <!-- Mobile Sidebar -->
    <Drawer
      v-model:visible="visible"
      :dismissable="true"
      :showCloseIcon="true"
      class="bg-[#330b4f] text-white"
      position="left"
    >
      <div class="p-5 border-b border-[#4a1572] flex items-center">
        <img src=".\icons\usm-logo.png" alt="USM Jomsecarly" class="h-8 mr-2" />
        <span class="text-xl font-bold">Jom SeCarly</span>
      </div>

      <div class="flex flex-col p-4">
        <div class="mb-4">
          <div class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2">
            Main
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            :class="{ 'bg-[#4a1572]': $route.path === '/dashboard' }"
            @click="navigate('/dashboard')"
          >
            <i class="pi pi-chart-line mr-2"></i>
            <span>Dashboard</span>
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            :class="{ 'bg-[#4a1572]': $route.path === '/users' }"
            @click="navigate('/users')"
          >
            <i class="pi pi-users mr-2"></i>
            <span>Users</span>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2">
            Rides
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            :class="{ 'bg-[#4a1572]': $route.path === '/rides' }"
            @click="navigate('/rides')"
          >
            <i class="pi pi-car mr-2"></i>
            <span>Ride Management</span>
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            :class="{ 'bg-[#4a1572]': $route.path === '/driver-applications' }"
            @click="navigate('/driver-applications')"
          >
            <i class="pi pi-id-card mr-2"></i>
            <span>Driver Applications</span>
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            :class="{ 'bg-[#4a1572]': $route.path === '/bookings' }"
            @click="navigate('/bookings')"
          >
            <i class="pi pi-ticket mr-2"></i>
            <span>Bookings</span>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2">
            System
          </div>
          <div
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            :class="{ 'bg-[#4a1572]': $route.path === '/feedback' }"
            @click="navigate('/feedback')"
          >
            <i class="pi pi-comments mr-2"></i>
            <span>Feedback & Reports</span>
          </div>
        </div>

        <div class="mt-4">
          <button
            @click="logout"
            class="w-full flex items-center justify-center p-2 bg-[#4a1572] hover:bg-[#5c1a8c] rounded-lg text-white"
          >
            <i class="pi pi-sign-out mr-2"></i>
            <span>Logout</span>          </button>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

.group:hover .transition-opacity {
  transition-delay: 150ms;
}
</style>
