import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillGamificationStats() {
  console.log('🚀 Starting gamification backfill...');
  
  try {
    // Get all users who don't have UserStats yet
    const usersWithoutStats = await prisma.user.findMany({
      where: {
        userStats: null
      },
      select: {
        id: true,
        username: true,
        createdAt: true
      }
    });

    console.log(`📊 Found ${usersWithoutStats.length} users without gamification stats`);

    if (usersWithoutStats.length === 0) {
      console.log('All users already have gamification stats!');
      return;
    }

    // Create UserStats for each user
    const userStatsData = usersWithoutStats.map(user => ({
      userId: user.id,
      totalXP: 0,
      level: 1,
      streamMinutes: 0,
      watchMinutes: 0,
      chatMessageCount: 0,
      lastXPUpdate: new Date(),
    }));

    // Batch insert UserStats
    const result = await prisma.userStats.createMany({
      data: userStatsData,
      skipDuplicates: true
    });

    console.log(`Successfully created ${result.count} UserStats records`);

    // Verify the backfill
    const totalUsers = await prisma.user.count();
    const totalUserStats = await prisma.userStats.count();
    
    console.log(`Verification:`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Total UserStats: ${totalUserStats}`);
    
    if (totalUsers === totalUserStats) {
      console.log('Backfill completed successfully! All users now have gamification stats.');
    } else {
      console.log(' Warning: User count and UserStats count do not match');
    }

  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillGamificationStats()
  .then(() => {
    console.log('✨ Backfill script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Backfill script failed:', error);
    process.exit(1);
  });