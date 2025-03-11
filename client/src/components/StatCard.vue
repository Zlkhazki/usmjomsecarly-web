<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: [Number, String],
    required: true
  },
  bgColor: {
    type: String,
    default: 'bg-white'
  },
  textColor: {
    type: String,
    default: 'text-gray-800'
  },
  iconClass: {
    type: String,
    default: 'pi pi-chart-bar'
  },
  iconColor: {
    type: String,
    default: 'text-gray-500'
  },
  trend: {
    type: Number,
    default: null
  },
  trendPeriod: {
    type: String,
    default: 'vs last week'
  }
});
</script>

<template>
  <div :class="`${bgColor} rounded-lg shadow-md p-5 transition-transform duration-200 hover:scale-[1.02]`">
    <div class="flex items-start justify-between">
      <div>
        <div :class="`text-sm font-medium ${textColor} opacity-80`">{{ title }}</div>
        <div :class="`text-2xl font-bold mt-2 ${textColor}`">{{ count }}</div>
        
        <div v-if="trend !== null" class="mt-2 flex items-center">
          <div :class="{
            'text-xs flex items-center': true,
            'text-green-500': trend > 0,
            'text-red-500': trend < 0,
            'text-gray-500': trend === 0
          }">
            <i :class="{
              'pi mr-1': true,
              'pi-arrow-up': trend > 0,
              'pi-arrow-down': trend < 0,
              'pi-minus': trend === 0
            }"></i>
            {{ Math.abs(trend) }}%
            <span class="text-gray-400 ml-1">{{ trendPeriod }}</span>
          </div>
        </div>
      </div>
      
      <div :class="`h-10 w-10 rounded-full ${bgColor === 'bg-white' ? 'bg-gray-100' : 'bg-opacity-20 bg-white'} flex items-center justify-center`">
        <i :class="`${iconClass} ${iconColor} text-xl`"></i>
      </div>
    </div>
    
    <slot></slot>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(51, 11, 79, 0.2);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(51, 11, 79, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(51, 11, 79, 0);
  }
}

.pulse-animation {
  animation: pulse 2s infinite;
}
</style>