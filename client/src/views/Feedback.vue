<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppHeader from '../components/AppHeader.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Rating from 'primevue/rating';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

const sidebar = ref(null);
const toast = useToast();
const confirm = useConfirm();
const feedback = ref([]);
const loading = ref(false);
const selectedFeedback = ref(null);
const showFeedbackDetails = ref(false);

const filters = reactive({
  search: '',
  type: null
});

const typeOptions = ref([
  { label: 'All', value: null },
  { label: 'Driver', value: 'DRIVER' },
  { label: 'System', value: 'SYSTEM' },
  { label: 'Service', value: 'SERVICE' }
]);

// Mock feedback data
const mockFeedback = [
  {
    id: 1,
    type: 'DRIVER',
    submittedBy: 'Ahmad Bin Abdullah',
    driverName: 'Siti Binti Mahmood',
    driverId: 'D123',
    rating: 1,
    comment: 'Driver was rude and drove dangerously',
    status: 'PENDING',
    createdAt: '2024-01-15T08:30:00'
  },
  {
    id: 2,
    type: 'SYSTEM',
    submittedBy: 'Lee Wei Ming',
    rating: 2,
    comment: 'App crashed during booking',
    status: 'PENDING',
    createdAt: '2024-01-16T14:20:00'
  },
  {
    id: 3,
    type: 'SYSTEM',
    submittedBy: 'Sarah Ahmad',
    rating: 5,
    comment: 'Great service overall',
    status: 'RESOLVED',
    createdAt: '2024-01-14T11:45:00',
    response: 'We appreciate your positive feedback'
  },
  {
    id: 4,
    type: 'DRIVER',
    submittedBy: 'John Lee',
    driverName: 'Ali Ahmad',
    driverId: 'D456',
    rating: 2,
    comment: 'Late pickup and unfriendly service',
    status: 'RESOLVED',
    createdAt: '2024-01-13T09:15:00',
    response: 'Driver has been warned about the behavior'
  }
];

// Computed properties for filtered data
const systemFeedback = computed(() => {
  return feedback.value.filter(item => item.type === 'SYSTEM');
});

const driverReports = computed(() => {
  return feedback.value.filter(item => item.type === 'DRIVER');
});

