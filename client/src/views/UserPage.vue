<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import AppSidebar from "../components/AppSidebar.vue";
import AppHeader from "../components/AppHeader.vue";
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
const toast = useToast();
const router = useRouter();
const users = ref([]);
const loading = ref(false);
const selectedUser = ref(null);
const showDeleteConfirm = ref(false);
const userToDelete = ref(null);
const showUserDetails = ref(false);
const filters = ref({
  global: { value: null, matchMode: "contains" },
  role_status: { value: null, matchMode: "equals" }, // Changed from status to role_status
  role: { value: null, matchMode: "equals" },
});
const statusOptions = ref([
  { label: "All", value: null },
  { label: "Approved", value: "approved" },
  { label: "Suspended", value: "suspended" },
  { label: "Pending Approval", value: "pending_approval" },
]);
const roleOptions = ref([
  { label: "All", value: null },
  { label: "Passenger", value: "user" },
  { label: "Driver", value: "driver" },
  { label: "Admin", value: "admin" },
]);

const toggleSidebar = () => {
  if (sidebar.value) {
    sidebar.value.visible = true;
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
        detail: "No token found. Redirecting to login.",
        life: 3000,
      });
      router.push("/login");
      return;
    }
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/admin/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // if (response.data && Array.isArray(response.data.users)) { // Old check
    //   users.value = response.data.users.map((user) => ({ // Old mapping
    //     ...user,
    //     created_at: user.created_at ? user.created_at.replace(" ", "T") : null,
    //   }));
    // TODO: If pagination controls are added to UserPage.vue, store response.data.total, response.data.page etc.
    // } else {
    //   console.error(
    //     "User data is not in the expected format or missing. Expected response.data.users to be an array. Received:",
    //     response.data
    //   );
    //   toast.add({
    //     severity: "error",
    //     summary: "Data Error",
    //     detail: "Failed to parse user data from server.",
    //     life: 3000,
    //   });
    //   users.value = [];
    // }

    if (
      response.data &&
      response.data.success &&
      response.data.data &&
      Array.isArray(response.data.data.users)
    ) {
      users.value = response.data.data.users.map((user) => ({
        ...user,
        created_at: user.created_at ? user.created_at.replace(" ", "T") : null,
      }));
      // TODO: If pagination controls are added to UserPage.vue, store response.data.data.pagination details
    } else {
      console.error(
        "User data is not in the expected format or missing. Expected response.data.data.users to be an array. Received:",
        response.data
      );
      toast.add({
        severity: "error",
        summary: "Data Error",
        detail: "Failed to parse user data from server.",
        life: 3000,
      });
      users.value = [];
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      toast.add({
        severity: "error",
        summary: "Authentication Error",
        detail: "Session expired or invalid. Please login again.",
        life: 3000,
      });
      localStorage.removeItem("token");
      router.push("/login");
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch user data. Please try again later.",
        life: 3000,
      });
    }
  } finally {
    loading.value = false;
  }
};

const confirmDeleteUser = (userId, userName) => {
  userToDelete.value = { id: userId, name: userName };
  showDeleteConfirm.value = true;
};

