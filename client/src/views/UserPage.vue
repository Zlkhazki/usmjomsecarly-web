<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import AppSidebar from '../components/AppSidebar.vue';
import AppHeader from '../components/AppHeader.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useToast } from 'primevue/usetoast';

const sidebar = ref(null);
const toast = useToast();
const users = ref([]);
const loading = ref(false);
const selectedUser = ref(null);
const showDeleteConfirm = ref(false);
const userToDelete = ref(null);
const showUserDetails = ref(false);
const filters = ref({
  global: { value: null, matchMode: 'contains' },
  status: { value: null, matchMode: 'equals' },
  role: { value: null, matchMode: 'equals' }
});
const statusOptions = ref([
  { label: 'All', value: null },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Pending', value: 'PENDING' }
]);
const roleOptions = ref([
  { label: 'All', value: null },
  { label: 'Student', value: 'STUDENT' },
  { label: 'Driver', value: 'DRIVER' },
  { label: 'Staff', value: 'STAFF' }
]);

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: 'Ahmad Bin Abdullah',
    email: 'ahmad@usm.my',
    phone: '012-3456789',
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: '2023-09-15T08:30:00',
    studentId: 'USM12345',
    faculty: 'School of Computer Sciences'
  },
  {
    id: 2,
    name: 'Siti Binti Mahmood',
    email: 'siti@usm.my',
    phone: '019-8765432',
    role: 'DRIVER',
    status: 'ACTIVE',
    createdAt: '2023-08-27T09:45:00',
    studentId: 'USM54321',
    faculty: 'School of Management',
    vehicleModel: 'Perodua Myvi',
    vehicleColor: 'Silver',
    vehiclePlate: 'PKR 1234',
    totalRides: 45,
    avgRating: 4.8,
    completionRate: 98
  },
  {
    id: 3,
    name: 'Raj Kumar',
    email: 'raj@usm.my',
    phone: '017-1122334',
    role: 'STUDENT',
    status: 'PENDING',
    createdAt: '2023-10-05T14:20:00',
    studentId: 'USM67890',
    faculty: 'School of Engineering'
  },
  {
    id: 4,
    name: 'Lily Tan',
    email: 'lily@student.usm.my',
    phone: '013-9988776',
    role: 'DRIVER',
    status: 'SUSPENDED',
    createdAt: '2023-07-10T11:05:00',
    studentId: 'USM24680',
    faculty: 'School of Social Sciences',
    vehicleModel: 'Honda City',
    vehicleColor: 'Black',
    vehiclePlate: 'PLS 5678',
    totalRides: 28,
    avgRating: 3.2,
    completionRate: 75
  },
  {
    id: 5,
    name: 'Dr. Wong Mei Ling',
    email: 'drwong@usm.my',
    phone: '014-5566778',
    role: 'STAFF',
    status: 'ACTIVE',
    createdAt: '2023-06-18T10:15:00',
    faculty: 'School of Medical Sciences'
  }
];

const toggleSidebar = () => {
  if (sidebar.value) {
    sidebar.value.visible = true;
  }
};

