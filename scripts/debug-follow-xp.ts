import { db } from "../src/lib/db";
import { XPService } from "../src/server/services/xp.service";

async function debugFollowXP() {
  console.log('🔍 Debugging Follow XP System...');
  
  try {
    // Get all users
    const users = await db.user.findMany({
      take: 5,
      select: { id: true, username: true },
    });

    console.log(`👥 Found ${users.length} users:`);
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.username} (${user.id})`);
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    const testUser = users[0];
    console.log(`\n🧪 Testing with user: ${testUser.username}`);

    // Check if user has stats
    let userStats = await db.userStats.findUnique({
      where: { userId: testUser.id },
    });

    if (!userStats) {
      console.log('❌ UserStats not found - creating...');
      
      // Create user stats
      userStats = await db.userStats.create({
        data: {
          userId: testUser.id,
          totalXP: 0,
          level: 1,
        },
      });
      
      console.log('✅ UserStats created!');
    } else {
      console.log(`📈 Current Stats: Level ${userStats.level}, ${userStats.totalXP} XP`);
    }

    // Test XP award
    console.log('\n🧪 Testing XP award...');
    const result = await XPService.awardXP(
      testUser.id,
      XPService.XP_CONSTANTS.FOLLOW_USER,
      "follow_user_test",
      {
        test: true,
        timestamp: new Date().toISOString(),
      }
    );

    console.log('✅ XP Award Result:', result);

    // Check updated stats
    const updatedStats = await db.userStats.findUnique({
      where: { userId: testUser.id },
    });

    console.log(`📊 Updated Stats: Level ${updatedStats?.level}, ${updatedStats?.totalXP} XP`);

    // Check XP transactions
    const transactions = await db.xpTransaction.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    console.log('\n📋 Recent XP Transactions:');
    transactions.forEach((tx, i) => {
      console.log(`  ${i + 1}. +${tx.amount} XP for ${tx.reason} (${tx.createdAt.toISOString()})`);
    });

    // Check all UserStats
    console.log('\n📊 All UserStats:');
    const allStats = await db.userStats.findMany({
      include: {
        user: {
          select: { username: true },
        },
      },
      orderBy: { totalXP: 'desc' },
    });

    allStats.forEach((stats, i) => {
      console.log(`  ${i + 1}. ${stats.user.username}: Level ${stats.level}, ${stats.totalXP} XP`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugFollowXP().catch(console.error);