const fetchFeedback = async () => {
  try {
    loading.value = true;
    // In a real app, you would call your API here
    feedback.value = mockFeedback;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch feedback data',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const showDetails = (feedbackItem) => {
  selectedFeedback.value = feedbackItem;
  showFeedbackDetails.value = true;
};

const getStatusClass = (status) => {
  return {
    'px-2 py-1 rounded text-sm': true,
    'bg-green-100 text-green-800': status === 'RESOLVED',
    'bg-yellow-100 text-yellow-800': status === 'PENDING'
  };
};

const getRatingClass = (rating) => {
  return {
    'px-2 py-1 rounded text-sm': true,
    'bg-red-100 text-red-800': rating <= 2,
    'bg-yellow-100 text-yellow-800': rating === 3,
    'bg-green-100 text-green-800': rating > 3
  };
};

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const handleDriverAction = (report, action) => {
  confirm.require({
    message: `Are you sure you want to ${action.toLowerCase()} this driver?`,
    header: 'Confirm Action',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      // In a real app, you would call your API here
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Driver has been ${action.toLowerCase()}ed`,
        life: 3000
      });
      
      // Update the status locally
      report.status = 'RESOLVED';
      report.response = `Driver has been ${action.toLowerCase()}ed`;
    }
  });
};

onMounted(() => {
  fetchFeedback();
});
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <AppSidebar ref="sidebar" class="sticky left-0 h-full" />
    <div class="flex flex-col flex-1 overflow-auto">
      <AppHeader class="h-16 shadow shrink-0" @toggle-sidebar="toggleSidebar" />
      <div class="flex-1 p-4 overflow-auto">
        <ConfirmDialog />
        <Toast />
        <div class="w-full h-full">
          <div class="px-6 py-4">
            <h1 class="text-2xl font-bold text-[#330b4f] mb-6">Feedback and Reports</h1>

            <!-- Driver Reports -->
            <div class="mb-8">
              <h2 class="text-xl font-semibold text-[#330b4f] mb-4">Driver Reports</h2>
              <div class="card bg-white rounded-lg shadow">
                <DataTable
                  :value="driverReports"
                  :loading="loading"
                  :paginator="true"
                  :rows="5"
                  :rowsPerPageOptions="[5, 10, 20]"
                  dataKey="id"
                  stripedRows
                  class="p-datatable-lg">

                  <Column field="id" header="ID" sortable style="width: 5%"></Column>
                  <Column field="driverName" header="Driver" sortable style="width: 15%"></Column>
                  <Column field="submittedBy" header="Reported By" sortable style="width: 15%"></Column>
                  <Column field="rating" header="Rating" sortable style="width: 10%">
                    <template #body="{ data }">
                      <span :class="getRatingClass(data.rating)">
                        {{ data.rating }}/5
                      </span>
                    </template>
                  </Column>
                  <Column field="comment" header="Report" style="width: 25%">
                    <template #body="{ data }">
                      <div class="truncate max-w-xs">{{ data.comment }}</div>
                    </template>
                  </Column>
                  <Column field="status" header="Status" sortable style="width: 10%">
                    <template #body="{ data }">
                      <span :class="getStatusClass(data.status)">
                        {{ data.status }}
                      </span>
                    </template>
                  </Column>
                  <Column field="createdAt" header="Date" sortable style="width: 15%">
                    <template #body="{ data }">
                      {{ formatDate(data.createdAt) }}
                    </template>
                  </Column>
                  <Column style="width: 15%">
                    <template #body="{ data }">
                      <div class="flex gap-2">
                        <Button 
                          icon="pi pi-eye"
                          rounded
                          text
                          severity="secondary"
                          @click="showDetails(data)"
                          v-tooltip.top="'View Details'"
                        />
                        <Button
                          v-if="data.status === 'PENDING'"
                          icon="pi pi-ban"
                          rounded
                          text
                          severity="danger"
                          @click="handleDriverAction(data, 'Suspend')"
                          v-tooltip.top="'Suspend Driver'"
                        />
                        <Button
                          v-if="data.status === 'PENDING'"
                          icon="pi pi-exclamation-circle"
                          rounded
                          text
                          severity="warning"
                          @click="handleDriverAction(data, 'Warn')"
                          v-tooltip.top="'Warn Driver'"
                        />
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>

            <!-- System Feedback -->
            <div>
              <h2 class="text-xl font-semibold text-[#330b4f] mb-4">System Feedback</h2>
              <div class="card bg-white rounded-lg shadow">
                <DataTable
                  :value="systemFeedback"
                  :loading="loading"
                  :paginator="true"
                  :rows="5"
                  :rowsPerPageOptions="[5, 10, 20]"
                  dataKey="id"
                  stripedRows
                  class="p-datatable-lg">

                  <Column field="id" header="ID" sortable style="width: 5%"></Column>
                  <Column field="submittedBy" header="Submitted By" sortable style="width: 15%"></Column>
                  <Column field="rating" header="Rating" sortable style="width: 10%">
                    <template #body="{ data }">
                      <Rating v-model="data.rating" :readonly="true" :cancel="false" />
                    </template>
                  </Column>
                  <Column field="comment" header="Feedback" style="width: 35%">
                    <template #body="{ data }">
                      <div class="truncate max-w-xs">{{ data.comment }}</div>
                    </template>
                  </Column>
                  <Column field="status" header="Status" sortable style="width: 10%">
                    <template #body="{ data }">
                      <span :class="getStatusClass(data.status)">
                        {{ data.status }}
                      </span>
                    </template>
                  </Column>
                  <Column field="createdAt" header="Date" sortable style="width: 15%">
                    <template #body="{ data }">
                      {{ formatDate(data.createdAt) }}
                    </template>
                  </Column>
                  <Column style="width: 10%">
                    <template #body="{ data }">
                      <Button 
                        icon="pi pi-eye"
                        rounded
                        text
                        severity="secondary"
                        @click="showDetails(data)"
                        v-tooltip.top="'View Details'"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>
          </div>
        </div>

        <!-- Feedback Details Dialog -->
        <Dialog
          v-model:visible="showFeedbackDetails"
          modal
          header="Feedback Details"
          :style="{ width: '50vw' }"
          class="p-fluid">
          <div v-if="selectedFeedback" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-gray-600">Type</label>
                <div class="font-medium">{{ selectedFeedback.type }}</div>
              </div>
              <div>
                <label class="text-gray-600">Status</label>
                <div>
                  <span :class="getStatusClass(selectedFeedback.status)">
                    {{ selectedFeedback.status }}
                  </span>
                </div>
              </div>
              <div>
                <label class="text-gray-600">Submitted By</label>
                <div class="font-medium">{{ selectedFeedback.submittedBy }}</div>
              </div>
              <div>
                <label class="text-gray-600">Date</label>
                <div class="font-medium">{{ formatDate(selectedFeedback.createdAt) }}</div>
              </div>
              <div v-if="selectedFeedback.type === 'DRIVER'" class="col-span-2">
                <label class="text-gray-600">Driver Information</label>
                <div class="p-2 bg-gray-50 rounded">
                  <div><strong>Name:</strong> {{ selectedFeedback.driverName }}</div>
                  <div><strong>Driver ID:</strong> {{ selectedFeedback.driverId }}</div>
                </div>
              </div>
              <div class="col-span-2">
                <label class="text-gray-600">Rating</label>
                <div>
                  <Rating v-model="selectedFeedback.rating" :readonly="true" :cancel="false" />
                </div>
              </div>
              <div class="col-span-2">
                <label class="text-gray-600">{{ selectedFeedback.type === 'DRIVER' ? 'Report' : 'Feedback' }}</label>
                <div class="p-2 bg-gray-50 rounded">{{ selectedFeedback.comment }}</div>
              </div>
              <div v-if="selectedFeedback.response" class="col-span-2">
                <label class="text-gray-600">Response/Action Taken</label>
                <div class="p-2 bg-gray-50 rounded">{{ selectedFeedback.response }}</div>
              </div>
            </div>

            <div v-if="selectedFeedback.type === 'DRIVER' && selectedFeedback.status === 'PENDING'" class="flex justify-end gap-2 mt-4">
              <Button
                label="Warn Driver"
                icon="pi pi-exclamation-circle"
                severity="warning"
                @click="handleDriverAction(selectedFeedback, 'Warn')"
              />
              <Button
                label="Suspend Driver"
                icon="pi pi-ban"
                severity="danger"
                @click="handleDriverAction(selectedFeedback, 'Suspend')"
              />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  </div>
</template>