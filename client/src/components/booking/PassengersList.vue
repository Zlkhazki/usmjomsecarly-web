<template>
  <OverlayPanel ref="overlay" class="w-80">
    <template v-if="ride">
      <div class="p-3">
        <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">Ride Details</h3>
        <div class="mb-3">
          <div class="text-sm text-gray-600">
            {{ new Date(ride.date).toLocaleDateString() }} at
            {{ new Date(ride.pickupTime).toLocaleTimeString() }}
          </div>
          <div class="text-sm font-medium">
            {{ ride.pickup }} → {{ ride.destination }}
          </div>
          <div class="mt-2 text-sm">
            <div>
              <strong>Total Fare:</strong> RM
              {{ ride.totalFare.toFixed(2) }}
            </div>
            <div>
              <strong>Per Passenger:</strong> RM
              {{ ride.individualFare.toFixed(2) }}
            </div>
            <div class="text-xs text-gray-500">
              Fare is divided equally among
              {{ ride.passengerCount }} passenger(s)
            </div>
          </div>
        </div>

        <Divider />

        <h4 class="font-medium mb-2">
          Passengers ({{ ride.bookings.length }})
        </h4>
        <div class="space-y-2">
          <div
            v-for="booking in ride.bookings"
            :key="booking.id"
            class="flex items-center p-2 rounded hover:bg-gray-50"
          >
            <div
              class="w-8 h-8 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-2"
            >
              {{ getInitials(booking.passenger.name) }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">
                {{ booking.passenger.name }}
              </div>
              <div class="flex items-center">
                <div class="text-xs text-gray-500 mr-2">
                  Seat {{ booking.seatNumber }}
                </div>
                <div
                  v-if="booking.status !== 'Cancelled'"
                  class="text-xs text-gray-500"
                >
                  RM {{ booking.fare.toFixed(2) }}
                </div>
                <div v-else class="text-xs text-gray-500">RM 0.00</div>
              </div>
            </div>
            <span
              :class="{
                'px-2 py-1 rounded text-xs': true,
                'bg-green-100 text-green-800': booking.status === 'Confirmed',
                'bg-blue-100 text-blue-800': booking.status === 'Pending',
                'bg-yellow-100 text-yellow-800': booking.status === 'Waiting',
                'bg-red-100 text-red-800': booking.status === 'Cancelled',
              }"
            >
              {{ booking.status }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </OverlayPanel>
</template>

<script setup>
import { ref, defineProps, defineExpose } from "vue";
import OverlayPanel from "primevue/overlaypanel";
import Divider from "primevue/divider";

// Props
const props = defineProps({
  ride: {
    type: Object,
    default: null,
  },
});

// Refs
const overlay = ref(null);

// Helper functions
const getInitials = (name) => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

// Expose methods to parent
defineExpose({
  toggle: (event) => {
    overlay.value.toggle(event);
  },
});
</script>
