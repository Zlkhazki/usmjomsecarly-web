<!-- <script setup>
import { ref } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";

const text = ref(null);
const msg = ref(null);

function greet() {
  msg.value = "Hello " + text.value;
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-10">
    <section
      class="bg-white dark:bg-surface-900 p-10 rounded-xl flex flex-col gap-8 max-w-3xl"
    >
      <h1 class="text-5xl text-black dark:text-white font-bold text-center">
        Tailwind CSS + PrimeVue
      </h1>
      <div class="flex gap-4">
        <InputText v-model="text" maxlength="20" fluid />
        <Button
          label="Submit"
          @click="greet"
          class="min-w-20"
          :disabled="!text"
        />
      </div>
      <div class="h-8 text-center text-primary text-xl">
        {{ msg }}
      </div>
    </section>
  </div>
</template> -->

<script setup>
import { RouterView } from 'vue-router'
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast'
</script>

<template>
  <Toast />
  <RouterView />
</template>

<style>
/* Global styles */
:root {
  --primary-color: #330b4f;
  --secondary-color: #dec9f9;
  --primary-dark: #270838;
  --secondary-light: #eee0ff;
}
</style>