import { db } from "../src/lib/db";
import { XPService } from "../src/server/services/xp.service";
import { followUser } from "../src/server/services/follow.service";

async function testFollowAction() {
  console.log('🧪 Testing Follow Action...');
  
  try {
    // Get two users to test with
    const users = await db.user.findMany({
      take: 2,
      select: { id: true, username: true },
    });

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to test follow action');
      return;
    }

    const [user1, user2] = users;
    console.log(`👤 User 1: ${user1.username} (${user1.id})`);
    console.log(`👤 User 2: ${user2.username} (${user2.id})`);

    // Check if user1 already follows user2
    const existingFollow = await db.follow.findFirst({
      where: {
        followerId: user1.id,
        followingId: user2.id,
      },
    });

    if (existingFollow) {
      console.log('⚠️ User1 already follows User2, unfollowing first...');
      await db.follow.delete({
        where: { id: existingFollow.id },
      });
    }

    // Check user1's stats before
    const statsBefore = await db.userStats.findUnique({
      where: { userId: user1.id },
    });
    console.log(`📊 Before: Level ${statsBefore?.level}, ${statsBefore?.totalXP} XP`);

    // Test the follow action manually (simulating what happens in the action)
    console.log('\n🔄 Testing follow action...');
    
    // This simulates what happens in the follow action
    const followedUser = await followUser(user2.id);
    console.log('✅ Follow created:', followedUser);

    // Award XP (this is what should happen in the action)
    if (followedUser) {
      console.log('🎯 Awarding XP...');
      const result = await XPService.awardXP(
        followedUser.followerId,
        XPService.XP_CONSTANTS.FOLLOW_USER,
        "follow_user",
        {
          followedUserId: followedUser.followingId,
          followedUsername: followedUser.following.username,
        }
      );
      console.log('✅ XP Award Result:', result);
    }

    // Check user1's stats after
    const statsAfter = await db.userStats.findUnique({
      where: { userId: user1.id },
    });
    console.log(`📊 After: Level ${statsAfter?.level}, ${statsAfter?.totalXP} XP`);

    // Check XP transactions
    const transactions = await db.xpTransaction.findMany({
      where: { userId: user1.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    console.log('\n📋 Recent XP Transactions:');
    transactions.forEach((tx, i) => {
      console.log(`  ${i + 1}. +${tx.amount} XP for ${tx.reason} (${tx.createdAt.toISOString()})`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFollowAction().catch(console.error);
