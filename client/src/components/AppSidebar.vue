<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from 'primevue/sidebar';
import Button from 'primevue/button';

defineExpose({
  visible: ref(false)
});

const visible = ref(false);
const router = useRouter();

const navigate = (path) => {
  router.push(path);
  visible.value = false;
};

const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};
</script>

<template>
  <div class="h-full">
    <!-- Desktop Sidebar -->
    <div class="hidden lg:flex flex-col bg-[#330b4f] text-white h-full w-64 shadow-lg">
      <div class="p-5 border-b border-[#4a1572] flex items-center">
        <img src=".\icons\usm-logo.png" alt="USM Jomsecarly" class="h-8 mr-2" />
        <span class="text-xl font-bold">Jom SeCarly</span>
      </div>
      <div class="flex flex-col flex-1 p-4">
        <div class="mb-4">
          <div class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2">Main</div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/dashboard')"
          >
            <i class="pi pi-home mr-2"></i>
            <span>Dashboard</span>
          </div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/users')"
          >
            <i class="pi pi-users mr-2"></i>
            <span>Users</span>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2">Rides</div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/rides')"
          >
            <i class="pi pi-car mr-2"></i>
            <span>Ride Management</span>
          </div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/bookings')"
          >
            <i class="pi pi-calendar mr-2"></i>
            <span>Bookings</span>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2">System</div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/reports')"
          >
            <i class="pi pi-chart-bar mr-2"></i>
            <span>Reports</span>
          </div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/settings')"
          >
            <i class="pi pi-cog mr-2"></i>
            <span>Settings</span>
          </div>
        </div>

        <div class="mt-auto">
          <button 
            @click="logout"
            class="w-full flex items-center justify-center p-2 bg-[#4a1572] hover:bg-[#5c1a8c] rounded-lg text-white"
          >
            <i class="pi pi-sign-out mr-2"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Sidebar -->
    <Sidebar v-model:visible="visible" :dismissable="true" :showCloseIcon="true" class="bg-[#330b4f] text-white">
      <div class="p-5 border-b border-[#4a1572] flex items-center">
        <img src="../assets/logo.png" alt="USM Jomsecarly" class="h-8 mr-2" />
        <span class="text-xl font-bold">Jomsecarly</span>
      </div>
      
      <div class="flex flex-col p-4">
        <div class="mb-4">
          <div class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2">Main</div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/')"
          >
            <i class="pi pi-home mr-2"></i>
            <span>Dashboard</span>
          </div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/users')"
          >
            <i class="pi pi-users mr-2"></i>
            <span>Users</span>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2">Rides</div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/rides')"
          >
            <i class="pi pi-car mr-2"></i>
            <span>Ride Management</span>
          </div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/bookings')"
          >
            <i class="pi pi-calendar mr-2"></i>
            <span>Bookings</span>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-xs uppercase text-[#dec9f9] tracking-wider mb-2">System</div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/reports')"
          >
            <i class="pi pi-chart-bar mr-2"></i>
            <span>Reports</span>
          </div>
          <div 
            class="flex items-center p-2 rounded-lg hover:bg-[#4a1572] cursor-pointer mb-1"
            @click="navigate('/settings')"
          >
            <i class="pi pi-cog mr-2"></i>
            <span>Settings</span>
          </div>
        </div>

        <div class="mt-4">
          <button 
            @click="logout"
            class="w-full flex items-center justify-center p-2 bg-[#4a1572] hover:bg-[#5c1a8c] rounded-lg text-white"
          >
            <i class="pi pi-sign-out mr-2"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </Sidebar>
  </div>
</template>