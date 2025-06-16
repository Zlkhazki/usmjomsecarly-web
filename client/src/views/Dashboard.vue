<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import AppSidebar from "../components/AppSidebar.vue";
import AppHeader from "../components/AppHeader.vue";
import StatCard from "../components/StatCard.vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Toast from "primevue/toast";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";

const sidebar = ref(null);
const router = useRouter();
const toast = useToast();
const users = ref([]);
const loading = ref(false);
const selectedUser = ref(null);
const showUserDetails = ref(false);
const filters = ref({
  global: { value: null, matchMode: "contains" },
  status: { value: null, matchMode: "equals" },
});
const statusOptions = ref([
  { label: "All", value: null },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Pending", value: "PENDING" },
]);

// Dashboard stats - will be fetched from API
const stats = ref({
  totalUsers: 0,
  activeDrivers: 0,
  completedRides: 0,
  pendingApprovals: 0,
});

const toggleSidebar = () => {
  if (sidebar.value) {
    sidebar.value.visible = true;
  }
};

const fetchStats = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.add({
        severity: "error",
        summary: "Authentication Error",
        detail: "No token found. Please login again.",
        life: 3000,
      });
      router.push("/login"); // Redirect to login if no token
      return;
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/admin/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.data && response.data.success) {
      stats.value = response.data.data;
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: response.data.message || "Failed to fetch dashboard statistics",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail:
        error.response?.data?.message || "Failed to fetch dashboard statistics",
      life: 3000,
    });
    if (error.response && error.response.status === 401) {
      router.push("/login"); // Redirect to login on auth error
    }
  }
};

