<script setup>
import { ref, onMounted, reactive, computed } from "vue";
import AppSidebar from "../components/AppSidebar.vue";
import AppHeader from "../components/AppHeader.vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Toast from "primevue/toast";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import Rating from "primevue/rating";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { ratingsService } from "../services/ratingsService.js";
import { feedbackService } from "../services/feedbackService.js";

const sidebar = ref(null);
const toast = useToast();
const confirm = useConfirm();
const driverReports = ref([]);
const systemFeedback = ref([]);
const loading = ref(false);
const selectedFeedback = ref(null);
const showFeedbackDetails = ref(false);

const filters = reactive({
  search: "",
  type: null,
});

const typeOptions = ref([
  { label: "All", value: null },
  { label: "Driver", value: "DRIVER" },
  { label: "System", value: "SYSTEM" },
  { label: "Service", value: "SERVICE" },
]);

// Fetch driver reports (ride ratings)
const fetchDriverReports = async () => {
  try {
    loading.value = true;
    const response = await ratingsService.getRideRatings({
      page: 1,
      limit: 50,
      sortBy: "created_at",
      order: "desc",
    });
    if (response.success) {
      driverReports.value = response.data.ratings.map((rating) => ({
        id: rating.id,
        type: "DRIVER",
        submittedBy: rating.submittedBy,
        submittedByEmail: rating.submittedByEmail,
        submittedByPhone: rating.submittedByPhone,
        driverName: rating.driverName,
        driverId: rating.driverId,
        driverEmail: rating.driverEmail,
        driverPhone: rating.driverPhone,
        driverRole: rating.driverRole,
        driverRoleStatus: rating.driverRoleStatus,
        rating: rating.rating,
        comment: rating.comment,
        createdAt: rating.createdAt,
        bookingId: rating.bookingId,
        rideId: rating.rideId,
        pickupLocation: rating.pickupLocation,
        dropoffLocation: rating.dropoffLocation,
        rideDate: rating.rideDate,
      }));
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: response.message || "Failed to fetch driver reports",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("Error fetching driver reports:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to fetch driver reports",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Fetch system feedback
const fetchSystemFeedback = async () => {
  try {
    loading.value = true;
    const response = await feedbackService.getSystemFeedback({
      page: 1,
      limit: 50,
      sortBy: "created_at",
      order: "desc",
    });

    if (response.success) {
      systemFeedback.value = response.data.feedback;
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: response.message || "Failed to fetch system feedback",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("Error fetching system feedback:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to fetch system feedback",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Fetch all feedback data
const fetchFeedback = async () => {
  await Promise.all([fetchDriverReports(), fetchSystemFeedback()]);
};

const showDetails = (feedbackItem) => {
  selectedFeedback.value = feedbackItem;
  showFeedbackDetails.value = true;
};

const getRatingClass = (rating) => {
  return {
    "px-2 py-1 rounded text-sm": true,
    "bg-red-100 text-red-800": rating <= 2,
    "bg-yellow-100 text-yellow-800": rating === 3,
    "bg-green-100 text-green-800": rating > 3,
  };
};

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const handleDriverAction = (report, action) => {
  confirm.require({
    message: `Are you sure you want to ${action.toLowerCase()} this driver?`,
    header: "Confirm Action",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      try {
        loading.value = true;
        let response;
        
        if (action.toLowerCase() === 'suspend') {
          response = await ratingsService.suspendUser(
            report.driverId,
            `Driver suspended due to report: ${report.comment}`
          );
        } else if (action.toLowerCase() === 'unsuspend') {
          response = await ratingsService.unsuspendUser(
            report.driverId,
            `Driver unsuspended by admin`
          );
        }

        if (response.success) {
          toast.add({
            severity: "success",
            summary: "Success",
            detail: `Driver has been ${action.toLowerCase()}ed successfully`,
            life: 3000,
          });

          // Close the dialog and refresh the data
          showFeedbackDetails.value = false;
          await fetchDriverReports();
        } else {
          toast.add({
            severity: "error",
            summary: "Error",
            detail:
              response.message || `Failed to ${action.toLowerCase()} driver`,
            life: 3000,
          });
        }
      } catch (error) {
        console.error(`Error ${action.toLowerCase()}ing driver:`, error);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: `Failed to ${action.toLowerCase()} driver`,
          life: 3000,
        });
      } finally {
        loading.value = false;
      }
    },
  });
};

const toggleSidebar = () => {
  if (sidebar.value) {
    sidebar.value.visible = true;
  }
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
            <h1 class="text-2xl font-bold text-[#330b4f] mb-6">
              Feedback and Reports
            </h1>
            <!-- Driver Reports -->
            <div class="mb-8">
              <h2 class="text-xl font-semibold text-[#330b4f] mb-4">
                Driver Reports
              </h2>
              <div class="card bg-white rounded-lg shadow">
                <DataTable
                  :value="driverReports"
                  :loading="loading"
                  :paginator="true"
                  :rows="5"
                  :rowsPerPageOptions="[5, 10, 20]"
                  dataKey="id"
                  stripedRows
                  class="p-datatable-lg"
                >
                  <Column
                    field="id"
                    header="ID"
                    sortable
                    style="width: 8%"
                  ></Column>
                  <Column
                    field="driverName"
                    header="Driver"
                    sortable
                    style="width: 18%"
                  ></Column>
                  <Column
                    field="submittedBy"
                    header="Reported By"
                    sortable
                    style="width: 18%"
                  ></Column>
                  <Column
                    field="rating"
                    header="Rating"
                    sortable
                    style="width: 12%"
                  >
                    <template #body="{ data }">
                      <span :class="getRatingClass(data.rating)">
                        {{ data.rating }}/5
                      </span>
                    </template>
                  </Column>
                  <Column field="comment" header="Report" style="width: 30%">
                    <template #body="{ data }">
                      <div class="truncate max-w-xs">
                        {{ data.comment || "No comment provided" }}
                      </div>
                    </template>
                  </Column>
                  <Column
                    field="createdAt"
                    header="Date"
                    sortable
                    style="width: 14%"
                  >
                    <template #body="{ data }">
                      {{ formatDate(data.createdAt) }}
                    </template>
                  </Column>
                  <Column header="Actions" style="width: 15%">
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
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>

            <!-- System Feedback -->
            <div>
              <h2 class="text-xl font-semibold text-[#330b4f] mb-4">
                System Feedback
              </h2>
              <div class="card bg-white rounded-lg shadow">
                <DataTable
                  :value="systemFeedback"
                  :loading="loading"
                  :paginator="true"
                  :rows="5"
                  :rowsPerPageOptions="[5, 10, 20]"
                  dataKey="id"
                  stripedRows
                  class="p-datatable-lg"
                >
                  <Column
                    field="id"
                    header="ID"
                    sortable
                    style="width: 8%"
                  ></Column>
                  <Column
                    field="submittedBy"
                    header="Submitted By"
                    sortable
                    style="width: 20%"
                  ></Column>
                  <Column
                    field="rating"
                    header="Rating"
                    sortable
                    style="width: 15%"
                  >
                    <template #body="{ data }">
                      <Rating
                        v-model="data.rating"
                        :readonly="true"
                        :cancel="false"
                      />
                    </template>
                  </Column>
                  <Column field="comment" header="Feedback" style="width: 40%">
                    <template #body="{ data }">
                      <div class="truncate max-w-xs">{{ data.comment }}</div>
                    </template>
                  </Column>
                  <Column
                    field="createdAt"
                    header="Date"
                    sortable
                    style="width: 17%"
                  >
                    <template #body="{ data }">
                      {{ formatDate(data.createdAt) }}
                    </template>
                  </Column>
                  <Column header="Actions" style="width: 10%">
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
          class="p-fluid"
        >
          <div v-if="selectedFeedback" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-gray-600">Type</label>
                <div class="font-medium">{{ selectedFeedback.type }}</div>
              </div>
              <div>
                <label class="text-gray-600">Date</label>
                <div class="font-medium">
                  {{ formatDate(selectedFeedback.createdAt) }}
                </div>
              </div>
              <div>
                <label class="text-gray-600">Submitted By</label>
                <div class="font-medium">
                  {{ selectedFeedback.submittedBy }}
                </div>
              </div>
              <div v-if="selectedFeedback.submittedByEmail">
                <label class="text-gray-600">Email</label>
                <div class="font-medium">
                  {{ selectedFeedback.submittedByEmail }}
                </div>
              </div>
              <div v-if="selectedFeedback.type === 'DRIVER'" class="col-span-2">
                <label class="text-gray-600">Driver Information</label>
                <div class="p-3 bg-gray-50 rounded">
                  <div class="mb-2">
                    <strong>Name:</strong> {{ selectedFeedback.driverName }}
                  </div>
                  <div class="mb-2" v-if="selectedFeedback.driverEmail">
                    <strong>Email:</strong> {{ selectedFeedback.driverEmail }}
                  </div>
                  <div class="mb-2" v-if="selectedFeedback.driverPhone">
                    <strong>Phone:</strong> {{ selectedFeedback.driverPhone }}
                  </div>
                  <div>
                    <strong>Status:</strong>                    <span
                      :class="{
                        'px-2 py-1 rounded text-sm ml-2': true,
                        'bg-red-100 text-red-800':
                          selectedFeedback.driverRoleStatus === 'suspended',
                        'bg-green-100 text-green-800':
                          selectedFeedback.driverRoleStatus === 'approved' ||
                          !selectedFeedback.driverRoleStatus ||
                          selectedFeedback.driverRoleStatus !== 'suspended',
                      }"
                    >
                      {{
                        selectedFeedback.driverRoleStatus === "suspended"
                          ? "Suspended"
                          : selectedFeedback.driverRoleStatus === "approved"
                          ? "Active (Approved)"
                          : "Active"
                      }}
                    </span>
                  </div>
                </div>
              </div>
              <div
                v-if="
                  selectedFeedback.type === 'DRIVER' &&
                  (selectedFeedback.pickupLocation ||
                    selectedFeedback.dropoffLocation)
                "
                class="col-span-2"
              >
                <label class="text-gray-600">Trip Information</label>
                <div class="p-3 bg-gray-50 rounded">
                  <div v-if="selectedFeedback.pickupLocation" class="mb-2">
                    <strong>Pickup:</strong>
                    {{ selectedFeedback.pickupLocation }}
                  </div>
                  <div v-if="selectedFeedback.dropoffLocation" class="mb-2">
                    <strong>Dropoff:</strong>
                    {{ selectedFeedback.dropoffLocation }}
                  </div>
                  <div v-if="selectedFeedback.rideDate">
                    <strong>Ride Date:</strong>
                    {{ formatDate(selectedFeedback.rideDate) }}
                  </div>
                </div>
              </div>
              <div class="col-span-2">
                <label class="text-gray-600">Rating</label>
                <div>
                  <Rating
                    v-model="selectedFeedback.rating"
                    :readonly="true"
                    :cancel="false"
                  />
                  <span class="ml-2 text-sm text-gray-500">
                    ({{ selectedFeedback.rating }}/5)
                  </span>
                </div>
              </div>
              <div class="col-span-2">
                <label class="text-gray-600">{{
                  selectedFeedback.type === "DRIVER" ? "Report" : "Feedback"
                }}</label>
                <div class="p-3 bg-gray-50 rounded">
                  {{ selectedFeedback.comment || "No comment provided" }}
                </div>
              </div>
            </div>

            <!-- Actions Section for Driver Reports -->
            <div
              v-if="selectedFeedback.type === 'DRIVER'"
              class="border-t pt-4 mt-4"
            >
              <div class="flex justify-between items-center">
                <div class="text-sm text-gray-600">
                  Driver Management Actions
                </div>                <div class="flex gap-2">
                  <Button
                    v-if="
                      !selectedFeedback.driverRoleStatus ||
                      selectedFeedback.driverRoleStatus !== 'suspended'
                    "
                    label="Suspend Driver"
                    icon="pi pi-ban"
                    severity="danger"
                    @click="handleDriverAction(selectedFeedback, 'Suspend')"
                  />
                  <template v-else>
                    <Button
                      label="Unsuspend Driver"
                      icon="pi pi-check-circle"
                      severity="success"
                      @click="handleDriverAction(selectedFeedback, 'Unsuspend')"
                    />
                    <span
                      class="px-3 py-2 rounded text-sm bg-red-100 text-red-800 font-medium flex items-center"
                    >
                      Driver is Suspended
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  </div>
</template>
