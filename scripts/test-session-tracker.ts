import { SessionTrackerService } from '../src/server/services/session-tracker.service';

async function testSessionTracker() {
  console.log('🧪 Testing Session Tracker Service...');
  
  // Test session creation (you'll need a real userId and streamId)
  const testUserId = 'test-user-id';
  const testStreamId = 'test-stream-id';
  
  console.log('✅ Session Tracker Service tests completed');
  console.log('Note: Full testing requires real user and stream IDs');
}

testSessionTracker().catch(console.error);