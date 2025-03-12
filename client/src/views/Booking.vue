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
            <h1 class="text-2xl font-bold text-[#330b4f] mb-6">Booking Management</h1>

            <!-- Bookings Table -->
            <div class="card bg-white rounded-lg shadow">
              <div class="p-4 border-b border-gray-200">
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
                          'bg-[#330b4f] text-white hover:bg-[#4a1772]': activeTabIndex === index,
                          'p-button-outlined text-[#330b4f] hover:bg-[#f5f0fa]': activeTabIndex !== index
                        }"
                        @click="activeTabIndex = index"
                      />
                    </div>
                  </div>

                  <!-- Search and Filter -->
                  <div class="flex space-x-2 flex-wrap gap-2">
                    <span class="p-input-icon-left inline-block" style="min-width: 250px;">
                      <i class="pi pi-calendar" style="left: 0.75rem;"/>
                      <Calendar 
                        v-model="filters.dateRange" 
                        selectionMode="range" 
                        placeholder="Select date range..." 
                        class="p-inputtext-sm border-[#dec9f9] focus:border-[#330b4f] w-full pl-8"
                        @date-select="onDateSelect"
                      />
                    </span>
                    <span class="p-input-icon-left inline-block" style="min-width: 250px;">
                      <i class="pi pi-search" style="left: 0.75rem;"/>
                      <InputText 
                        v-model="filters.search" 
                        placeholder="Search bookings..." 
                        class="p-inputtext-sm border-[#dec9f9] focus:border-[#330b4f] w-full pl-8"
                        @input="onSearch"
                      />
                    </span>
                  </div>
                </div>
              </div>
              
              <TreeTable
                :value="treeTableData"
                :paginator="true"
                :rows="10"
                :rowsPerPageOptions="[10, 20, 50]"
                :loading="loading"
                class="p-treetable-lg">
                
                <Column field="id" header="ID" :expander="true">
                  <template #body="{ node }">
                    <span :class="{'font-semibold': node.data.type === 'ride'}">
                      {{ node.data.id }}
                    </span>
                  </template>
                </Column>
      
                <Column field="name" header="Name">
                  <template #body="{ node }">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-2">
                        {{ getInitials(node.data.name) }}
                      </div>
                      <div class="flex-1">
                        <div>{{ node.data.name }}</div>
                        <div v-if="node.data.type === 'passenger'" class="text-xs text-gray-500">
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
                      <div class="text-xs text-gray-500">{{ node.data.plateNumber }}</div>
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
                      <span :class="{
                        'px-2 py-1 rounded text-sm': true,
                        'bg-green-100 text-green-800': node.data.status === 'Confirmed',
                        'bg-blue-100 text-blue-800': node.data.status === 'Pending',
                        'bg-yellow-100 text-yellow-800': node.data.status === 'Waiting',
                        'bg-red-100 text-red-800': node.data.status === 'Cancelled'
                      }">
                        {{ node.data.status }}
                      </span>
                    </template>
                  </template>
                </Column>
      
                <Column field="fare" header="Fare">
                  <template #body="{ node }">
                    <template v-if="node.data.type === 'ride'">
                      <div class="font-semibold">Total: RM {{ node.data.totalFare.toFixed(2) }}</div>
                    </template>
                    <template v-else>
                      RM {{ node.data.fare.toFixed(2) }}
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
                          @click="viewBookingDetails(findBookingById(node.data.id))"
                          tooltip="View details"
                          tooltipOptions="top"
                        />
                        <Button 
                          v-if="node.data.status === 'Pending'"
                          icon="pi pi-check"
                          class="p-button-rounded p-button-text p-button-sm text-green-600"
                          @click="confirmBooking(findBookingById(node.data.id))"
                          tooltip="Confirm booking"
                          tooltipOptions="top"
                        />
                        <Button 
                          v-if="['Pending', 'Waiting'].includes(node.data.status)"
                          icon="pi pi-times"
                          class="p-button-rounded p-button-text p-button-sm text-red-600"
                          @click="cancelBooking(findBookingById(node.data.id))"
                          tooltip="Cancel booking"
                          tooltipOptions="top"
                        />
                      </div>
                    </template>
                  </template>
                </Column>
              </TreeTable>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Details Dialog -->
    <Dialog v-model:visible="bookingDetailsDialog" :style="{ width: '80%' }" header="Booking Details" :modal="true" class="p-dialog-custom">
      <div v-if="selectedBooking" class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-[#f5f0fa] rounded-lg">
            <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">Booking Information</h3>
            <div class="grid grid-cols-2 gap-2">
              <div class="text-sm text-gray-500">Booking ID:</div>
              <div>{{ selectedBooking.id }}</div>
              <div class="text-sm text-gray-500">Date:</div>
              <div>{{ new Date(selectedBooking.date).toLocaleString() }}</div>
              <div class="text-sm text-gray-500">Status:</div>
              <div>
                <span :class="{
                  'px-2 py-1 rounded text-sm': true,
                  'bg-green-100 text-green-800': selectedBooking.status === 'Confirmed',
                  'bg-blue-100 text-blue-800': selectedBooking.status === 'Pending',
                  'bg-yellow-100 text-yellow-800': selectedBooking.status === 'Waiting',
                  'bg-red-100 text-red-800': selectedBooking.status === 'Cancelled'
                }">
                  {{ selectedBooking.status }}
                </span>
              </div>
              <div class="text-sm text-gray-500">Seat Number:</div>
              <div>{{ selectedBooking.seatNumber }}</div>
              <div class="text-sm text-gray-500">Fare:</div>
              <div class="font-semibold">RM {{ selectedBooking.fare.toFixed(2) }}</div>
              <div class="text-sm text-gray-500">Payment Status:</div>
              <div>
                <span :class="{
                  'px-2 py-1 rounded text-sm': true,
                  'bg-green-100 text-green-800': selectedBooking.paymentStatus === 'Paid',
                  'bg-yellow-100 text-yellow-800': selectedBooking.paymentStatus === 'Pending'
                }">
                  {{ selectedBooking.paymentStatus || 'Pending' }}
                </span>
              </div>
              <div class="text-sm text-gray-500">Payment Method:</div>
              <div>{{ selectedBooking.paymentMethod || 'Not specified' }}</div>
            </div>
          </div>

          <div class="p-4 bg-[#f5f0fa] rounded-lg">
            <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">Route Information</h3>
            <div class="grid grid-cols-2 gap-2">
              <div class="text-sm text-gray-500">Pickup Location:</div>
              <div>{{ selectedBooking.pickup }}</div>
              <div class="text-sm text-gray-500">Destination:</div>
              <div>{{ selectedBooking.destination }}</div>
              <div class="text-sm text-gray-500">Pickup Time:</div>
              <div>{{ new Date(selectedBooking.pickupTime).toLocaleTimeString() }}</div>
              <div class="text-sm text-gray-500">Distance:</div>
              <div>{{ selectedBooking.distance || 'Not calculated' }} km</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-[#f5f0fa] rounded-lg">
            <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">Passenger Information</h3>
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-3">
                {{ getInitials(selectedBooking.passenger.name) }}
              </div>
              <div>
                <div class="font-medium">{{ selectedBooking.passenger.name }}</div>
                <div class="text-sm text-gray-500">{{ selectedBooking.passenger.phone }}</div>
                <div class="text-sm text-gray-500">{{ selectedBooking.passenger.email }}</div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-[#f5f0fa] rounded-lg">
            <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">Driver Information</h3>
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-3">
                {{ getInitials(selectedBooking.driver.name) }}
              </div>
              <div>
                <div class="font-medium">{{ selectedBooking.driver.name }}</div>
                <div class="text-sm text-gray-500">{{ selectedBooking.driver.phone }}</div>
                <div class="flex items-center mt-1">
                  <i class="pi pi-star-fill text-yellow-400 text-xs mr-1"></i>
                  <span class="text-sm">{{ selectedBooking.driver.rating }} ({{ selectedBooking.driver.totalRides }} rides)</span>
                </div>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-sm text-gray-500">Vehicle:</div>
              <div>{{ selectedBooking.driver.vehicle.make }} {{ selectedBooking.driver.vehicle.model }} ({{ selectedBooking.driver.vehicle.plateNumber }})</div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#f5f0fa] rounded-lg mt-4" v-if="selectedBooking.status !== 'Pending'">
          <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">Admin Actions</h3>
          <div class="flex gap-3">
            <Button 
              v-if="selectedBooking.status === 'Waiting'" 
              label="Mark as Confirmed" 
              icon="pi pi-check"
              class="p-button-success"
              @click="confirmBooking(selectedBooking)"
            />
            <Button 
              v-if="selectedBooking.status === 'Waiting' || selectedBooking.status === 'Confirmed'" 
              label="Cancel Booking" 
              icon="pi pi-times"
              class="p-button-danger"
              @click="cancelBooking(selectedBooking)"
            />
            <Button 
              v-if="selectedBooking.paymentStatus !== 'Paid'" 
              label="Mark as Paid" 
              icon="pi pi-credit-card"
              class="p-button-info"
              @click="markAsPaid(selectedBooking)"
            />
            <Button 
              label="Contact Passenger" 
              icon="pi pi-envelope"
              class="p-button-secondary"
              @click="contactPassenger(selectedBooking)"
            />
          </div>
        </div>
      </div>
    </Dialog>
  </div>

  <OverlayPanel ref="passengersList" class="w-80">
    <template v-if="selectedRide">
      <div class="p-3">
        <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">
          Ride Details
        </h3>
        <div class="mb-3">
          <div class="text-sm text-gray-600">{{ new Date(selectedRide.date).toLocaleDateString() }} at {{ new Date(selectedRide.pickupTime).toLocaleTimeString() }}</div>
          <div class="text-sm font-medium">{{ selectedRide.pickup }} → {{ selectedRide.destination }}</div>
        </div>
        
        <Divider />
        
        <h4 class="font-medium mb-2">Passengers ({{ selectedRide.bookings.length }})</h4>
        <div class="space-y-2">
          <div v-for="booking in selectedRide.bookings" :key="booking.id" 
               class="flex items-center p-2 rounded hover:bg-gray-50">
            <div class="w-8 h-8 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-2">
              {{ getInitials(booking.passenger.name) }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">{{ booking.passenger.name }}</div>
              <div class="text-xs text-gray-500">Seat {{ booking.seatNumber }}</div>
            </div>
            <span :class="{
              'px-2 py-1 rounded text-xs': true,
              'bg-green-100 text-green-800': booking.status === 'Confirmed',
              'bg-blue-100 text-blue-800': booking.status === 'Pending',
              'bg-yellow-100 text-yellow-800': booking.status === 'Waiting',
              'bg-red-100 text-red-800': booking.status === 'Cancelled'
            }">
              {{ booking.status }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </OverlayPanel>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppHeader from '../components/AppHeader.vue';
import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import TreeTable from 'primevue/treetable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import OverlayPanel from 'primevue/overlaypanel';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

// Component state
const sidebar = ref(null);
const toast = useToast();
const confirm = useConfirm();
const activeTabIndex = ref(0);
const bookings = ref([]);
const treeTableData = ref([]);
const loading = ref(false);
const selectedBooking = ref(null);
const bookingDetailsDialog = ref(false);
const passengersList = ref(null);
const selectedRide = ref(null);

// Filters
const filters = reactive({
  dateRange: null,
  search: ''
});

// DataTable filters
const dtFilters = ref({
  global: { value: null, matchMode: 'contains' },
  'passenger.name': { value: null, matchMode: 'contains' },
  'driver.name': { value: null, matchMode: 'contains' }
});

// Tab menu
const tabs = [
  { label: 'All Bookings', icon: 'pi pi-fw pi-ticket' },
  { label: 'Confirmed', icon: 'pi pi-fw pi-check-circle' },
  { label: 'Pending', icon: 'pi pi-fw pi-clock' },
  { label: 'Cancelled', icon: 'pi pi-fw pi-times-circle' }
];

// Helper functions
const getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

// Methods
const viewBookingDetails = (booking) => {
  selectedBooking.value = booking;
  bookingDetailsDialog.value = true;
};

const confirmBooking = (booking) => {
  confirm.require({
    message: `Are you sure you want to confirm booking ${booking.id}?`,
    header: 'Confirm Action',
    icon: 'pi pi-check-circle',
    accept: () => {
      // In a real app, you would call your API here
      toast.add({
        severity: 'success',
        summary: 'Booking Confirmed',
        detail: `Booking ${booking.id} has been confirmed`,
        life: 3000
      });
      
      // Update booking status locally
      booking.status = 'Confirmed';
      
      // Close dialog if it's open
      if (bookingDetailsDialog.value) {
        bookingDetailsDialog.value = false;
      }
    }
  });
};

const cancelBooking = (booking) => {
  confirm.require({
    message: `Are you sure you want to cancel booking ${booking.id}?`,
    header: 'Confirm Cancellation',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      // In a real app, you would call your API here
      toast.add({
        severity: 'info',
        summary: 'Booking Cancelled',
        detail: `Booking ${booking.id} has been cancelled`,
        life: 3000
      });
      
      // Update booking status locally
      booking.status = 'Cancelled';
      
      // Close dialog if it's open
      if (bookingDetailsDialog.value) {
        bookingDetailsDialog.value = false;
      }
    }
  });
};

const markAsPaid = (booking) => {
  confirm.require({
    message: `Are you sure you want to mark booking ${booking.id} as paid?`,
    header: 'Confirm Payment',
    icon: 'pi pi-check-circle',
    accept: () => {
      // In a real app, you would call your API here
      toast.add({
        severity: 'success',
        summary: 'Payment Updated',
        detail: `Payment for booking ${booking.id} has been marked as paid`,
        life: 3000
      });
      
      // Update payment status locally
      booking.paymentStatus = 'Paid';
    }
  });
};

const contactPassenger = (booking) => {
  // In a real app, this would open email or messaging interface
  toast.add({
    severity: 'info',
    summary: 'Contact Initiated',
    detail: `Opening messaging interface for ${booking.passenger.name}`,
    life: 3000
  });
};

const onDateSelect = () => {
  // Here you would normally filter by date range
  fetchBookings();
};

const onSearch = () => {
  dtFilters.value.global.value = filters.search;
};

const showRidePassengers = (booking) => {
  const ride = getRideById(booking.rideId);
  if (ride) {
    selectedRide.value = ride;
    passengersList.value.toggle(event);
  }
};

const getRideById = (rideId) => {
  // In a real app, you would fetch this from your API
  // For now, we'll find it in our generated data
  const rides = bookings.value.reduce((acc, booking) => {
    if (!acc.find(r => r.id === booking.rideId)) {
      acc.push({
        id: booking.rideId,
        driver: booking.driver,
        date: booking.date,
        pickupTime: booking.pickupTime,
        pickup: booking.pickup,
        destination: booking.destination,
        bookings: bookings.value.filter(b => b.rideId === booking.rideId)
      });
    }
    return acc;
  }, []);
  
  return rides.find(r => r.id === rideId);
};

// Mock data fetching - replace with actual API calls
const fetchBookings = () => {
  loading.value = true;
  setTimeout(() => {
    const mockData = generateMockBookings(20);
    bookings.value = mockData;
    treeTableData.value = transformToTreeData(mockData);
    loading.value = false;
  }, 500);
};

// Generate mock data for demo purposes
function generateMockBookings(count) {
  const mockBookings = [];
  const statuses = ['Confirmed', 'Pending', 'Waiting', 'Cancelled'];
  const locations = ['USM Main Campus', 'Engineering Campus', 'Health Campus', 'Penang Airport', 'Georgetown', 'Bayan Lepas', 'Butterworth'];
  const paymentMethods = ['DuitNow', 'Cash', 'Credit Card', 'E-Wallet'];
  
  const drivers = [
    { 
      id: 'D001',
      name: 'Ahmad Bin Abdullah',
      phone: '012-3456789',
      rating: 4.8,
      totalRides: 152,
      vehicle: { 
        make: 'Toyota', 
        model: 'Vios', 
        plateNumber: 'WXY 1234',
        capacity: 4 
      }
    },
    { 
      id: 'D002',
      name: 'Tan Wei Ming',
      phone: '019-8765432',
      rating: 4.6,
      totalRides: 98,
      vehicle: { 
        make: 'Honda', 
        model: 'City', 
        plateNumber: 'PQR 5678',
        capacity: 4 
      }
    }
  ];

  // Generate multiple rides for each driver
  const rides = [];
  for (let i = 0; i < Math.ceil(count / 3); i++) { // Create enough rides to accommodate all bookings
    for (const driver of drivers) {
      const date = new Date();
      date.setDate(date.getDate() + Math.floor(Math.random() * 7));
      const pickupTime = new Date(date);
      pickupTime.setHours(7 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      
      const pickup = locations[Math.floor(Math.random() * locations.length)];
      let destination;
      do {
        destination = locations[Math.floor(Math.random() * locations.length)];
      } while (destination === pickup);

      rides.push({
        id: 'R' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
        driver: { ...driver }, // Clone driver object
        date: date,
        pickupTime: pickupTime,
        pickup: pickup,
        destination: destination,
        availableSeats: driver.vehicle.capacity,
        bookings: []
      });
    }
  }

  const passengers = [
    { id: 'P001', name: 'Sarah Lee', phone: '016-7890123', email: 'sarah.lee@student.usm.my' },
    { id: 'P002', name: 'Raj Kumar', phone: '013-4567890', email: 'raj.kumar@student.usm.my' },
    { id: 'P003', name: 'Nurul Aina', phone: '014-5678901', email: 'nurul.aina@student.usm.my' },
    { id: 'P004', name: 'John Doe', phone: '011-2223344', email: 'john.doe@student.usm.my' },
    { id: 'P005', name: 'Mary Jane', phone: '012-8899001', email: 'mary.jane@student.usm.my' }
  ];

  // Create bookings and assign them to rides
  for (let i = 1; i <= count; i++) {
    // Find a ride that has available seats
    const availableRides = rides.filter(ride => ride.availableSeats > 0);
    if (availableRides.length === 0) break; // Stop if no rides available
    
    const ride = availableRides[Math.floor(Math.random() * availableRides.length)];
    const passenger = passengers[Math.floor(Math.random() * passengers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const paymentStatus = status === 'Confirmed' ? 
      (Math.random() > 0.2 ? 'Paid' : 'Pending') : 
      (Math.random() > 0.7 ? 'Paid' : 'Pending');
    
    const paymentMethod = paymentStatus === 'Paid' ? 
      paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : 
      (Math.random() > 0.5 ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : null);

    const booking = {
      id: 'B' + String(i).padStart(6, '0'),
      rideId: ride.id,
      date: ride.date,
      pickupTime: ride.pickupTime,
      status: status,
      pickup: ride.pickup,
      destination: ride.destination,
      seatNumber: ride.driver.vehicle.capacity - ride.availableSeats + 1,
      fare: 15 + Math.random() * 20, // Remove toFixed here to keep it as a number
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      driver: ride.driver,
      passenger: passenger
    };

    ride.bookings.push(booking);
    ride.availableSeats--;
    mockBookings.push(booking);
  }
  
  return mockBookings;
}

// Transform bookings into tree structure
const transformToTreeData = (bookingsData) => {
  const rideMap = new Map();
  
  // First group bookings by ride
  bookingsData.forEach(booking => {
    if (!rideMap.has(booking.rideId)) {
      rideMap.set(booking.rideId, {
        key: booking.rideId,
        data: {
          id: booking.rideId,
          name: booking.driver.name,
          vehicle: `${booking.driver.vehicle.make} ${booking.driver.vehicle.model}`,
          plateNumber: booking.driver.vehicle.plateNumber,
          route: `${booking.pickup} → ${booking.destination}`,
          date: booking.date,
          totalFare: 0,
          type: 'ride'
        },
        children: []
      });
    }
    
    // Add passenger as child
    const ride = rideMap.get(booking.rideId);
    ride.children.push({
      key: booking.id,
      data: {
        id: booking.id,
        name: booking.passenger.name,
        vehicle: '',
        plateNumber: '',
        route: '',
        date: booking.date,
        status: booking.status,
        seatNumber: booking.seatNumber,
        fare: booking.fare,
        type: 'passenger'
      }
    });
    
    // Update total fare
    ride.data.totalFare += booking.fare;
  });
  
  return Array.from(rideMap.values());
};

// Computed property for filtered bookings
const filteredBookings = computed(() => {
  if (activeTabIndex.value === 0) {
    return bookings.value;
  } else if (activeTabIndex.value === 1) {
    return bookings.value.filter(booking => booking.status === 'Confirmed');
  } else if (activeTabIndex.value === 2) {
    return bookings.value.filter(booking => booking.status === 'Pending');
  } else if (activeTabIndex.value === 3) {
    return bookings.value.filter(booking => booking.status === 'Cancelled');
  }
  return bookings.value;
});

// Add helper method to find booking by ID
const findBookingById = (id) => {
  return bookings.value.find(b => b.id === id);
};

// Lifecycle hooks
onMounted(() => {
  fetchBookings();
});

const toggleSidebar = () => {
  if (sidebar.value) {
    sidebar.value.visible = true;
  }
};
</script>

<style scoped>
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

:deep(.p-input-icon-left) {
  display: inline-flex;
  align-items: center;
  position: relative;
}

:deep(.p-input-icon-left i.pi) {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

:deep(.p-input-icon-left .p-inputtext),
:deep(.p-input-icon-left .p-calendar .p-inputtext) {
  height: 2.25rem;
  padding-left: 2rem;
}

:deep(.p-calendar),
:deep(.p-inputtext) {
  height: 2.25rem;
}

:deep(.p-calendar .p-inputtext) {
  width: 100%;
}

:deep(.p-calendar .p-datepicker) {
  border-color: #dec9f9;
}

:deep(.p-calendar .p-datepicker .p-datepicker-header) {
  background: #f5f0fa;
  color: #330b4f;
}

:deep(.p-calendar .p-datepicker .p-datepicker-header button) {
  color: #330b4f;
}

:deep(.p-calendar .p-datepicker .p-datepicker-header button:hover) {
  background: #dec9f9;
}

:deep(.p-calendar .p-datepicker table td.p-datepicker-today > span) {
  background: #f5f0fa;
  color: #330b4f;
}

:deep(.p-calendar .p-datepicker table td > span.p-highlight) {
  background: #330b4f;
  color: white;
}

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