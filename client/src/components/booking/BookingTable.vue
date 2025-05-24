<template>
  <TreeTable
    :value="treeTableData"
    :paginator="true"
    :rows="10"
    :rowsPerPageOptions="[10, 20, 50]"
    :loading="loading"
    class="p-treetable-lg"
  >
    <Column field="id" header="ID" :expander="true">
      <template #body="{ node }">
        <span :class="{ 'font-semibold': node.data.type === 'ride' }">
          {{ node.data.id }}
        </span>
      </template>
    </Column>

    <Column field="name" header="Name">
      <template #body="{ node }">
        <div class="flex items-center">
          <div
            class="w-8 h-8 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-2"
          >
            {{ getInitials(node.data.name) }}
          </div>
          <div class="flex-1">
            <div>{{ node.data.name }}</div>
            <div
              v-if="node.data.type === 'passenger'"
              class="text-xs text-gray-500"
            >
              Seat {{ node.data.seatNumber }}
            </div>
          </div>
        </div>
      </template>
    </Column>

    <Column field="vehicle" header="Vehicle">
      <template #body="{ node }">
        <template v-if="node.data.type === 'ride'">
          {{ node.data.vehicle }}
          <div class="text-xs text-gray-500">
            {{ node.data.plateNumber }}
          </div>
        </template>
      </template>
    </Column>

    <Column field="route" header="Route">
      <template #body="{ node }">
        <template v-if="node.data.type === 'ride'">
          <span class="text-xs">{{ node.data.route }}</span>
        </template>
      </template>
    </Column>

    <Column field="date" header="Date" sortable>
      <template #body="{ node }">
        {{ new Date(node.data.date).toLocaleDateString() }}
      </template>
    </Column>

    <Column field="status" header="Status">
      <template #body="{ node }">
        <template v-if="node.data.type === 'passenger'">
          <span
            :class="{
              'px-2 py-1 rounded text-sm': true,
              'bg-green-100 text-green-800': node.data.status === 'Confirmed',
              'bg-blue-100 text-blue-800': node.data.status === 'Pending',
              'bg-yellow-100 text-yellow-800': node.data.status === 'Waiting',
              'bg-red-100 text-red-800': node.data.status === 'Cancelled',
            }"
          >
            {{ node.data.status }}
          </span>
        </template>
      </template>
    </Column>

    <Column field="fare" header="Fare">
      <template #body="{ node }">
        <template v-if="node.data.type === 'ride'">
          <div class="font-semibold">
            Total: RM {{ node.data.totalFare.toFixed(2) }}
          </div>
          <div class="text-xs text-gray-500">
            RM
            {{
              (node.data.totalFare / node.data.passengerCount).toFixed(2)
            }}
            per passenger
            <span v-if="node.data.passengerCount > 1"
              >({{ node.data.passengerCount }} passengers)</span
            >
          </div>
        </template>
        <template v-else>
          <span v-if="node.data.status !== 'Cancelled'">
            RM {{ node.data.fare.toFixed(2) }}
          </span>
          <span v-else class="text-gray-400"> RM 0.00 (Cancelled) </span>
        </template>
      </template>
    </Column>

    <Column header="Actions">
      <template #body="{ node }">
        <template v-if="node.data.type === 'passenger'">
          <div class="flex space-x-1">
            <Button
              icon="pi pi-eye"
              class="p-button-rounded p-button-text p-button-sm text-[#330b4f]"
              @click="onViewDetails(node.data.id)"
              tooltip="View details"
              tooltipOptions="top"
            />
            <Button
              v-if="node.data.status === 'Pending'"
              icon="pi pi-check"
              class="p-button-rounded p-button-text p-button-sm text-green-600"
              @click="onConfirmBooking(node.data.id)"
              tooltip="Confirm booking"
              tooltipOptions="top"
            />
            <Button
              v-if="['Pending', 'Waiting'].includes(node.data.status)"
              icon="pi pi-times"
              class="p-button-rounded p-button-text p-button-sm text-red-600"
              @click="onCancelBooking(node.data.id)"
              tooltip="Cancel booking"
              tooltipOptions="top"
            />
          </div>
        </template>
      </template>
    </Column>
  </TreeTable>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import TreeTable from "primevue/treetable";
import Column from "primevue/column";
import Button from "primevue/button";

// Props
const props = defineProps({
  treeTableData: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["view-details", "confirm-booking", "cancel-booking"]);

// Helper functions
const getInitials = (name) => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

// Event handlers
const onViewDetails = (bookingId) => {
  emit("view-details", bookingId);
};

const onConfirmBooking = (bookingId) => {
  emit("confirm-booking", bookingId);
};

const onCancelBooking = (bookingId) => {
  emit("cancel-booking", bookingId);
};
</script>

<style scoped>
:deep(.p-treetable .p-treetable-thead > tr > th) {
  background-color: #f5f0fa;
  color: #330b4f;
  font-weight: 600;
}

:deep(.p-treetable .p-treetable-tbody > tr) {
  background-color: white;
}

:deep(.p-treetable .p-treetable-tbody > tr > td) {
  padding: 0.75rem 1rem;
}

:deep(.p-treetable .p-treetable-tbody > tr.p-highlight) {
  background-color: #f5f0fa;
}

:deep(.p-treetable .p-treetable-tbody > tr > td .p-row-toggler) {
  color: #330b4f;
}

:deep(.p-treetable .p-treetable-tbody > tr > td .p-row-toggler:hover) {
  color: #4a1772;
}
</style>
