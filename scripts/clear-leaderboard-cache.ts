import { redis } from "../src/lib/redis";

async function clearLeaderboardCache() {
  console.log('🧹 Clearing Leaderboard Cache...');
  
  try {
    // Get all leaderboard cache keys
    const keys = await redis.keys('leaderboard:*');
    console.log(`Found ${keys.length} cache keys:`, keys);
    
    if (keys.length > 0) {
      // Delete all leaderboard cache keys
      await redis.del(...keys);
      console.log('✅ Cleared all leaderboard cache keys');
    } else {
      console.log('ℹ️ No leaderboard cache keys found');
    }
    
    // Test Redis connection
    await redis.set('test', 'working');
    const testValue = await redis.get('test');
    console.log('🔗 Redis connection test:', testValue === 'working' ? '✅ Working' : '❌ Failed');
    
    await redis.del('test');
    
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

clearLeaderboardCache().catch(console.error);
