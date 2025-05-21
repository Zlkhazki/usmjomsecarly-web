<template>
  <div class="flex h-screen bg-gray-50">
    <AppSidebar ref="sidebar" />
    <div class="flex flex-col flex-1 overflow-hidden">
      <AppHeader
        @toggle-sidebar="sidebar.toggleSidebar()"
        title="Driver Applications"
      />

      <main class="flex-1 overflow-y-auto px-6 py-4">
        <!-- Page header with filters and search -->
        <div class="flex flex-wrap gap-4 justify-between items-center mb-6">
          <div class="text-xl font-semibold text-gray-800">
            Driver Applications
          </div>

          <div class="flex flex-wrap gap-3">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText
                v-model="filters.global.value"
                placeholder="Search applications"
              />
            </span>

            <Select
              v-model="filters.status.value"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by status"
              class="w-40"
            />
          </div>
        </div>

        <!-- Stats cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Pending Applications"
            :count="stats.pending"
            iconClass="pi pi-file-edit"
            iconColor="text-amber-500"
          />
          <StatCard
            title="Approved Applications"
            :count="stats.approved"
            iconClass="pi pi-check-circle"
            iconColor="text-green-500"
          />
          <StatCard
            title="Rejected Applications"
            :count="stats.rejected"
            iconClass="pi pi-times-circle"
            iconColor="text-red-500"
          />
        </div>

        <!-- Applications DataTable -->
        <Card>
          <template #content>
            <DataTable
              :value="applications"
              :paginator="true"
              :rows="10"
              :rowsPerPageOptions="[5, 10, 25, 50]"
              :loading="loading"
              v-model:filters="filters"
              filterDisplay="menu"
              :globalFilterFields="[
                'id',
                'user.name',
                'user.email',
                'status',
                'application_date',
              ]"
              responsiveLayout="scroll"
              dataKey="id"
              class="p-datatable-sm"
            >
              <template #empty>No driver applications found.</template>
              <template #loading
                >Loading applications data. Please wait.</template
              >

              <Column field="id" header="ID" sortable style="min-width: 12rem">
                <template #body="{ data }">
                  <span class="font-mono text-xs">{{
                    truncateId(data.id)
                  }}</span>
                </template>
              </Column>

              <Column
                field="user.name"
                header="Applicant"
                sortable
                style="min-width: 16rem"
              >
                <template #body="{ data }">
                  <div class="flex items-center gap-2">
                    <Avatar
                      :image="data.user.profile_picture || ''"
                      shape="circle"
                      size="small"
                      :pt="{
                        image: { class: 'w-8 h-8 object-cover' },
                      }"
                    />
                    <div>
                      <div class="font-medium">{{ data.user.name }}</div>
                      <div class="text-xs text-gray-500">
                        {{ data.user.email }}
                      </div>
                    </div>
                  </div>
                </template>
              </Column>

              <Column
                field="application_date"
                header="Applied On"
                sortable
                style="min-width: 12rem"
              >
                <template #body="{ data }">
                  {{ formatDate(data.application_date) }}
                </template>
              </Column>

              <Column
                field="status"
                header="Status"
                sortable
                style="min-width: 12rem"
              >
                <template #filter="{ filterModel, filterCallback }">
                  <Select
                    v-model="filterModel.value"
                    :options="statusOptions.filter((opt) => opt.value)"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Status"
                    class="p-column-filter"
                    :showClear="true"
                    @change="filterCallback()"
                  />
                </template>
                <template #body="{ data }">
                  <Tag
                    :value="data.status"
                    :severity="getStatusSeverity(data.status)"
                  />
                </template>
              </Column>

              <Column
                field="license_image_url"
                header="License"
                style="min-width: 10rem"
              >
                <template #body="{ data }">
                  <Button
                    icon="pi pi-image"
                    text
                    severity="secondary"
                    @click="showLicenseImage(data.license_image_url)"
                    tooltip="View License"
                  />
                </template>
              </Column>

              <Column
                field="review_date"
                header="Reviewed On"
                sortable
                style="min-width: 12rem"
              >
                <template #body="{ data }">
                  {{ data.review_date ? formatDate(data.review_date) : "—" }}
                </template>
              </Column>

              <Column header="Actions" style="min-width: 12rem">
                <template #body="{ data }">
                  <div class="flex gap-2">
                    <Button
                      icon="pi pi-eye"
                      text
                      rounded
                      @click="viewDetails(data)"
                      tooltip="View Details"
                    />
                    <Button
                      icon="pi pi-check"
                      text
                      rounded
                      severity="success"
                      @click="confirmAction(data, 'approve')"
                      :disabled="data.status !== 'pending'"
                      tooltip="Approve"
                    />
                    <Button
                      icon="pi pi-times"
                      text
                      rounded
                      severity="danger"
                      @click="confirmAction(data, 'reject')"
                      :disabled="data.status !== 'pending'"
                      tooltip="Reject"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </main>
    </div>
  </div>

  <!-- Detail Dialog -->
  <Dialog
    v-model:visible="showDetailDialog"
    :header="selectedApplication?.user?.name + ' - Driver Application'"
    modal
    :style="{ width: '50rem' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
  >
    <div v-if="selectedApplication" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="text-lg font-medium mb-4">Applicant Information</h3>
          <div class="space-y-2">
            <div class="flex">
              <span class="font-medium w-32">Name:</span>
              <span>{{ selectedApplication.user.name }}</span>
            </div>
            <div class="flex">
              <span class="font-medium w-32">Email:</span>
              <span>{{ selectedApplication.user.email }}</span>
            </div>
            <div class="flex">
              <span class="font-medium w-32">Phone:</span>
              <span>{{ selectedApplication.user.phone_number }}</span>
            </div>
            <div class="flex">
              <span class="font-medium w-32">Applied On:</span>
              <span>{{
                formatDate(selectedApplication.application_date)
              }}</span>
            </div>
            <div class="flex">
              <span class="font-medium w-32">Status:</span>
              <Tag
                :value="selectedApplication.status"
                :severity="getStatusSeverity(selectedApplication.status)"
              />
            </div>
          </div>
        </div>

        <div v-if="selectedApplication.status !== 'pending'">
          <h3 class="text-lg font-medium mb-4">Review Information</h3>
          <div class="space-y-2">
            <div class="flex">
              <span class="font-medium w-32">Reviewed On:</span>
              <span>{{ formatDate(selectedApplication.review_date) }}</span>
            </div>
            <div class="flex">
              <span class="font-medium w-32">Notes:</span>
              <span>{{
                selectedApplication.review_notes || "No notes provided"
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-medium mb-4">License Image</h3>
        <div class="flex justify-center">
          <img
            :src="selectedApplication.license_image_url"
            alt="Driver License"
            class="max-w-full max-h-64 object-contain border rounded"
          />
        </div>
      </div>

      <div v-if="selectedApplication.status === 'pending'">
        <h3 class="text-lg font-medium mb-4">Review Application</h3>
        <div class="space-y-4">
          <div class="field">
            <label for="notes" class="block mb-2">Review Notes</label>
            <Textarea
              id="notes"
              v-model="reviewNotes"
              rows="3"
              class="w-full"
              placeholder="Enter notes about this application..."
            />
          </div>

          <div class="flex gap-2 justify-end">
            <Button
              label="Approve"
              icon="pi pi-check"
              severity="success"
              @click="confirmAction(selectedApplication, 'approve')"
            />
            <Button
              label="Reject"
              icon="pi pi-times"
              severity="danger"
              @click="confirmAction(selectedApplication, 'reject')"
            />
          </div>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- License Image Dialog -->
  <Dialog
    v-model:visible="showLicenseDialog"
    header="Driver License Image"
    modal
    :style="{ width: '40rem' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
  >
    <div class="flex justify-center">
      <img
        :src="selectedLicenseUrl"
        alt="Driver License"
        class="max-w-full max-h-[70vh] object-contain"
      />
    </div>
  </Dialog>

  <!-- Confirmation Dialog -->
  <ConfirmDialog />

  <!-- Toasts -->
  <Toast />
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";

// Components
import AppSidebar from "../components/AppSidebar.vue";
import AppHeader from "../components/AppHeader.vue";
import StatCard from "../components/StatCard.vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Avatar from "primevue/avatar";
import Textarea from "primevue/textarea";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";

// Hooks
const confirm = useConfirm();
const toast = useToast();
const router = useRouter();
const sidebar = ref(null);

// State management
const applications = ref([]);
const loading = ref(false);
const selectedApplication = ref(null);
const showDetailDialog = ref(false);
const showLicenseDialog = ref(false);
const selectedLicenseUrl = ref("");
const reviewNotes = ref("");
const stats = ref({
  pending: 0,
  approved: 0,
  rejected: 0,
});

// Filter and dropdown options
const filters = ref({
  global: { value: null, matchMode: "contains" },
  status: { value: null, matchMode: "equals" },
});

const statusOptions = ref([
  { label: "All Statuses", value: null },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]);

// Fetch all driver applications
const fetchApplications = async () => {
  const token = localStorage.getItem("token");
  loading.value = true;
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/admin/driver-applications`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    applications.value = response.data.applications;
    updateStats();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to load driver applications",
      life: 3000,
    });
    console.error("Error fetching applications:", error);
  } finally {
    loading.value = false;
  }
};

// Update application statistics
const updateStats = () => {
  stats.value = {
    pending: applications.value.filter((app) => app.status === "pending")
      .length,
    approved: applications.value.filter((app) => app.status === "approved")
      .length,
    rejected: applications.value.filter((app) => app.status === "rejected")
      .length,
  };
};

// View application details
const viewDetails = (application) => {
  selectedApplication.value = application;
  reviewNotes.value = "";
  showDetailDialog.value = true;
};

// Show license image
const showLicenseImage = (url) => {
  selectedLicenseUrl.value = url;
  showLicenseDialog.value = true;
};

// Confirm approval or rejection action
const confirmAction = (application, action) => {
  const isApprove = action === "approve";
  const title = isApprove ? "Approve Application" : "Reject Application";
  const message = isApprove
    ? `Are you sure you want to approve ${application.user.name}'s application? This will grant them driver privileges.`
    : `Are you sure you want to reject ${application.user.name}'s application?`;

  confirm.require({
    header: title,
    message: message,
    icon: `pi pi-${isApprove ? "check" : "times"}-circle`,
    acceptClass: isApprove ? "p-button-success" : "p-button-danger",
    accept: () => updateApplicationStatus(application.id, action),
    reject: () => {},
  });
};

// Update application status
const updateApplicationStatus = async (applicationId, action) => {
  const token = localStorage.getItem("token");
  loading.value = true;  try {
    const response = await axios.put(
      `${
        import.meta.env.VITE_API_URL
      }/admin/driver-applications/${applicationId}`,
      {
        status: action === "approve" ? "approved" : "rejected",
        reviewNotes: reviewNotes.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Update the local applications data
    const index = applications.value.findIndex(
      (app) => app.id === applicationId
    );
    if (index !== -1) {
      applications.value[index] = response.data.application;
    }

    // Close dialog and show success toast
    showDetailDialog.value = false;
    updateStats();

    toast.add({
      severity: "success",
      summary:
        action === "approve" ? "Application Approved" : "Application Rejected",
      detail: response.data.message,
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Action Failed",
      detail:
        error.response?.data?.message || "Failed to process the application",
      life: 3000,
    });
    console.error("Error updating application:", error);
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const truncateId = (id) => {
  if (!id) return "";
  return id.substring(0, 8) + "...";
};

const getStatusSeverity = (status) => {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "warning";
  }
};

// Lifecycle hooks
onMounted(() => {
  fetchApplications();
});
</script>
