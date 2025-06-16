// Test script to verify ride service functionality
import { rideService } from './src/services/rideService.js';

// Test the optimized getFilteredRides method
async function testRideService() {
  console.log('🧪 Testing Ride Service...');
  
  try {
    // Test basic filtering
    const testFilters = {
      page: 1,
      limit: 25,
      sortBy: 'created_at',
      order: 'desc'
    };
    
    console.log('📡 Testing getFilteredRides...');
    const result = await rideService.getFilteredRides(testFilters);
    
    if (result.success) {
      console.log('✅ getFilteredRides working correctly');
      console.log(`📊 Returned ${result.data.rides.length} rides`);
      console.log(`📄 Total records: ${result.data.total}`);
    } else {
      console.log('❌ getFilteredRides failed:', result.message);
    }
    
    // Test caching
    console.log('🔄 Testing cache...');
    const startTime = performance.now();
    const cachedResult = await rideService.getFilteredRides(testFilters);
    const endTime = performance.now();
    
    console.log(`⚡ Cache test completed in ${(endTime - startTime).toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for testing
export { testRideService };