const fetchUsers = async () => {
  try {
    loading.value = true;
    // Comment out the actual API call for now and use mock data
    /*
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    users.value = response.data;
    */
    
    // Use mock data instead
    users.value = mockUsers;
    console.log('Using mock user data');
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch user data',
      life: 3000
    });
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
    await axios.delete(
      `${import.meta.env.VITE_API_URL}/admin/users/${userToDelete.value.id}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    await fetchUsers();
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'User deleted successfully',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete user',
      life: 3000
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
    await axios.patch(
      `${import.meta.env.VITE_API_URL}/admin/users/${user.id}/status`,
      { status: newStatus },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    await fetchUsers();
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `User status updated to ${newStatus}`,
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update user status',
      life: 3000
    });
  }
};

const statusBodyTemplate = (rowData) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return {
    class: `px-2 py-1 rounded text-sm ${getStatusClass(rowData.status)}`
  };
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
            <h1 class="text-2xl font-bold text-[#330b4f] mb-6">User Management</h1>
            
            <!-- Users Table -->
            <div class="card bg-white rounded-lg shadow">
              <div class="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
                <h2 class="text-xl font-semibold text-[#330b4f]">Users</h2>
                <div class="flex space-x-2 flex-wrap gap-2">
                  <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText 
                      v-model="filters.global.value" 
                      placeholder="Search users..." 
                      class="p-inputtext-sm border-[#dec9f9] focus:border-[#330b4f]" 
                    />
                  </span>
                  <Dropdown
                    v-model="filters.status.value"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter by status"
                    class="p-inputtext-sm"
                  />
                  <Dropdown
                    v-model="filters.role.value"
                    :options="roleOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter by role"
                    class="p-inputtext-sm"
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
              >
                <Column field="name" header="Name" sortable>
                  <template #body="{ data }">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-2">
                        {{ data.name.charAt(0).toUpperCase() }}
                      </div>
                      {{ data.name }}
                    </div>
                  </template>
                </Column>
                <Column field="email" header="Email" sortable></Column>
                <Column field="phone" header="Phone"></Column>
                <Column field="role" header="Role" sortable>
                  <template #body="{ data }">
                    <span class="capitalize">{{ data.role.toLowerCase() }}</span>
                  </template>
                </Column>
                <Column field="status" header="Status" sortable>
                  <template #body="{ data }">
                    <span :class="{
                      'px-2 py-1 rounded text-sm': true,
                      'bg-green-100 text-green-800': data.status === 'ACTIVE',
                      'bg-red-100 text-red-800': data.status === 'SUSPENDED',
                      'bg-yellow-100 text-yellow-800': data.status === 'PENDING'
                    }">
                      {{ data.status }}
                    </span>
                  </template>
                </Column>
                <Column field="createdAt" header="Joined" sortable>
                  <template #body="{ data }">
                    {{ new Date(data.createdAt).toLocaleDateString() }}
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
                        tooltipOptions="top"
                      />
                      <Button
                        icon="pi pi-check"
                        class="p-button-rounded p-button-text p-button-sm text-green-600"
                        @click="updateUserStatus(data, 'ACTIVE')"
                        :disabled="data.status === 'ACTIVE'"
                        tooltip="Activate"
                        tooltipOptions="top"
                      />
                      <Button
                        icon="pi pi-ban"
                        class="p-button-rounded p-button-text p-button-sm text-red-600"
                        @click="updateUserStatus(data, 'SUSPENDED')"
                        :disabled="data.status === 'SUSPENDED'"
                        tooltip="Suspend"
                        tooltipOptions="top"
                      />
                      <Button
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-text p-button-sm text-red-600"
                        @click="confirmDeleteUser(data.id, data.name)"
                        tooltip="Delete"
                        tooltipOptions="top"
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
    <Dialog v-model:visible="showDeleteConfirm" :modal="true" header="Confirm Delete" :style="{width: '450px'}">
      <div v-if="userToDelete" class="p-4">
        <p class="mb-4">Are you sure you want to delete user <strong>{{ userToDelete.name }}</strong>? This action cannot be undone.</p>
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
    <Dialog v-model:visible="showUserDetails" :modal="true" header="User Details" :style="{width: '650px'}">
      <div v-if="selectedUser" class="p-4">
        <div class="flex flex-col md:flex-row gap-6">
          <div class="md:w-1/3 flex flex-col items-center">
            <div class="w-24 h-24 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] text-4xl font-bold">
              {{ selectedUser.name.charAt(0).toUpperCase() }}
            </div>
            <h3 class="mt-3 text-lg font-semibold text-center text-[#330b4f]">{{ selectedUser.name }}</h3>
            <p class="text-sm text-gray-500 text-center">{{ selectedUser.role }}</p>
            <div class="mt-3 flex justify-center">
              <span :class="{
                'px-2 py-1 rounded text-sm': true,
                'bg-green-100 text-green-800': selectedUser.status === 'ACTIVE',
                'bg-red-100 text-red-800': selectedUser.status === 'SUSPENDED',
                'bg-yellow-100 text-yellow-800': selectedUser.status === 'PENDING'
              }">
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
                <p>{{ selectedUser.phone || 'Not provided' }}</p>
              </div>
              
              <div class="border-b pb-2">
                <p class="text-sm text-gray-500">Student/Staff ID</p>
                <p>{{ selectedUser.studentId || 'Not provided' }}</p>
              </div>
              
              <div class="border-b pb-2">
                <p class="text-sm text-gray-500">Faculty/Department</p>
                <p>{{ selectedUser.faculty || 'Not provided' }}</p>
              </div>
              
              <div class="border-b pb-2">
                <p class="text-sm text-gray-500">Joined</p>
                <p>{{ new Date(selectedUser.createdAt).toLocaleDateString() }}</p>
              </div>
              
              <div v-if="selectedUser.role === 'DRIVER'" class="border-b pb-2">
                <p class="text-sm text-gray-500">Vehicle Details</p>
                <p>{{ selectedUser.vehicleModel || 'Not provided' }} ({{ selectedUser.vehicleColor || 'N/A' }})</p>
                <p>Plate: {{ selectedUser.vehiclePlate || 'Not provided' }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="selectedUser.role === 'DRIVER'" class="mt-6">
          <h4 class="text-lg font-medium text-[#330b4f] mb-2">Driver Statistics</h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-[#f5f0fa] p-3 rounded-lg">
              <p class="text-sm text-gray-500">Total Rides</p>
              <p class="text-xl font-semibold text-[#330b4f]">{{ selectedUser.totalRides || 0 }}</p>
            </div>
            <div class="bg-[#f5f0fa] p-3 rounded-lg">
              <p class="text-sm text-gray-500">Average Rating</p>
              <p class="text-xl font-semibold text-[#330b4f]">{{ selectedUser.avgRating || 'N/A' }}</p>
            </div>
            <div class="bg-[#f5f0fa] p-3 rounded-lg">
              <p class="text-sm text-gray-500">Completion Rate</p>
              <p class="text-xl font-semibold text-[#330b4f]">{{ selectedUser.completionRate || 'N/A' }}%</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between w-full">
          <div>
            <Button
              v-if="selectedUser && selectedUser.status !== 'SUSPENDED'"
              icon="pi pi-ban"
              label="Suspend User"
              class="p-button-danger p-button-outlined"
              @click="updateUserStatus(selectedUser, 'SUSPENDED')"
            />
            <Button
              v-if="selectedUser && selectedUser.status !== 'ACTIVE'"
              icon="pi pi-check"
              label="Activate User"
              class="p-button-success p-button-outlined"
              @click="updateUserStatus(selectedUser, 'ACTIVE')"
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