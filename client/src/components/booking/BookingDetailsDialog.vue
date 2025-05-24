<template>
  <Dialog
    v-model:visible="visible"
    :style="{ width: '80%' }"
    header="Booking Details"
    :modal="true"
    class="p-dialog-custom"
  >
    <div v-if="booking" class="p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="p-4 bg-[#f5f0fa] rounded-lg">
          <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">
            Booking Information
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <div class="text-sm text-gray-500">Booking ID:</div>
            <div>{{ booking.id }}</div>
            <div class="text-sm text-gray-500">Date:</div>
            <div>{{ new Date(booking.date).toLocaleString() }}</div>
            <div class="text-sm text-gray-500">Status:</div>
            <div>
              <span
                :class="{
                  'px-2 py-1 rounded text-sm': true,
                  'bg-green-100 text-green-800': booking.status === 'Confirmed',
                  'bg-blue-100 text-blue-800': booking.status === 'Pending',
                  'bg-yellow-100 text-yellow-800': booking.status === 'Waiting',
                  'bg-red-100 text-red-800': booking.status === 'Cancelled',
                }"
              >
                {{ booking.status }}
              </span>
            </div>
            <div class="text-sm text-gray-500">Seat Number:</div>
            <div>{{ booking.seatNumber }}</div>
            <div class="text-sm text-gray-500">Fare (per passenger):</div>
            <div class="font-semibold">RM {{ booking.fare.toFixed(2) }}</div>
            <div class="text-sm text-gray-500">Total Ride Fare:</div>
            <div class="text-sm">
              RM {{ (booking.fare * (ride?.bookings?.length || 1)).toFixed(2) }}
              <span class="text-xs text-gray-500 ml-1"
                >(Split among
                {{ ride?.bookings?.length || 1 }} passengers)</span
              >
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#f5f0fa] rounded-lg">
          <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">
            Route Information
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <div class="text-sm text-gray-500">Pickup Location:</div>
            <div>{{ booking.pickup }}</div>
            <div class="text-sm text-gray-500">Destination:</div>
            <div>{{ booking.destination }}</div>
            <div class="text-sm text-gray-500">Pickup Time:</div>
            <div>{{ new Date(booking.pickupTime).toLocaleTimeString() }}</div>
            <div class="text-sm text-gray-500">Distance:</div>
            <div>
              {{
                booking.distance !== null && booking.distance !== undefined
                  ? `${booking.distance} km`
                  : "Not calculated"
              }}
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-[#f5f0fa] rounded-lg">
          <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">
            Passenger Information
          </h3>
          <div class="flex items-center">
            <div
              class="w-12 h-12 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-3"
            >
              {{ getInitials(booking.passenger.name) }}
            </div>
            <div>
              <div class="font-medium">{{ booking.passenger.name }}</div>
              <div class="text-sm text-gray-500">
                {{ booking.passenger.phone }}
              </div>
              <div class="text-sm text-gray-500">
                {{ booking.passenger.email }}
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#f5f0fa] rounded-lg">
          <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">
            Driver Information
          </h3>
          <div class="flex items-center">
            <div
              class="w-12 h-12 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-3"
            >
              {{ getInitials(booking.driver.name) }}
            </div>
            <div>
              <div class="font-medium">{{ booking.driver.name }}</div>
              <div class="text-sm text-gray-500">
                {{ booking.driver.phone }}
              </div>
              <div class="flex items-center mt-1">
                <i class="pi pi-star-fill text-yellow-400 text-xs mr-1"></i>
                <span class="text-sm"
                  >{{ booking.driver.rating }} ({{
                    booking.driver.totalRides
                  }}
                  rides)</span
                >
              </div>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-sm text-gray-500">Vehicle:</div>
            <div>
              {{ booking.driver.vehicle.make }}
              {{ booking.driver.vehicle.model }} ({{
                booking.driver.vehicle.plateNumber
              }})
            </div>
          </div>
        </div>
      </div>

      <div
        class="p-4 bg-[#f5f0fa] rounded-lg mt-4"
        v-if="booking.status !== 'Pending'"
      >
        <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">Admin Actions</h3>
        <div class="flex gap-3">
          <Button
            v-if="booking.status === 'Waiting'"
            label="Mark as Confirmed"
            icon="pi pi-check"
            class="p-button-success"
            @click="onConfirmBooking"
          />
          <Button
            v-if="
              booking.status === 'Waiting' || booking.status === 'Confirmed'
            "
            label="Cancel Booking"
            icon="pi pi-times"
            class="p-button-danger"
            @click="onCancelBooking"
          />
          <Button
            label="Contact Passenger"
            icon="pi pi-envelope"
            class="p-button-secondary"
            @click="onContactPassenger"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";

// Props
const props = defineProps({
  booking: {
    type: Object,
    default: null,
  },
  ride: {
    type: Object,
    default: null,
  },
  isVisible: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits([
  "update:isVisible",
  "confirm-booking",
  "cancel-booking",
  "contact-passenger",
]);

// Local state
const visible = ref(props.isVisible);

// Watch for changes in isVisible prop
watch(
  () => props.isVisible,
  (newValue) => {
    visible.value = newValue;
  }
);

// Watch for changes in dialog visibility and emit events
watch(visible, (newValue) => {
  emit("update:isVisible", newValue);
});

// Helper functions
const getInitials = (name) => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

// Methods
const onConfirmBooking = () => {
  emit("confirm-booking", props.booking);
};

const onCancelBooking = () => {
  emit("cancel-booking", props.booking);
};

const onContactPassenger = () => {
  emit("contact-passenger", props.booking);
};
</script>

<style scoped>
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
