import { LeaderboardService } from '../src/server/services/leaderboard.service';

async function testLeaderboardService() {
  console.log('🧪 Testing Leaderboard Service...');
  
  try {
    // Test global leaderboard
    const global = await LeaderboardService.getGlobalLeaderboard(5, 0);
    console.log('Global leaderboard:', global.entries.length, 'entries');
    console.log('Total users:', global.total);
    
    // Test weekly streamers
    const weekly = await LeaderboardService.getWeeklyStreamersLeaderboard();
    console.log('Weekly streamers:', weekly.entries.length, 'entries');
    
    // Test monthly streamers
    const monthly = await LeaderboardService.getMonthlyStreamersLeaderboard();
    console.log('Monthly streamers:', monthly.entries.length, 'entries');
    
    // Test stats
    const stats = await LeaderboardService.getLeaderboardStats();
    console.log('Leaderboard stats:', stats);
    
    console.log('✅ Leaderboard Service tests completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLeaderboardService().catch(console.error);