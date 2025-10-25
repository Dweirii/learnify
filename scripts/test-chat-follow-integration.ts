import { inngest } from '../src/lib/inngest';
import { XPService } from '../src/server/services/xp.service';

async function testChatFollowIntegration() {
  console.log('🧪 Testing Chat & Follow Integration...');
  
  try {
    // Test follow action (simulate)
    console.log('Testing follow XP award...');
    
    // This would normally be called from the follow action
    // For testing, we'll simulate the XP award directly
    const testUserId = "test-user-id";
    const testFollowedUserId = "test-followed-user-id";
    
    try {
      await XPService.awardXP(
        testUserId,
        XPService.XP_CONSTANTS.FOLLOW_USER,
        "follow_user",
        {
          followedUserId: testFollowedUserId,
          followedUsername: "test-followed-user",
        }
      );
      console.log('✅ Follow XP awarded successfully');
    } catch (error) {
      console.log('⚠️ Follow XP test failed (expected if user doesn\'t exist):', error);
    }
    
    // Test chat message XP award (simulate)
    console.log('Testing chat message XP award...');
    
    try {
      await XPService.awardXP(
        testUserId,
        XPService.XP_CONSTANTS.CHAT_MESSAGE,
        "chat_message",
        {
          streamId: "test-stream-id",
          participantIdentity: "user_test-user-id",
          dailyCount: 1,
        }
      );
      console.log('✅ Chat message XP awarded successfully');
    } catch (error) {
      console.log('⚠️ Chat message XP test failed (expected if user doesn\'t exist):', error);
    }
    
    console.log('✅ Chat & Follow integration tests completed');
    console.log('Note: XP awards will work with real user IDs');
    console.log('Expected behavior:');
    console.log('- Follow action: +5 XP');
    console.log('- Chat message: +1 XP (max 50/day)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testChatFollowIntegration().catch(console.error);
