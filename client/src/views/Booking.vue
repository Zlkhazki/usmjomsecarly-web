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
              Booking Management
            </h1>

            <!-- Bookings Table -->
            <div class="card bg-white rounded-lg shadow">
              <div class="p-4 border-b border-gray-200">
                <BookingFilters
                  :active-tab-index="activeTabIndex"
                  :initial-date-range="filters.dateRange"
                  :initial-search="filters.search"
                  @tab-change="handleTabChange"
                  @date-select="handleDateSelect"
                  @search="handleSearch"
                />
              </div>

              <BookingTable
                :tree-table-data="treeTableData"
                :loading="loading"
                @view-details="viewBookingDetails"
                @confirm-booking="confirmBooking"
                @cancel-booking="cancelBooking"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Details Dialog -->
    <BookingDetailsDialog
      :booking="selectedBooking"
      :ride="selectedRide"
      :is-visible="bookingDetailsDialog"
      @update:is-visible="bookingDetailsDialog = $event"
      @confirm-booking="confirmBooking"
      @cancel-booking="cancelBooking"
      @contact-passenger="contactPassenger"
    />
  </div>

  <!-- Passengers List Overlay -->
  <PassengersList ref="passengersList" :ride="selectedRide" />
</template>

<script setup>
import { ref, onMounted, reactive, computed } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import axios from "axios";

// Import components
import AppSidebar from "../components/AppSidebar.vue";
import AppHeader from "../components/AppHeader.vue";
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";

// Import refactored components
import BookingFilters from "../components/booking/BookingFilters.vue";
import BookingTable from "../components/booking/BookingTable.vue";
import BookingDetailsDialog from "../components/booking/BookingDetailsDialog.vue";
import PassengersList from "../components/booking/PassengersList.vue";

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
  search: "",
});

// DataTable filters
const dtFilters = ref({
  global: { value: null, matchMode: "contains" },
  "passenger.name": { value: null, matchMode: "contains" },
  "driver.name": { value: null, matchMode: "contains" },
});

// Event handlers for BookingFilters component
const handleTabChange = (index) => {
  activeTabIndex.value = index;
  fetchBookings();
};

const handleDateSelect = (dateRange) => {
  filters.dateRange = dateRange;
  fetchBookings();
};

const handleSearch = (search) => {
  filters.search = search;
  dtFilters.value.global.value = search;
  fetchBookings();
};

// Tab menu
const tabs = [
  { label: "All Bookings", icon: "pi pi-fw pi-ticket" },
  { label: "Confirmed", icon: "pi pi-fw pi-check-circle" },
  { label: "Pending", icon: "pi pi-fw pi-clock" },
  { label: "Cancelled", icon: "pi pi-fw pi-times-circle" },
];

// Helper functions
const getInitials = (name) => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

// Methods
const viewBookingDetails = (bookingId) => {
  const booking = findBookingById(bookingId);
  if (booking) {
    selectedBooking.value = booking;
    selectedRide.value = getRideById(booking.rideId);
    bookingDetailsDialog.value = true;
  }
};

const confirmBooking = (booking) => {
  confirm.require({
    message: `Are you sure you want to confirm booking ${booking.id}?`,
    header: "Confirm Action",
    icon: "pi pi-check-circle",
    accept: async () => {
      try {
        // Get the authentication token from localStorage
        const token = localStorage.getItem("token");

        // Call the API to update booking status
        const response = await axios.put(
          `http://localhost:3000/api/bookings/${booking.id}/status`,
          { status: "confirmed" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          toast.add({
            severity: "success",
            summary: "Booking Confirmed",
            detail: `Booking ${booking.id} has been confirmed`,
            life: 3000,
          });

          // Update booking status locally
          booking.status = "Confirmed";

          // Refresh bookings data
          fetchBookings();

          // Close dialog if it's open
          if (bookingDetailsDialog.value) {
            bookingDetailsDialog.value = false;
          }
        } else {
          toast.add({
            severity: "error",
            summary: "Error",
            detail: response.data.message || "Failed to confirm booking",
            life: 3000,
          });
        }
      } catch (error) {
        console.error("Error confirming booking:", error);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: error.response?.data?.message || "Failed to confirm booking",
          life: 3000,
        });
      }
    },
  });
};

const cancelBooking = (booking) => {
  confirm.require({
    message: `Are you sure you want to cancel booking ${booking.id}?`,
    header: "Confirm Cancellation",
    icon: "pi pi-exclamation-triangle",
    accept: async () => {
      try {
        // Get the authentication token from localStorage
        const token = localStorage.getItem("token");

        // Call the API to update booking status
        const response = await axios.put(
          `http://localhost:3000/api/bookings/${booking.id}/status`,
          { status: "cancelled" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          toast.add({
            severity: "info",
            summary: "Booking Cancelled",
            detail: `Booking ${booking.id} has been cancelled`,
            life: 3000,
          });

          // Update booking status locally
          booking.status = "Cancelled";

          // Refresh bookings data
          fetchBookings();

          // Close dialog if it's open
          if (bookingDetailsDialog.value) {
            bookingDetailsDialog.value = false;
          }
        } else {
          toast.add({
            severity: "error",
            summary: "Error",
            detail: response.data.message || "Failed to cancel booking",
            life: 3000,
          });
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: error.response?.data?.message || "Failed to cancel booking",
          life: 3000,
        });
      }
    },
  });
};

