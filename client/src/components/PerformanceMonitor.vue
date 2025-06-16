<template>
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="text-lg font-semibold text-[#330b4f] mb-4">
      <i class="pi pi-chart-line mr-2"></i>
      Performance Metrics
    </h3>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- API Response Time -->
      <div class="bg-[#f5f0fa] p-3 rounded-lg">
        <div class="text-sm text-gray-500">Avg API Response</div>
        <div class="text-xl font-semibold text-[#330b4f]">
          {{ metrics.avgResponseTime }}ms
        </div>
        <div class="text-xs" :class="getPerformanceColor(metrics.avgResponseTime, 1000)">
          {{ getPerformanceStatus(metrics.avgResponseTime, 1000) }}
        </div>
      </div>
      
      <!-- Cache Hit Rate -->
      <div class="bg-[#f5f0fa] p-3 rounded-lg">
        <div class="text-sm text-gray-500">Cache Hit Rate</div>
        <div class="text-xl font-semibold text-[#330b4f]">
          {{ metrics.cacheHitRate }}%
        </div>
        <div class="text-xs" :class="getPerformanceColor(metrics.cacheHitRate, 50)">
          {{ metrics.cacheHitRate >= 50 ? 'Good' : 'Needs Improvement' }}
        </div>
      </div>
      
      <!-- Page Load Time -->
      <div class="bg-[#f5f0fa] p-3 rounded-lg">
        <div class="text-sm text-gray-500">Page Load Time</div>
        <div class="text-xl font-semibold text-[#330b4f]">
          {{ metrics.pageLoadTime }}s
        </div>
        <div class="text-xs" :class="getPerformanceColor(metrics.pageLoadTime, 3, true)">
          {{ getPerformanceStatus(metrics.pageLoadTime, 3, true) }}
        </div>
      </div>
    </div>
    
    <!-- Performance Tips -->
    <div v-if="showTips" class="mt-4 p-3 bg-blue-50 rounded-lg">
      <h4 class="text-sm font-semibold text-blue-800 mb-2">
        <i class="pi pi-info-circle mr-1"></i>
        Performance Tips
      </h4>
      <ul class="text-xs text-blue-700 space-y-1">
        <li v-for="tip in activeTips" :key="tip">• {{ tip }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

// Performance metrics
const metrics = ref({
  avgResponseTime: 0,
  cacheHitRate: 0,
  pageLoadTime: 0,
});

const showTips = ref(false);

// Performance improvement tips
const performanceTips = [
  'Use server-side pagination for large datasets',
  'Enable response caching for frequently accessed data',
  'Implement debounced search to reduce API calls',
  'Use skeleton loading states for better UX',
  'Optimize database queries with proper indexing',
  'Enable gzip compression on the server',
  'Implement lazy loading for images and components',
  'Use virtual scrolling for very large lists'
];

const activeTips = computed(() => {
  const tips = [];
  if (metrics.value.avgResponseTime > 1000) {
    tips.push('Consider optimizing database queries');
  }
  if (metrics.value.cacheHitRate < 50) {
    tips.push('Implement better caching strategies');
  }
  if (metrics.value.pageLoadTime > 3) {
    tips.push('Optimize initial page load with code splitting');
  }
  return tips.length > 0 ? tips : performanceTips.slice(0, 3);
});

// Helper methods
const getPerformanceColor = (value, threshold, reverse = false) => {
  const isGood = reverse ? value <= threshold : value >= threshold;
  return isGood ? 'text-green-600' : 'text-red-600';
};

const getPerformanceStatus = (value, threshold, reverse = false) => {
  const isGood = reverse ? value <= threshold : value >= threshold;
  return isGood ? 'Good' : 'Needs Improvement';
};

// Mock data generation (replace with real metrics)
const updateMetrics = () => {
  // In real implementation, these would come from actual performance monitoring
  metrics.value = {
    avgResponseTime: Math.floor(Math.random() * 1500) + 200, // 200-1700ms
    cacheHitRate: Math.floor(Math.random() * 100), // 0-100%
    pageLoadTime: (Math.random() * 5 + 1).toFixed(1), // 1-6s
  };
  
  showTips.value = metrics.value.avgResponseTime > 1000 || 
                  metrics.value.cacheHitRate < 50 || 
                  metrics.value.pageLoadTime > 3;
};

onMounted(() => {
  updateMetrics();
  // Update metrics every 30 seconds
  setInterval(updateMetrics, 30000);
});
</script>
