<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

// PrimeVue imports
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';

const router = useRouter();
const loading = ref(false);
const rememberMe = ref(false);

const formData = reactive({
  email: '',
  password: ''
});

const errors = reactive({
  email: '',
  password: '',
  form: ''
});

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.email = '';
  errors.password = '';
  errors.form = '';
  
  // Email validation
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
    isValid = false;
  }
  
  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;
  
  loading.value = true;
  
  try {
    // Replace with your actual login API endpoint
    // For demo purposes, we'll simulate a successful login
    // const response = await axios.post('/api/admin/login', {
    //   email: formData.email,
    //   password: formData.password
    // });
    
    // Simulate successful login (replace with actual API call)
    if (formData.email === 'admin@usm.my' && formData.password === 'admin123') {
      // Simulate token
      const token = 'demo-token-' + Math.random().toString(36).substring(2);
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      if (rememberMe.value) {
        localStorage.setItem('adminEmail', formData.email);
      } else {
        localStorage.removeItem('adminEmail');
      }
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } else {
      errors.form = 'Invalid email or password';
    }
  } catch (error) {
    console.error('Login failed', error);
    errors.form = 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

// For demo purposes - prefill with demo account
const fillDemoAccount = () => {
  formData.email = 'admin@usm.my';
  formData.password = 'admin123';
};

// Check if email exists in localStorage (from remember me)
const initializeForm = () => {
  const savedEmail = localStorage.getItem('adminEmail');
  if (savedEmail) {
    formData.email = savedEmail;
    rememberMe.value = true;
  }
};

// Call the initialization function
initializeForm();
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#330b4f] to-[#4a1572] bg-cover bg-no-repeat bg-center">
    <div class="relative flex flex-col m-6 space-y-8 md:w-3/4 lg:w-3/5 bg-white shadow-2xl rounded-2xl lg:flex-row lg:space-y-0">
      <!-- Left side with image -->
      <div class="relative lg:w-1/2">
        <img
          src="../components/icons/usm-blurred.jpg"
          alt="USM Campus"
          class="w-full h-full hidden rounded-l-2xl lg:block object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#330b4f] to-transparent opacity-70 rounded-l-2xl hidden lg:block"></div>
        <div class="absolute bottom-0 left-0 p-8 text-white hidden lg:block">
          <h2 class="text-3xl font-bold mb-2">Jom SeCarly</h2>
          <p class="text-lg">Safe Campus Ridesharing</p>
        </div>
      </div>
      
      <!-- Right side with login form -->
      <div class="flex flex-col lg:w-1/2 justify-center p-8 lg:p-14">
        <div class="flex items-center justify-center mb-8 lg:hidden">
          <img src="../components/icons/logo.png" alt="Jom SeCarly Logo" class="h-16" />
        </div>
        
        <span class="mb-3 text-4xl font-bold text-[#330b4f]">Admin Login</span>
        <span class="font-light text-gray-500 mb-6">
          Sign in to access the admin dashboard
        </span>

        <Message v-if="errors.form" severity="error" :closable="false" class="mb-4">{{ errors.form }}</Message>
        
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Input -->
          <div class="field">
            <label for="email" class="flex items-center mb-2 text-sm font-medium text-gray-700">
              <i class="pi pi-user mr-2"></i>
              Email Address
            </label>
            <InputText
              id="email"
              v-model="formData.email"
              type="email"
              class="w-full"
              :class="{'p-invalid': errors.email}"
              placeholder="Email address"
              autocomplete="username"
            />
            <small class="p-error block mt-1" v-if="errors.email">{{ errors.email }}</small>
          </div>
          
          <!-- Password Input -->
          <div class="field">
            <label for="password" class="flex items-center mb-2 text-sm font-medium text-gray-700">
              <i class="pi pi-lock mr-2"></i>
              Password
            </label>
            <Password
              id="password"
              v-model="formData.password"
              class="w-full"
              inputClass="w-full"
              :class="{'p-invalid': errors.password}"
              :feedback="false"
              toggleMask
              placeholder="Password"
              autocomplete="current-password"
            />
            <small class="p-error block mt-1" v-if="errors.password">{{ errors.password }}</small>
          </div>
          
          <!-- Remember Me Checkbox -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <Checkbox 
                id="rememberMe" 
                v-model="rememberMe" 
                :binary="true" 
                class="mr-2"
              />
              <label for="rememberMe" class="text-sm text-gray-700">Remember me</label>
            </div>
            <a href="#" class="text-sm text-[#330b4f] hover:text-[#4a1572] font-medium">Forgot Password?</a>
          </div>
          
          <!-- Login Button -->
          <Button 
            type="submit" 
            label="Sign In" 
            icon="pi pi-sign-in" 
            iconPos="right"
            class="w-full" 
            :loading="loading"
            :disabled="loading"
          />
        </form>
        
        <!-- Demo Account Link -->
        <div class="text-center mt-6">
          <Button 
            type="button" 
            label="Use demo account" 
            @click="fillDemoAccount" 
            severity="secondary"
            text
            size="small"
            class="text-[#330b4f] text-xs"
          />
        </div>
        
        <!-- Footer -->
        <div class="mt-10 text-center text-gray-500 text-sm">
          &copy; {{ new Date().getFullYear() }} Jom SeCarly. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-password-input) {
  width: 100%;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-button) {
  background-color: #330b4f;
  border-color: #330b4f;
  color: white; /* Ensuring text is white for readability */
}

:deep(.p-button:enabled:hover) {
  background-color: #4a1572;
  border-color: #4a1572;
  color: white; /* Maintaining white text on hover */
}

:deep(.p-checkbox:not(.p-checkbox-disabled).p-highlight) {
  background: #330b4f;
  border-color: #330b4f;
}

:deep(.p-checkbox:not(.p-checkbox-disabled).p-highlight:hover) {
  background: #4a1572;
  border-color: #4a1572;
}

:deep(.p-inputtext:enabled:focus) {
  border-color: #330b4f;
  box-shadow: 0 0 0 0.2rem rgb(222 201 249 / 50%);
}

:deep(.p-message.p-message-error) {
  background-color: #fff1f1;
  border-left: 6px solid #ff5757;
  color: #ab0000;
}

.p-error {
  color: #ff5757;
}
</style>