const executeDeleteUser = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      // Handle missing token, perhaps redirect to login
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Authentication token not found.",
        life: 3000,
      });
      return;
    }
    await axios.delete(
      `${import.meta.env.VITE_API_URL}/admin/users/${userToDelete.value.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    await fetchUsers(); // Refresh user list
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "User deleted successfully",
      life: 3000,
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to delete user. Please check console for details.",
      life: 3000,
    });
  } finally {
    showDeleteConfirm.value = false;
    userToDelete.value = null;
  }
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
  userToDelete.value = null;
};

const showDetails = (user) => {
  selectedUser.value = user;
  showUserDetails.value = true;
};

const updateUserStatus = async (user, newStatus) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Authentication token not found.",
        life: 3000,
      });
      return;
    }
    await axios.patch(
      `${import.meta.env.VITE_API_URL}/admin/users/${user.id}`, // Corrected URL
      { role_status: newStatus }, // Corrected payload key and newStatus will be lowercase
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Optimistically update user in local list or refetch
    // For simplicity, refetching the whole list
    await fetchUsers();
    toast.add({
      severity: "success",
      summary: "Success",
      detail: `User status updated to ${newStatus}`,
      life: 3000,
    });
    if (
      showUserDetails.value &&
      selectedUser.value &&
      selectedUser.value.id === user.id
    ) {
      selectedUser.value.role_status = newStatus;
    }
  } catch (error) {
    console.error("Failed to update user status:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to update user status. Please check console for details.",
      life: 3000,
    });
  }
};

onMounted(() => {
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
            <h1 class="text-2xl font-bold text-[#330b4f] mb-6">
              User Management
            </h1>

            <div class="card bg-white rounded-lg shadow">
              <div
                class="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2"
              >
                <h2 class="text-xl font-semibold text-[#330b4f]">Users</h2>
                <div class="flex space-x-2 flex-wrap gap-2">
                  <InputText
                    v-model="filters.global.value"
                    placeholder="Search users..."
                    class="p-inputtext-sm border-[#dec9f9] focus:border-[#330b4f] w-[200px]"
                  >
                    <template #prefix>
                      <i class="pi pi-search" />
                    </template>
                  </InputText>
                  <Dropdown
                    v-model="filters.role_status.value"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter by status"
                    class="p-inputtext-sm w-[200px]"
                  />
                  <Dropdown
                    v-model="filters.role.value"
                    :options="roleOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter by role"
                    class="p-inputtext-sm w-[200px]"
                  />
                </div>
              </div>

              <DataTable
                :value="users"
                :paginator="true"
                :rows="10"
                :rowsPerPageOptions="[5, 10, 25]"
                :loading="loading"
                v-model:filters="filters"
                filterDisplay="menu"
                responsiveLayout="scroll"
                stripedRows
                class="p-datatable-lg"
                dataKey="id"
              >
                <Column field="name" header="Name" sortable>
                  <template #body="{ data }">
                    <div class="flex items-center">
                      <div
                        class="w-8 h-8 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-2"
                      >
                        {{
                          data.name ? data.name.charAt(0).toUpperCase() : "?"
                        }}
                      </div>
                      {{ data.name }}
                    </div>
                  </template>
                </Column>
                <Column field="email" header="Email" sortable></Column>
                <Column field="phone_number" header="Phone"></Column>
                <Column
                  field="role"
                  header="Role"
                  sortable
                  filterField="role"
                  :showFilterMatchModes="false"
                >
                  <template #filter="{ filterModel, filterCallback }">
                    <Dropdown
                      v-model="filterModel.value"
                      @change="filterCallback()"
                      :options="roleOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Any"
                      class="p-column-filter"
                      :showClear="true"
                    >
                    </Dropdown>
                  </template>
                  <template #body="{ data }">
                    <span class="capitalize">{{
                      data.role ? data.role.toLowerCase() : "N/A"
                    }}</span>
                  </template>
                </Column>
                <Column
                  field="role_status"
                  header="Status"
                  sortable
                  filterField="role_status"
                  :showFilterMatchModes="false"
                >
                  <template #filter="{ filterModel, filterCallback }">
                    <Dropdown
                      v-model="filterModel.value"
                      @change="filterCallback()"
                      :options="statusOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Any"
                      class="p-column-filter"
                      :showClear="true"
                    >
                    </Dropdown>
                  </template>
                  <template #body="{ data }">
                    <span
                      :class="[
                        'px-2 py-1 rounded text-sm capitalize',
                        {
                          'bg-green-100 text-green-800':
                            data.role_status === 'approved',
                          'bg-red-100 text-red-800':
                            data.role_status === 'suspended',
                          'bg-yellow-100 text-yellow-800':
                            data.role_status === 'pending',
                          'bg-gray-100 text-gray-800': ![
                            'approved',
                            'suspended',
                            'pending',
                          ].includes(data.role_status),
                        },
                      ]"
                    >
                      {{
                        data.role_status
                          ? data.role_status.replace("_", " ")
                          : "N/A"
                      }}
                    </span>
                  </template>
                </Column>
                <Column field="created_at" header="Joined" sortable>
                  <template #body="{ data }">
                    {{
                      data.created_at
                        ? new Date(data.created_at).toLocaleDateString()
                        : "N/A"
                    }}
                  </template>
                </Column>

                <Column header="Actions" style="min-width: 10rem">
                  <template #body="{ data }">
                    <div class="flex space-x-1">
                      <Button
                        icon="pi pi-eye"
                        class="p-button-rounded p-button-text p-button-sm text-[#330b4f]"
                        @click="showDetails(data)"
                        tooltip="View Details"
                        tooltipOptions="{ position: 'top' }"
                      />
                      <!--
                      <Button
                        icon="pi pi-check"
                        class="p-button-rounded p-button-text p-button-sm text-green-600"
                        @click="updateUserStatus(data, 'active')"
                        :disabled="data.role_status === 'active'"
                        tooltip="Activate"
                        tooltipOptions="{ position: 'top' }"
                      />
                      <Button
                        icon="pi pi-ban"
                        class="p-button-rounded p-button-text p-button-sm text-red-600"
                        @click="updateUserStatus(data, 'suspended')"
                        :disabled="data.role_status === 'suspended'"
                        tooltip="Suspend"
                        tooltipOptions="{ position: 'top' }"
                      />
                      -->
                      <Button
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-text p-button-sm text-red-600"
                        @click="confirmDeleteUser(data.id, data.name)"
                        tooltip="Delete"
                        tooltipOptions="{ position: 'top' }"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteConfirm"
      :modal="true"
      header="Confirm Delete"
      :style="{ width: '450px' }"
    >
      <div v-if="userToDelete" class="p-4">
        <p class="mb-4">
          Are you sure you want to delete user
          <strong>{{ userToDelete.name }}</strong
          >? This action cannot be undone.
        </p>
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          class="p-button-text"
          @click="cancelDelete"
        />
        <Button
          label="Yes"
          icon="pi pi-check"
          class="p-button-danger"
          @click="executeDeleteUser"
        />
      </template>
    </Dialog>

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
              {{
                selectedUser.name
                  ? selectedUser.name.charAt(0).toUpperCase()
                  : "?"
              }}
            </div>
            <h3 class="mt-3 text-lg font-semibold text-center text-[#330b4f]">
              {{ selectedUser.name }}
            </h3>
            <p class="text-sm text-gray-500 text-center capitalize">
              {{ selectedUser.role ? selectedUser.role.toLowerCase() : "N/A" }}
            </p>
            <div class="mt-3 flex justify-center">
              <span
                :class="[
                  'px-2 py-1 rounded text-sm capitalize',
                  {
                    'bg-green-100 text-green-800':
                      selectedUser.role_status === 'active',
                    'bg-red-100 text-red-800':
                      selectedUser.role_status === 'suspended',
                    'bg-yellow-100 text-yellow-800':
                      selectedUser.role_status === 'pending_approval',
                    'bg-gray-100 text-gray-800': ![
                      'active',
                      'suspended',
                      'pending_approval',
                    ].includes(selectedUser.role_status),
                  },
                ]"
              >
                {{
                  selectedUser.role_status
                    ? selectedUser.role_status.replace("_", " ")
                    : "N/A"
                }}
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
                <p class="text-sm text-gray-500">Student/Staff ID</p>
                <p>
                  {{
                    selectedUser.matric_id ||
                    selectedUser.staff_id ||
                    "Not provided"
                  }}
                </p>
              </div>

              <div class="border-b pb-2">
                <p class="text-sm text-gray-500">Faculty/Department</p>
                <p>{{ selectedUser.faculty || "Not provided" }}</p>
              </div>

              <div class="border-b pb-2">
                <p class="text-sm text-gray-500">Joined</p>
                <p>
                  {{
                    selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString()
                      : "N/A"
                  }}
                </p>
              </div>

              <div v-if="selectedUser.role === 'driver'" class="border-b pb-2">
                <p class="text-sm text-gray-500">Vehicle Details</p>
                <p>
                  {{ selectedUser.vehicle_model || "Not provided" }} ({{
                    selectedUser.vehicle_color || "N/A"
                  }})
                </p>
                <p>
                  Plate:
                  {{ selectedUser.vehicle_plate_number || "Not provided" }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedUser.role === 'driver'" class="mt-6">
          <h4 class="text-lg font-medium text-[#330b4f] mb-2">
            Driver Statistics
          </h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-[#f5f0fa] p-3 rounded-lg">
              <p class="text-sm text-gray-500">Total Rides</p>
              <p class="text-xl font-semibold text-[#330b4f]">
                {{ selectedUser.total_rides || 0 }}
              </p>
            </div>
            <div class="bg-[#f5f0fa] p-3 rounded-lg">
              <p class="text-sm text-gray-500">Average Rating</p>
              <p class="text-xl font-semibold text-[#330b4f]">
                {{
                  selectedUser.average_rating
                    ? parseFloat(selectedUser.average_rating).toFixed(1)
                    : "N/A"
                }}
              </p>
            </div>
            <div class="bg-[#f5f0fa] p-3 rounded-lg">
              <p class="text-sm text-gray-500">Completion Rate</p>
              <p class="text-xl font-semibold text-[#330b4f]">
                {{
                  selectedUser.completion_rate
                    ? selectedUser.completion_rate + "%"
                    : "N/A"
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between w-full">
          <div>
            <Button
              v-if="
                selectedUser &&
                selectedUser.role_status !== 'suspended' &&
                selectedUser.role_status !== 'pending_approval'
              "
              icon="pi pi-ban"
              label="Suspend User"
              class="p-button-danger p-button-outlined mr-2"
              @click="updateUserStatus(selectedUser, 'suspended')"
            />
            <Button
              v-if="selectedUser && selectedUser.role_status !== 'approved'"
              icon="pi pi-check"
              label="Approve User"
              class="p-button-success p-button-outlined"
              @click="updateUserStatus(selectedUser, 'approved')"
            />
          </div>
          <Button
            icon="pi pi-times"
            label="Close"
            class="p-button-text"
            @click="showUserDetails = false"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Component-specific styles */
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f5f0fa;
  color: #330b4f;
  font-weight: 600;
  text-transform: uppercase; /* Added for consistency */
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
  background-color: rgba(222, 201, 249, 0.3); /* Slightly more visible hover */
}

/* Styling for filter dropdowns in table headers */
:deep(.p-column-filter) {
  width: 100%;
}

/* Capitalize status and role text in table and dialogs */
.capitalize {
  text-transform: capitalize;
}
</style>
