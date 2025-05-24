<template>
  <div class="flex justify-between items-center flex-wrap gap-4">
    <div class="flex items-center gap-4">
      <!-- Tab Navigation -->
      <div class="flex gap-2">
        <Button
          v-for="(tab, index) in tabs"
          :key="index"
          :icon="tab.icon"
          :label="tab.label"
          :class="{
            'p-button-sm': true,
            'bg-[#330b4f] text-white hover:bg-[#4a1772]':
              activeTabIndex === index,
            'p-button-outlined text-[#330b4f] hover:bg-[#f5f0fa]':
              activeTabIndex !== index,
          }"
          @click="$emit('tab-change', index)"
        />
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="flex space-x-2 flex-wrap gap-2">
      <span class="p-input-icon-left inline-block" style="min-width: 250px">
        <i class="pi pi-calendar" style="left: 0.75rem" />        <Calendar
          v-model="dateRange"
          selectionMode="range"
          placeholder="Select date range..."
          dateFormat="dd/mm/yy"
          class="p-inputtext-sm border-[#dec9f9] focus:border-[#330b4f] w-full pl-8"
          @date-select="onDateSelect"
        />
      </span>
      <span class="p-input-icon-left inline-block" style="min-width: 250px">
        <i class="pi pi-search" style="left: 0.75rem" />
        <InputText
          v-model="searchQuery"
          placeholder="Search bookings..."
          class="p-inputtext-sm border-[#dec9f9] focus:border-[#330b4f] w-full pl-8"
          @input="onSearch"
        />
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import Button from "primevue/button";
import Calendar from "primevue/calendar";
import InputText from "primevue/inputtext";

// Props and emits
const props = defineProps({
  initialDateRange: {
    type: Array,
    default: () => null,
  },
  initialSearch: {
    type: String,
    default: "",
  },
  activeTabIndex: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["date-select", "search", "tab-change"]);

// Reactive vars with watchers
const dateRange = ref(props.initialDateRange);
const searchQuery = ref(props.initialSearch);

watch(dateRange, (newValue) => {
  emit("date-select", newValue);
});

// Tab menu
const tabs = [
  { label: "All Bookings", icon: "pi pi-fw pi-ticket" },
  { label: "Confirmed", icon: "pi pi-fw pi-check-circle" },
  { label: "Pending", icon: "pi pi-fw pi-clock" },
  { label: "Cancelled", icon: "pi pi-fw pi-times-circle" },
];

// Methods
const onDateSelect = () => {
  emit("date-select", dateRange.value);
};

const onSearch = () => {
  emit("search", searchQuery.value);
};
</script>
