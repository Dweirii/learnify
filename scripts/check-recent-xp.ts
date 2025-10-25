import { db } from "../src/lib/db";

async function checkRecentXPTransactions() {
  console.log('🔍 Checking Recent XP Transactions...');
  
  try {
    // Get all XP transactions from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const transactions = await db.xpTransaction.findMany({
      where: {
        createdAt: {
          gte: yesterday,
        },
      },
      include: {
        user: {
          select: { username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📋 Found ${transactions.length} XP transactions in the last 24 hours:`);
    
    if (transactions.length === 0) {
      console.log('❌ No XP transactions found - this explains why you didn\'t get XP!');
      
      // Check if there are any XP transactions at all
      const allTransactions = await db.xpTransaction.count();
      console.log(`📊 Total XP transactions in database: ${allTransactions}`);
      
      if (allTransactions === 0) {
        console.log('🚨 No XP transactions exist at all! The XP system might not be working.');
      }
    } else {
      transactions.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.user.username}: +${tx.amount} XP for "${tx.reason}" (${tx.createdAt.toISOString()})`);
      });
    }

    // Check all users and their stats
    console.log('\n👥 All Users and Their Stats:');
    const allUsers = await db.user.findMany({
      include: {
        userStats: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    allUsers.forEach((user, i) => {
      const stats = user.userStats;
      console.log(`  ${i + 1}. ${user.username}: Level ${stats?.level || 'N/A'}, ${stats?.totalXP || 0} XP`);
    });

    // Check recent follows
    console.log('\n❤️ Recent Follows:');
    const recentFollows = await db.follow.findMany({
      where: {
        createdAt: {
          gte: yesterday,
        },
      },
      include: {
        follower: { select: { username: true } },
        following: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${recentFollows.length} follows in the last 24 hours:`);
    recentFollows.forEach((follow, i) => {
      console.log(`  ${i + 1}. ${follow.follower.username} → ${follow.following.username} (${follow.createdAt.toISOString()})`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkRecentXPTransactions().catch(console.error);
