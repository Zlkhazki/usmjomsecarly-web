<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Button from "primevue/button";
import Avatar from "primevue/avatar";
import Menu from "primevue/menu";
import axios from "axios";

const emit = defineEmits(["toggle-sidebar"]);
const router = useRouter();
const adminName = ref("Admin"); // Shorter default
const adminInitial = ref("A"); // Default initial
const adminRole = ref("Administrator");
const profileMenu = ref();
const items = ref([
  {
    label: "Logout",
    icon: "pi pi-sign-out",
    command: () => {
      localStorage.removeItem("token");
      router.push("/login");
    },
  },
]);

const toggleMenu = (event) => {
  profileMenu.value.toggle(event);
};

const toggleSidebar = () => {
  emit("toggle-sidebar");
};

const fetchAdminProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login or handle missing token appropriately
      // For now, we just return and use default values
      return;
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/admin/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data && response.data.name) {
      adminName.value = response.data.name;
      adminInitial.value = response.data.name.charAt(0).toUpperCase();
      adminRole.value = response.data.role
        ? response.data.role.charAt(0).toUpperCase() +
          response.data.role.slice(1)
        : "Administrator";
    } else {
      // Handle cases where name might be missing in response, though API should ensure it
      console.warn("Admin profile data is incomplete or name is missing.");
      // Keep default values or set to guest/unknown
    }
  } catch (error) {
    console.error("Failed to fetch admin profile", error);
    // Potentially redirect to login on auth errors or show a toast message
    // For now, default values will be used
  }
};

onMounted(() => {
  fetchAdminProfile();
});
</script>

<template>
  <header
    class="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between"
  >
    <div class="flex items-center">
      <button
        @click="toggleSidebar"
        class="lg:hidden mr-4 p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none"
      >
        <i class="pi pi-bars"></i>
      </button>
      <div class="flex items-center">
        <img
          src="./icons/logo-notext.png"
          alt="USM Jomsecarly"
          class="h-8 mr-2 hidden sm:block"
        />
        <h1 class="text-xl font-bold text-[#330b4f]">Admin Dashboard</h1>
      </div>
    </div>

    <div class="flex items-center space-x-4">
      <div class="hidden md:flex items-center">
        <div class="relative">
          <div
            class="w-2 h-2 bg-green-500 rounded-full absolute right-0 top-0 border border-white"
          ></div>
          <Button icon="pi pi-bell" class="p-button-text p-button-rounded" />
        </div>
      </div>

      <div class="flex items-center cursor-pointer" @click="toggleMenu">
        <div class="flex items-center space-x-2">
          <Avatar
            class="bg-[#dec9f9] text-[#330b4f]"
            :label="adminInitial"
            shape="circle"
            style="font-size: 1rem"
          />
          <div class="hidden md:block text-right">
            <div class="text-sm font-semibold text-[#330b4f]">
              {{ adminName }}
            </div>
            <div class="text-xs text-gray-500 capitalize">{{ adminRole }}</div>
            <!-- Added capitalize -->
          </div>
          <i class="pi pi-angle-down text-gray-500"></i>
        </div>
      </div>

      <Menu
        ref="profileMenu"
        :model="items"
        :popup="true"
        class="profile-menu"
      />
    </div>
  </header>
</template>

<style scoped>
:deep(.p-button.p-button-text) {
  color: #330b4f;
}

:deep(.p-button.p-button-text:hover) {
  background: #f5f0fa;
}

:deep(.profile-menu.p-menu .p-menuitem-link:focus) {
  box-shadow: 0 0 0 0.2rem #dec9f9;
}

:deep(.profile-menu.p-menu .p-menuitem-link:hover) {
  background-color: #f5f0fa;
}

.capitalize {
  text-transform: capitalize;
}
</style>