// Payment functionality removed

const contactPassenger = (booking) => {
  // Create refs for email subject and message
  const emailSubject = ref("");
  const emailMessage = ref("");

  // Create a dialog ref
  const contactDialog = ref(false);

  // Show the dialog
  contactDialog.value = true;

  // Define send email function
  const sendEmail = async () => {
    if (!emailSubject.value || !emailMessage.value) {
      toast.add({
        severity: "warn",
        summary: "Warning",
        detail: "Please provide both subject and message",
        life: 3000,
      });
      return;
    }

    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("token");

      // Call the API to send email
      const response = await axios.post(
        `http://localhost:3000/api/bookings/${booking.id}/contact`,
        {
          subject: emailSubject.value,
          message: emailMessage.value,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.add({
          severity: "success",
          summary: "Email Sent",
          detail: `Email has been sent to ${booking.passenger.name}`,
          life: 3000,
        });
        contactDialog.value = false;
      } else {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: response.data.message || "Failed to send email",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Failed to send email",
        life: 3000,
      });
    }
  };

  // You would need a separate modal component or a more direct approach
  // For simplicity, we'll just use a simple prompt here
  const subject = prompt(
    `Subject for message to ${booking.passenger.name}:`,
    ""
  );
  const message = prompt("Message content:", "");

  if (subject && message) {
    // Call the API
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("token");

      // Call the API to send email
      axios
        .post(
          `http://localhost:3000/api/bookings/${booking.id}/contact`,
          {
            subject,
            message,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          if (response.data.success) {
            toast.add({
              severity: "success",
              summary: "Email Sent",
              detail: `Email has been sent to ${booking.passenger.name}`,
              life: 3000,
            });
          }
        })
        .catch((error) => {
          toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Failed to send email",
            life: 3000,
          });
        });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to send email",
        life: 3000,
      });
    }
  } else {
    toast.add({
      severity: "info",
      summary: "Cancelled",
      detail: "Email was not sent",
      life: 3000,
    });
  }
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
    if (!acc.find((r) => r.id === booking.rideId)) {
      const rideBookings = bookings.value.filter(
        (b) => b.rideId === booking.rideId
      );

      // Calculate the total fare as the sum of all active passengers' fares
      const activeBookings = rideBookings.filter(
        (b) => b.status !== "Cancelled"
      );
      const totalFare = activeBookings.reduce((sum, b) => sum + b.fare, 0);

      acc.push({
        id: booking.rideId,
        driver: booking.driver,
        date: booking.date,
        pickupTime: booking.pickupTime,
        pickup: booking.pickup,
        destination: booking.destination,
        totalFare: totalFare,
        passengerCount: activeBookings.length,
        individualFare:
          activeBookings.length > 0 ? totalFare / activeBookings.length : 0,
        bookings: rideBookings,
      });
    }
    return acc;
  }, []);

  return rides.find((r) => r.id === rideId);
};

