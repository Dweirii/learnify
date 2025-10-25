import { XPService } from '../src/server/services/xp.service';

async function testXPService() {
  console.log('🧪 Testing XP Service...');
  
  // Test level calculation
  console.log('Level 1:', XPService.calculateLevel(0)); // Should be 1
  console.log('Level 2:', XPService.calculateLevel(100)); // Should be 2
  console.log('Level 10:', XPService.calculateLevel(10000)); // Should be 10
  
  // Test XP for next level
  console.log('XP for level 2:', XPService.getXPForNextLevel(1)); // Should be 400
  console.log('XP for level 3:', XPService.getXPForNextLevel(2)); // Should be 900
  
  // Test level progress
  const progress = XPService.calculateLevelProgress(150, 1);
  console.log('Progress at 150 XP:', progress);
  
  console.log('✅ XP Service tests completed');
}

testXPService().catch(console.error);