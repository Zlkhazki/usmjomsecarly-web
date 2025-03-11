<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <AppSidebar ref="sidebar" class="sticky left-0 h-full" />
    <div class="flex flex-col flex-1 overflow-auto">
      <AppHeader class="h-16 shadow shrink-0" @toggle-sidebar="toggleSidebar" />
      <div class="flex-1 p-4 overflow-auto">
        <Toast />
        <div class="w-full h-full">
          <div class="px-6 py-4">
            <h1 class="text-2xl font-bold text-[#330b4f] mb-6">Ride Management</h1>

            <!-- Rides Table -->
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
                        placeholder="Search rides..." 
                        class="p-inputtext-sm border-[#dec9f9] focus:border-[#330b4f] w-full pl-8"
                        @input="onSearch"
                      />
                    </span>
                  </div>
                </div>
              </div>
              
              <DataTable 
                :value="filteredRides" 
                v-model:filters="dtFilters"
                filterDisplay="menu"
                :paginator="true" 
                :rows="10"
                :rowsPerPageOptions="[10, 20, 50]"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} rides"
                responsiveLayout="scroll"
                dataKey="id"
                :loading="loading"
                stripedRows
                class="p-datatable-lg">

                <Column field="id" header="Ride ID" sortable></Column>
                <Column field="date" header="Date" sortable>
                  <template #body="{ data }">
                    {{ new Date(data.date).toLocaleDateString() }}
                  </template>
                </Column>
                <Column field="driver.name" header="Driver" sortable>
                  <template #body="{ data }">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-2">
                        {{ getInitials(data.driver.name) }}
                      </div>
                      {{ data.driver.name }}
                    </div>
                  </template>
                </Column>
                <Column field="pickup" header="Pickup" sortable></Column>
                <Column field="destination" header="Destination" sortable></Column>
                <Column field="status" header="Status" sortable>
                  <template #body="{ data }">
                    <span :class="{
                      'px-2 py-1 rounded text-sm': true,
                      'bg-green-100 text-green-800': data.status === 'Completed',
                      'bg-blue-100 text-blue-800': data.status === 'Active',
                      'bg-yellow-100 text-yellow-800': data.status === 'Scheduled',
                      'bg-red-100 text-red-800': data.status === 'Cancelled'
                    }">
                      {{ data.status }}
                    </span>
                  </template>
                </Column>
                <Column field="totalFare" header="Total Fare" sortable>
                  <template #body="{ data }">
                    RM {{ data.totalFare.toFixed(2) }}
                  </template>
                </Column>
                <Column header="Actions">
                  <template #body="{ data }">
                    <div class="flex space-x-1">
                      <Button 
                        icon="pi pi-eye" 
                        class="p-button-rounded p-button-text p-button-sm text-[#330b4f]"
                        @click="viewRideDetails(data)"
                        tooltip="View details"
                        tooltipOptions="top"
                      />
                      <Button 
                        v-if="data.status === 'Scheduled'"
                        icon="pi pi-times"
                        class="p-button-rounded p-button-text p-button-sm text-red-600"
                        @click="cancelRide(data)"
                        tooltip="Cancel ride"
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

    <!-- Ride Details Dialog -->
    <Dialog v-model:visible="rideDetailsDialog" :style="{ width: '80%' }" header="Ride Details" :modal="true" class="p-dialog-custom">
      <div v-if="selectedRide" class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-[#f5f0fa] rounded-lg">
            <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">Ride Information</h3>
            <div class="grid grid-cols-2 gap-2">
              <div class="text-sm text-gray-500">Ride ID:</div>
              <div>{{ selectedRide.id }}</div>
              <div class="text-sm text-gray-500">Date:</div>
              <div>{{ new Date(selectedRide.date).toLocaleString() }}</div>
              <div class="text-sm text-gray-500">Status:</div>
              <div>
                <span :class="{
                  'px-2 py-1 rounded text-sm': true,
                  'bg-green-100 text-green-800': selectedRide.status === 'Completed',
                  'bg-blue-100 text-blue-800': selectedRide.status === 'Active',
                  'bg-yellow-100 text-yellow-800': selectedRide.status === 'Scheduled',
                  'bg-red-100 text-red-800': selectedRide.status === 'Cancelled'
                }">
                  {{ selectedRide.status }}
                </span>
              </div>
              <div class="text-sm text-gray-500">Total Fare:</div>
              <div class="font-semibold">RM {{ selectedRide.totalFare.toFixed(2) }}</div>
            </div>
          </div>

          <div class="p-4 bg-[#f5f0fa] rounded-lg">
            <h3 class="text-lg font-semibold mb-2 text-[#330b4f]">Route Information</h3>
            <div class="grid grid-cols-2 gap-2">
              <div class="text-sm text-gray-500">Pickup Location:</div>
              <div>{{ selectedRide.pickup }}</div>
              <div class="text-sm text-gray-500">Destination:</div>
              <div>{{ selectedRide.destination }}</div>
              <div class="text-sm text-gray-500">Distance:</div>
              <div>{{ selectedRide.distance }} km</div>
              <div class="text-sm text-gray-500">Duration:</div>
              <div>{{ selectedRide.duration }} minutes</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-[#f5f0fa] rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-lg font-semibold text-[#330b4f]">Driver Information</h3>
            </div>
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-3">
                {{ getInitials(selectedRide.driver.name) }}
              </div>
              <div>
                <div class="font-medium">{{ selectedRide.driver.name }}</div>
                <div class="text-sm text-gray-500">{{ selectedRide.driver.phone }}</div>
                <div class="flex items-center mt-1">
                  <i class="pi pi-star-fill text-yellow-400 text-xs mr-1"></i>
                  <span class="text-sm">{{ selectedRide.driver.rating }} ({{ selectedRide.driver.ratingCount }} ratings)</span>
                </div>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-sm text-gray-500">Vehicle:</div>
              <div>{{ selectedRide.driver.vehicle.make }} {{ selectedRide.driver.vehicle.model }} ({{ selectedRide.driver.vehicle.color }}) - {{ selectedRide.driver.vehicle.plateNumber }}</div>
            </div>
          </div>

          <div class="p-4 bg-[#f5f0fa] rounded-lg">
            <h3 class="text-lg font-semibold mb-3 text-[#330b4f]">Payment Summary</h3>
            <div class="mb-3">
              <div class="flex justify-between mb-1">
                <span>Base fare:</span>
                <span>RM {{ selectedRide.baseFare.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between mb-1">
                <span>Distance charge:</span>
                <span>RM {{ selectedRide.distanceCharge.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between mb-1">
                <span>Service fee:</span>
                <span>RM {{ selectedRide.serviceFee.toFixed(2) }}</span>
              </div>
              <Divider />
              <div class="flex justify-between font-bold">
                <span>Total fare:</span>
                <span>RM {{ selectedRide.totalFare.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#f5f0fa] rounded-lg">
          <h3 class="text-lg font-semibold mb-3 text-[#330b4f]">Passengers ({{ selectedRide.passengers.length }})</h3>
          
          <DataTable :value="selectedRide.passengers" responsiveLayout="scroll" class="p-datatable-sm">
            <Column field="name" header="Name">
              <template #body="{ data }">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-[#dec9f9] flex items-center justify-center text-[#330b4f] font-semibold mr-2">
                    {{ getInitials(data.name) }}
                  </div>
                  <span>{{ data.name }}</span>
                </div>
              </template>
            </Column>
            <Column field="phone" header="Phone"></Column>
            <Column field="fare" header="Individual Fare">
              <template #body="{ data }">
                RM {{ data.fare.toFixed(2) }}
              </template>
            </Column>
            <Column field="paymentStatus" header="Payment Status">
              <template #body="{ data }">
                <span :class="{
                  'px-2 py-1 rounded text-sm': true,
                  'bg-green-100 text-green-800': data.paymentStatus === 'Paid',
                  'bg-yellow-100 text-yellow-800': data.paymentStatus === 'Pending'
                }">
                  {{ data.paymentStatus }}
                </span>
              </template>
            </Column>
            <Column field="paymentMethod" header="Payment Method"></Column>
          </DataTable>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppHeader from '../components/AppHeader.vue';
import TabMenu from 'primevue/tabmenu';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Avatar from 'primevue/avatar';
import Divider from 'primevue/divider';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

// Component state
const sidebar = ref(null);
const toast = useToast();
const activeTabIndex = ref(0);
const rides = ref([]);
const completedRides = ref([]);
const loading = ref(false);
const selectedRide = ref(null);
const rideDetailsDialog = ref(false);

// Filters
const filters = reactive({
  dateRange: null,
  search: ''
});

// DataTable filters - Updated to match UserPage approach
const dtFilters = ref({
  global: { value: null, matchMode: 'contains' },
  'driver.name': { value: null, matchMode: 'contains' }
});

// Tab menu
const tabs = [
  { label: 'All Rides', icon: 'pi pi-fw pi-car' },
  { label: 'Completed Rides', icon: 'pi pi-fw pi-check-circle' },
  { label: 'Active Rides', icon: 'pi pi-fw pi-clock' },
  { label: 'Cancelled Rides', icon: 'pi pi-fw pi-times-circle' },
];

// Helper functions
const getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

const getStatusSeverity = (status) => {
  switch (status) {
    case 'Completed': return 'success';
    case 'Active': return 'info';
    case 'Scheduled': return 'warning';
    case 'Cancelled': return 'danger';
    default: return null;
  }
};

// Methods
const searchRides = () => {
  loading.value = true;
  
  // Update dtFilters based on the filters object
  if (filters.search) {
    dtFilters.value.global.value = filters.search;
  } else {
    dtFilters.value.global.value = null;
  }
  
  // In a real app, you would call your API here with the filters
  fetchRides();
};

const resetFilters = () => {
  filters.dateRange = null;
  filters.search = '';
  
  // Reset dtFilters as well
  dtFilters.value.global.value = null;
  dtFilters.value['driver.name'].value = null;
  
  searchRides();
};

const viewRideDetails = (ride) => {
  selectedRide.value = ride;
  rideDetailsDialog.value = true;
};

const onDateSelect = () => {
  // Here you would normally filter by date range
  // For this demo, we'll just refresh the data
  fetchRides();
};

const onSearch = () => {
  dtFilters.value.global.value = filters.search;
};

// Mock data fetching - replace with actual API calls
const fetchRides = () => {
  loading.value = true;
  
  setTimeout(() => {
    rides.value = generateMockRides(20);
    loading.value = false;
  }, 500);
};

// Generate mock data for demo purposes
function generateMockRides(count) {
  const mockRides = [];
  const statuses = ['Completed', 'Active', 'Scheduled', 'Cancelled'];
  const pickupLocations = ['USM Main Campus', 'Engineering Campus', 'USM Health Campus', 'Penang Airport', 'Bayan Lepas', 'Georgetown', 'Butterworth', 'Gelugor', 'Sungai Dua', 'Bukit Jambul'];
  const destinations = ['USM Main Campus', 'Engineering Campus', 'USM Health Campus', 'Penang Airport', 'Bayan Lepas', 'Georgetown', 'Butterworth', 'Gelugor', 'Sungai Dua', 'Bukit Jambul'];
  const drivers = [
    { id: 1, name: 'Ahmad Bin Abdullah', phone: '012-3456789', avatar: null, rating: 4.8, ratingCount: 152, vehicle: { make: 'Toyota', model: 'Vios', color: 'Silver', plateNumber: 'WXY 1234' } },
    { id: 2, name: 'Tan Wei Ming', phone: '019-8765432', avatar: null, rating: 4.6, ratingCount: 98, vehicle: { make: 'Honda', model: 'City', color: 'White', plateNumber: 'PQR 5678' } },
    { id: 3, name: 'Kavitha A/L Raj', phone: '017-2345678', avatar: null, rating: 4.9, ratingCount: 205, vehicle: { make: 'Perodua', model: 'Myvi', color: 'Blue', plateNumber: 'ABC 9012' } }
  ];
  
  const passengers = [
    { id: 1, name: 'Liu Yan', phone: '016-7890123', avatar: null, fare: 0, paymentStatus: 'Paid', paymentMethod: 'DuitNow' },
    { id: 2, name: 'Muthu Kumar', phone: '013-4567890', avatar: null, fare: 0, paymentStatus: 'Paid', paymentMethod: 'Cash' },
    { id: 3, name: 'Sarah Tan', phone: '014-5678901', avatar: null, fare: 0, paymentStatus: 'Pending', paymentMethod: 'DuitNow' },
    { id: 4, name: 'Muhammad Imran', phone: '019-6789012', avatar: null, fare: 0, paymentStatus: 'Paid', paymentMethod: 'DuitNow' },
    { id: 5, name: 'Lee Wei Jian', phone: '012-7890123', avatar: null, fare: 0, paymentStatus: 'Paid', paymentMethod: 'DuitNow' }
  ];

  for (let i = 1; i <= count; i++) {
    // Generate a random date within the last month
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const pickup = pickupLocations[Math.floor(Math.random() * pickupLocations.length)];
    let destination;
    
    // Make sure destination is not the same as pickup
    do {
      destination = destinations[Math.floor(Math.random() * destinations.length)];
    } while (destination === pickup);
    
    // Random distance between 5 to 30 km
    const distance = (5 + Math.random() * 25).toFixed(1);
    
    // Calculate fare components
    const baseFare = 5;
    const distanceCharge = parseFloat(distance) * 1.5; // RM 1.5 per km
    const serviceFee = 2;
    const totalFare = baseFare + distanceCharge + serviceFee;
    
    // Duration is roughly 3 min per km
    const duration = Math.round(parseFloat(distance) * 3);
    
    // Select a random driver
    const driver = { ...drivers[Math.floor(Math.random() * drivers.length)] };
    
    // Select 1-4 random passengers
    const numPassengers = 1 + Math.floor(Math.random() * 4);
    const ridePassengers = [];
    
    // Create a shuffled copy of passengers array
    const shuffledPassengers = [...passengers].sort(() => 0.5 - Math.random());
    
    for (let j = 0; j < numPassengers; j++) {
      if (j < shuffledPassengers.length) {
        // Calculate individual fare (evenly split, rounded to 2 decimals)
        const individualFare = parseFloat((totalFare / numPassengers).toFixed(2));
        
        // Add the passenger with their fare
        ridePassengers.push({
          ...shuffledPassengers[j],
          fare: individualFare,
          // For completed rides, most payments should be marked as paid
          paymentStatus: status === 'Completed' ? 
            (Math.random() > 0.1 ? 'Paid' : 'Pending') : 
            (Math.random() > 0.5 ? 'Paid' : 'Pending')
        });
      }
    }
    
    mockRides.push({
      id: 'R' + String(i).padStart(6, '0'),
      date: date,
      status: status,
      pickup: pickup,
      destination: destination,
      distance: distance,
      duration: duration,
      baseFare: baseFare,
      distanceCharge: distanceCharge,
      serviceFee: serviceFee,
      totalFare: totalFare,
      driver: driver,
      passengers: ridePassengers
    });
  }
  
  return mockRides;
}

// Computed property for filtered rides
const filteredRides = computed(() => {
  if (activeTabIndex.value === 0) {
    return rides.value;
  } else if (activeTabIndex.value === 1) {
    return rides.value.filter(ride => ride.status === 'Completed');
  } else if (activeTabIndex.value === 2) {
    return rides.value.filter(ride => ride.status === 'Active');
  } else if (activeTabIndex.value === 3) {
    return rides.value.filter(ride => ride.status === 'Cancelled');
  }
  return rides.value;
});

// Lifecycle hooks
onMounted(() => {
  fetchRides();
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

:deep(.p-tabmenu .p-tabmenu-nav .p-tabmenuitem.p-highlight .p-menuitem-link) {
  background-color: #f5f0fa;
  color: #330b4f;
  border-color: #330b4f;
}

:deep(.p-tabmenu .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link:not(.p-disabled):focus) {
  box-shadow: 0 0 0 1px #dec9f9;
}

:deep(.p-calendar) {
  width: 100%;
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
</style>