// Fetch bookings from the API
const fetchBookings = async () => {
  loading.value = true;
  try {
    // Prepare query parameters
    let queryParams = new URLSearchParams();

    // Add date range filter if selected
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = new Date(filters.dateRange[0])
        .toISOString()
        .split("T")[0];
      const endDate = new Date(filters.dateRange[1])
        .toISOString()
        .split("T")[0];
      queryParams.append("startDate", startDate);
      queryParams.append("endDate", endDate);
    }

    // Add status filter based on active tab
    if (activeTabIndex.value === 1) {
      queryParams.append("status", "confirmed");
    } else if (activeTabIndex.value === 2) {
      queryParams.append("status", "pending");
    } else if (activeTabIndex.value === 3) {
      queryParams.append("status", "cancelled");
    }

    // Add search query if provided
    if (filters.search) {
      queryParams.append("search", filters.search);
    }

    // Get the authentication token from localStorage
    const token = localStorage.getItem("token");

    // Make the API request
    const response = await axios.get(
      `http://localhost:3000/api/bookings?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      // Format the bookings data
      const bookingsData = response.data.bookings || [];      if (bookingsData.length === 0) {
        console.log("No bookings data found");
        bookings.value = [];
        treeTableData.value = [];
        toast.add({
          severity: "info",
          summary: "No Bookings",
          detail: "No booking records found with the current filters",
          life: 3000,
        });
      } else {
        const formattedBookings = bookingsData
          .map((booking) => formatBookingFromApi(booking))
          .filter((booking) => booking !== null); // Filter out any null results
        bookings.value = formattedBookings;
        treeTableData.value = transformToTreeData(formattedBookings);
      }
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch bookings",
        life: 3000,
      });      // Set empty data when API call fails
      bookings.value = [];
      treeTableData.value = [];
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.response?.data?.message || "Failed to fetch bookings",
      life: 3000,
    });    // Set empty data when API call throws an error
    bookings.value = [];
    treeTableData.value = [];
  } finally {
    loading.value = false;
  }
};

// Format booking data from API response
const formatBookingFromApi = (apiBooking) => {
  // Check if the booking has the required properties
  if (!apiBooking || !apiBooking.id) {
    console.error("Invalid booking data:", apiBooking);
    return null;
  }

  // Safely access nested properties
  const ride = apiBooking.rides || {};
  const passenger = apiBooking.users || {};
  const driver = ride.users || {};

  // Get the distributed fare from the API response or calculate it
  const distributedFare =
    apiBooking.distributed_fare ||
    (ride.total_fare ? ride.total_fare / 1 : ride.price || 0);
  return {
    id: apiBooking.id,
    rideId: ride.id || "N/A",
    date: ride.date ? new Date(ride.date) : new Date(),
    pickupTime:
      ride.date && ride.time
        ? `${ride.date}T${ride.time}`
        : new Date().toISOString(),
    status: capitalize(apiBooking.status || "pending"),
    pickup: ride.pickup_address || "Not specified",
    destination: ride.drop_address || "Not specified",
    seatNumber: apiBooking.seat_number || 1,
    fare: distributedFare, // Use the distributed fare instead of the total price
    distance: ride.distance || 0,
    driver: {
      id: driver.id || "N/A",
      name: driver.name || "Unknown Driver",
      phone: driver.phone_number || "N/A",
      email: driver.email || "N/A",
      rating: driver.rating || 4.5,
      totalRides: driver.total_rides || 0,
      vehicle: {
        make: driver.car_model
          ? driver.car_model.split(" ")[0] || "Unknown"
          : "Unknown",
        model: driver.car_model
          ? driver.car_model.split(" ").slice(1).join(" ") || "Vehicle"
          : "Vehicle",
        plateNumber: driver.plate_number || "N/A",
        capacity: ride.seats || 4,
      },
    },
    passenger: {
      id: passenger.id || "N/A",
      name: passenger.name || "Unknown Passenger",
      phone: passenger.phone_number || "N/A",
      email: passenger.email || "N/A",
    },
  };
};

// Helper function to capitalize first letter
const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Transform bookings into tree structure
const transformToTreeData = (bookingsData) => {
  const rideMap = new Map();

  // Filter out null or invalid bookings
  const validBookings = bookingsData.filter(
    (booking) => booking && booking.id && booking.rideId
  );

  // Group bookings by ride and count active passengers per ride
  const ridePassengerCounts = validBookings.reduce((acc, booking) => {
    if (!acc[booking.rideId]) {
      acc[booking.rideId] = 0;
    }
    // Only count non-cancelled bookings
    if (booking.status !== "Cancelled") {
      acc[booking.rideId]++;
    }
    return acc;
  }, {});

  // First group bookings by ride
  validBookings.forEach((booking) => {
    if (!rideMap.has(booking.rideId)) {
      rideMap.set(booking.rideId, {
        key: booking.rideId,
        data: {
          id: booking.rideId,
          name: booking.driver?.name || "Unknown Driver",
          vehicle: booking.driver?.vehicle
            ? `${booking.driver.vehicle.make} ${booking.driver.vehicle.model}`
            : "N/A",
          plateNumber: booking.driver?.vehicle?.plateNumber || "N/A",
          route: `${booking.pickup || "Unknown"} → ${
            booking.destination || "Unknown"
          }`,
          date: booking.date || new Date(),
          totalFare: 0,
          passengerCount: ridePassengerCounts[booking.rideId] || 1,
          type: "ride",
        },
        children: [],
      });
    } // Add passenger as child
    const ride = rideMap.get(booking.rideId);
    ride.children.push({
      key: booking.id,
      data: {
        id: booking.id,
        name: booking.passenger?.name || "Unknown Passenger",
        vehicle: "",
        plateNumber: "",
        route: "",
        date: booking.date || new Date(),
        status: booking.status || "Pending",
        seatNumber: booking.seatNumber || 1,
        fare: booking.status !== "Cancelled" ? booking.fare || 0 : 0, // Zero fare for cancelled bookings
        type: "passenger",
      },
    });

    // Update total fare (only for non-cancelled bookings)
    if (booking.status !== "Cancelled") {
      ride.data.totalFare += booking.fare || 0;
    }
  });

  return Array.from(rideMap.values());
};

// Computed property for filtered bookings
const filteredBookings = computed(() => {
  if (activeTabIndex.value === 0) {
    return bookings.value;
  } else if (activeTabIndex.value === 1) {
    return bookings.value.filter((booking) => booking.status === "Confirmed");
  } else if (activeTabIndex.value === 2) {
    return bookings.value.filter((booking) => booking.status === "Pending");
  } else if (activeTabIndex.value === 3) {
    return bookings.value.filter((booking) => booking.status === "Cancelled");
  }
  return bookings.value;
});

// Add helper method to find booking by ID
const findBookingById = (id) => {
  return bookings.value.find((b) => b.id === id);
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