const fetchUsers = async () => {
  try {
    loading.value = true;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.add({
        severity: "error",
        summary: "Authentication Error",
        detail: "No token found. Please login again.",
        life: 3000,
      });
      router.push("/login"); // Redirect to login if no token
      return;
    }

    // Fetch only a small number of users for the dashboard preview, e.g., 5 most recent
    const response = await axios.get(
      `${
        import.meta.env.VITE_API_URL
      }/admin/users?sortBy=created_at&order=desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.data && response.data.success) {
      users.value = response.data.data.users;
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: response.data.message || "Failed to fetch user data",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.response?.data?.message || "Failed to fetch user data",
      life: 3000,
    });
    if (error.response && error.response.status === 401) {
      router.push("/login"); // Redirect to login on auth error
    }
  } finally {
    loading.value = false;
  }
};

const showDetails = (user) => {
  selectedUser.value = user;
  showUserDetails.value = true;
};

const goToUserManagement = () => {
  router.push("/users");
};

onMounted(() => {
  fetchStats();
  fetchUsers();
});
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <AppSidebar ref="sidebar" class="sticky left-0 h-full" />
    <div class="flex flex-col flex-1 overflow-auto">
      <AppHeader class="h-16 shadow shrink-0" @toggle-sidebar="toggleSidebar" />
      <div class="flex-1 p-4 overflow-auto">
        <Toast />
        <div class="w-full h-full">
          <div class="px-6 py-4">
            <h1 class="text-2xl font-bold text-[#330b4f] mb-6">Dashboard</h1>

            <!-- Stats Cards -->
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <StatCard
                  title="Total Users"
                  :count="stats.totalUsers"
                  bgColor="bg-[#330b4f]"
                  textColor="text-white"
                  iconClass="pi pi-user-plus"
                  iconColor="text-[#dec9f9]"
                />
              </div>
              <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <StatCard
                  title="Active Drivers"
                  :count="stats.activeDrivers"
                  bgColor="bg-[#dec9f9]"
                  textColor="text-[#330b4f]"
                  iconClass="pi pi-car"
                  iconColor="text-[#330b4f]"
                />
              </div>
              <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <StatCard
                  title="Completed Rides"
                  :count="stats.completedRides"
                  bgColor="bg-[#330b4f]"
                  textColor="text-white"
                  iconClass="pi pi-flag-fill"
                  iconColor="text-[#dec9f9]"
                />
              </div>
              <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <StatCard
                  title="Pending Approvals"
                  :count="stats.pendingApprovals"
                  bgColor="bg-[#dec9f9]"
                  textColor="text-[#330b4f]"
                  iconClass="pi pi-hourglass"
                  iconColor="text-[#330b4f]"
                />
              </div>
            </div>

            <div class="my-8"></div>

            <!-- Users Table (Read-only version) -->
            <div class="card bg-white rounded-lg shadow">
              <div
                class="p-4 border-b border-gray-200 flex justify-between items-center"
              >
                <h2 class="text-xl font-semibold text-[#330b4f]">
                  Recent Users
                </h2>
                <div class="flex space-x-2">
                  <span
                    class="p-input-icon-left relative"
                    style="min-width: 250px"
                  >
                    <i
                      class="pi pi-search absolute left-2.5 top-1/2 transform -translate-y-1/2 z-10 text-gray-500"
                    />
                    <InputText
                      v-model="filters.global.value"
                      placeholder="Search users..."
                      class="p-inputtext-sm border-[#dec9f9] focus:border-[#330b4f] w-full pl-9"
                    />
                  </span>
                  <Button
                    icon="pi pi-users"
                    label="User Management"
                    class="p-button-outlined p-button-sm"
                    @click="goToUserManagement"
                  />
                </div>
              </div>

              <DataTable
                :value="users"
                :paginator="true"
                :rows="5"
                :loading="loading"
                v-model:filters="filters"
                filterDisplay="menu"
                responsiveLayout="scroll"
                stripedRows
                class="p-datatable-lg"
              >
                <Column field="name" header="Name" sortable>
                  <template #body="{ data }">
                    <div class="flex items-center">
                      <div
                        class="w-8 h-8 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-2"
                      >
                        {{ data.name.charAt(0).toUpperCase() }}
                      </div>
                      {{ data.name }}
                    </div>
                  </template>
                </Column>
                <Column field="email" header="Email" sortable></Column>
                <Column field="role" header="Role" sortable>
                  <template #body="{ data }">
                    <span class="capitalize">{{
                      data.role.toLowerCase()
                    }}</span>
                  </template>
                </Column>
                <Column field="status" header="Status" sortable>
                  <template #body="{ data }">
                    <span
                      :class="{
                        'px-2 py-1 rounded text-sm': true,
                        'bg-green-100 text-green-800':
                          data.status === 'ACTIVE' ||
                          data.role_status === 'active',
                        'bg-red-100 text-red-800':
                          data.status === 'SUSPENDED' ||
                          data.role_status === 'suspended',
                        'bg-yellow-100 text-yellow-800':
                          data.status === 'PENDING' ||
                          data.role_status === 'pending',
                        'bg-blue-100 text-blue-800':
                          data.role_status === 'approved', // Example for approved
                        'bg-gray-100 text-gray-800':
                          data.role_status === 'inactive', // Example for inactive
                      }"
                    >
                      {{ data.status || data.role_status }}
                    </span>
                  </template>
                </Column>
                <Column field="created_at" header="Joined" sortable>
                  <template #body="{ data }">
                    {{
                      data.created_at
                        ? new Date(
                            data.created_at.replace(" ", "T")
                          ).toLocaleDateString()
                        : "N/A"
                    }}
                  </template>
                </Column>
                <Column header="Actions" style="min-width: 6rem">
                  <template #body="{ data }">
                    <Button
                      icon="pi pi-eye"
                      class="p-button-rounded p-button-text p-button-sm text-[#330b4f]"
                      @click="showDetails(data)"
                      tooltip="View Details"
                      tooltipOptions="top"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Details Dialog -->
    <Dialog
      v-model:visible="showUserDetails"
      :modal="true"
      header="User Details"
      :style="{ width: '650px' }"
    >
      <div v-if="selectedUser" class="p-4">
        <div class="flex flex-col md:flex-row gap-6">
          <div class="md:w-1/3 flex flex-col items-center">
            <div
              class="w-24 h-24 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] text-4xl font-bold"
            >
              {{ selectedUser.name.charAt(0).toUpperCase() }}
            </div>
            <h3 class="mt-3 text-lg font-semibold text-center text-[#330b4f]">
              {{ selectedUser.name }}
            </h3>
            <p class="text-sm text-gray-500 text-center">
              {{ selectedUser.role }}
            </p>
            <div class="mt-3 flex justify-center">
              <span
                :class="{
                  'px-2 py-1 rounded text-sm': true,
                  'bg-green-100 text-green-800':
                    selectedUser.status === 'ACTIVE',
                  'bg-red-100 text-red-800':
                    selectedUser.status === 'SUSPENDED',
                  'bg-yellow-100 text-yellow-800':
                    selectedUser.status === 'PENDING',
                }"
              >
                {{ selectedUser.status }}
              </span>
            </div>
          </div>

          <div class="md:w-2/3">
            <div class="grid grid-cols-1 gap-4">
              <div class="border-b pb-2">
                <p class="text-sm text-gray-500">Email</p>
                <p>{{ selectedUser.email }}</p>
              </div>

              <div class="border-b pb-2">
                <p class="text-sm text-gray-500">Phone</p>
                <p>{{ selectedUser.phone_number || "Not provided" }}</p>
              </div>

              <div class="border-b pb-2">
                <p class="text-sm text-gray-500">Joined</p>
                <p>
                  {{
                    selectedUser.created_at
                      ? new Date(
                          selectedUser.created_at.replace(" ", "T")
                        ).toLocaleDateString()
                      : "N/A"
                  }}
                </p>
              </div>

              <div v-if="selectedUser.role === 'DRIVER'" class="border-b pb-2">
                <p class="text-sm text-gray-500">Vehicle Details</p>
                <p>
                  {{ selectedUser.vehicleModel || "Not provided" }} ({{
                    selectedUser.vehicleColor || "N/A"
                  }})
                </p>
                <p>Plate: {{ selectedUser.vehiclePlate || "Not provided" }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedUser.role === 'DRIVER'" class="mt-6">
          <h4 class="text-lg font-medium text-[#330b4f] mb-2">
            Driver Statistics
          </h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-[#f5f0fa] p-3 rounded-lg">
              <p class="text-sm text-gray-500">Total Rides</p>
              <p class="text-xl font-semibold text-[#330b4f]">
                {{ selectedUser.totalRides || 0 }}
              </p>
            </div>
            <div class="bg-[#f5f0fa] p-3 rounded-lg">
              <p class="text-sm text-gray-500">Average Rating</p>
              <p class="text-xl font-semibold text-[#330b4f]">
                {{ selectedUser.avgRating || "N/A" }}
              </p>
            </div>
            <div class="bg-[#f5f0fa] p-3 rounded-lg">
              <p class="text-sm text-gray-500">Completion Rate</p>
              <p class="text-xl font-semibold text-[#330b4f]">
                {{ selectedUser.completionRate || "N/A" }}%
              </p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          icon="pi pi-times"
          label="Close"
          class="p-button-text"
          @click="showUserDetails = false"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* You can add component-specific styles here */
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f5f0fa;
  color: #330b4f;
  font-weight: 600;
}

:deep(.p-button.p-button-text) {
  color: #330b4f;
}

:deep(.p-button.p-button-text:hover) {
  background: #f5f0fa;
}

:deep(.p-paginator) {
  background-color: transparent;
}

:deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight) {
  background-color: #f5f0fa;
  color: #330b4f;
}

:deep(.p-inputtext:focus) {
  border-color: #330b4f;
  box-shadow: 0 0 0 1px #dec9f9;
}

:deep(.p-dialog-header) {
  background-color: #330b4f;
  color: white;
}

:deep(.p-dialog .p-dialog-header .p-dialog-header-icon) {
  color: white;
}

:deep(.p-dialog .p-dialog-header .p-dialog-header-icon:hover) {
  background-color: rgba(222, 201, 249, 0.3);
}
</style>
