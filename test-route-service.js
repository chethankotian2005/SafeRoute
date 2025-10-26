/**
 * Route Calculation Service - Test File
 * Quick tests to verify the route calculation service
 */

import { calculateWalkingRoutes, formatDistance, formatDuration } from '../src/services/routeCalculationService';

// Test locations (Mangalore area)
const testLocations = {
  kadri: { latitude: 12.9100, longitude: 74.8410 },
  city: { latitude: 12.8698, longitude: 74.8428 },
  beach: { latitude: 12.9141, longitude: 74.8060 },
  market: { latitude: 12.8739, longitude: 74.8428 },
};

/**
 * Test 1: Basic route calculation
 */
export const testBasicRouteCalculation = async () => {
  console.log('\nTEST 1: Basic Route Calculation');
  console.log('================================\n');
  
  try {
    const routes = await calculateWalkingRoutes(
      testLocations.kadri,
      testLocations.city
    );
    
    console.log(`✅ Success! Found ${routes.length} route(s)\n`);
    
    routes.forEach((route, index) => {
      console.log(`Route ${index + 1}:`);
      console.log(`  ID: ${route.id}`);
      console.log(`  Summary: ${route.summary}`);
      console.log(`  Distance: ${route.distance.text} (${route.distance.value}m)`);
      console.log(`  Duration: ${route.duration.text} (${route.duration.value}s)`);
      console.log(`  Steps: ${route.steps.length}`);
      console.log(`  Coordinates: ${route.coordinates.length} points\n`);
    });
    
    return { success: true, routes };
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    return { success: false, error };
  }
};

/**
 * Test 2: Route with options
 */
export const testRouteWithOptions = async () => {
  console.log('\nTEST 2: Route with Options');
  console.log('================================\n');
  
  try {
    const routes = await calculateWalkingRoutes(
      testLocations.beach,
      testLocations.market,
      {
        alternatives: true,
        avoidHighways: true,
      }
    );
    
    console.log(`✅ Success! Found ${routes.length} route(s) avoiding highways\n`);
    
    routes.forEach((route, index) => {
      console.log(`Route ${index + 1}: ${route.summary}`);
      console.log(`  ${route.distance.text} • ${route.duration.text}`);
    });
    
    return { success: true, routes };
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    return { success: false, error };
  }
};

/**
 * Test 3: Navigation steps
 */
export const testNavigationSteps = async () => {
  console.log('\nTEST 3: Navigation Steps');
  console.log('================================\n');
  
  try {
    const routes = await calculateWalkingRoutes(
      testLocations.kadri,
      testLocations.city
    );
    
    const route = routes[0];
    console.log(`✅ Analyzing route: ${route.summary}\n`);
    
    console.log(`Total steps: ${route.steps.length}\n`);
    
    // Show first 5 steps
    route.steps.slice(0, 5).forEach((step, index) => {
      console.log(`Step ${index + 1}:`);
      console.log(`  ${step.instruction}`);
      console.log(`  Distance: ${step.distance.text}`);
      console.log(`  Duration: ${step.duration.text}`);
      console.log(`  Maneuver: ${step.maneuver || 'straight'}\n`);
    });
    
    if (route.steps.length > 5) {
      console.log(`... and ${route.steps.length - 5} more steps\n`);
    }
    
    return { success: true, route };
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    return { success: false, error };
  }
};

/**
 * Test 4: Helper functions
 */
export const testHelperFunctions = () => {
  console.log('\nTEST 4: Helper Functions');
  console.log('================================\n');
  
  try {
    // Test formatDistance
    console.log('formatDistance:');
    console.log(`  500m → ${formatDistance(500)}`);
    console.log(`  1200m → ${formatDistance(1200)}`);
    console.log(`  7400m → ${formatDistance(7400)}\n`);
    
    // Test formatDuration
    console.log('formatDuration:');
    console.log(`  120s → ${formatDuration(120)}`);
    console.log(`  840s → ${formatDuration(840)}`);
    console.log(`  3720s → ${formatDuration(3720)}\n`);
    
    console.log('✅ All helper functions working!\n');
    return { success: true };
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    return { success: false, error };
  }
};

/**
 * Run all tests
 */
export const runAllTests = async () => {
  console.log('\n========================================');
  console.log('  Route Calculation Service Tests');
  console.log('========================================');
  
  const results = {
    test1: await testBasicRouteCalculation(),
    test2: await testRouteWithOptions(),
    test3: await testNavigationSteps(),
    test4: testHelperFunctions(),
  };
  
  console.log('\n========================================');
  console.log('  Test Results Summary');
  console.log('========================================\n');
  
  console.log(`Test 1 (Basic): ${results.test1.success ? 'PASS' : 'FAIL'}`);
  console.log(`Test 2 (Options): ${results.test2.success ? 'PASS' : 'FAIL'}`);
  console.log(`Test 3 (Steps): ${results.test3.success ? 'PASS' : 'FAIL'}`);
  console.log(`Test 4 (Helpers): ${results.test4.success ? 'PASS' : 'FAIL'}\n`);
  
  const allPassed = Object.values(results).every(r => r.success);
  
  if (allPassed) {
    console.log('All tests passed!\n');
  } else {
    console.log('Some tests failed. Check logs above.\n');
  }
  
  return results;
};

// Export for easy import
export default {
  runAllTests,
  testBasicRouteCalculation,
  testRouteWithOptions,
  testNavigationSteps,
  testHelperFunctions,
};
