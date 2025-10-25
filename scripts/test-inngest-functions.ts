import { inngest } from '../src/lib/inngest';

async function testInngestFunctions() {
  console.log('🧪 Testing Inngest Functions...');
  
  try {
    // Test manual XP calculation
    console.log('Triggering manual XP calculation...');
    await inngest.send({
      name: "xp/manual-calculation",
      data: {
        userId: "test-user",
        reason: "manual-test",
      },
    });
    
    // Test manual leaderboard refresh
    console.log('Triggering manual leaderboard refresh...');
    await inngest.send({
      name: "leaderboard/manual-refresh",
      data: {
        userId: "test-user",
        reason: "manual-test",
      },
    });
    
    console.log('✅ Inngest functions triggered successfully');
    console.log('Check Inngest dashboard for execution results');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testInngestFunctions().catch(console.error);