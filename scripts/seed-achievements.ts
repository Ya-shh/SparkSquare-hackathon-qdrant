import { PrismaClient } from '@prisma/client';
import { achievements } from '../src/lib/achievements';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting achievement seeding...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    console.log(`Found ${users.length} users to process`);

    for (const user of users) {
      console.log(`Processing user: ${user.username}`);

      const upvotes = await prisma.vote.count({
        where: {
          OR: [
            { post: { userId: user.id }, value: 1 },
            { comment: { userId: user.id }, value: 1 },
          ],
        },
      });

      const userStats = {
        posts: user._count.posts,
        comments: user._count.comments,
        upvotes,
      };

      console.log(`User stats: ${JSON.stringify(userStats)}`);

      for (const achievement of achievements) {
        let shouldHaveAchievement = false;

        if (achievement.condition.type === 'posts') {
          shouldHaveAchievement = userStats.posts >= achievement.condition.threshold;
        } else if (achievement.condition.type === 'comments') {
          shouldHaveAchievement = userStats.comments >= achievement.condition.threshold;
        } else if (achievement.condition.type === 'votes_received') {
          shouldHaveAchievement = userStats.upvotes >= achievement.condition.threshold;
        }

        if (shouldHaveAchievement) {
          const existingAchievement = await prisma.userAchievement.findUnique({
            where: {
              userId_achievementId: {
                userId: user.id,
                achievementId: achievement.id,
              },
            },
          });

          if (!existingAchievement) {
            try {
              await prisma.userAchievement.create({
                data: {
                  userId: user.id,
                  achievementId: achievement.id,
                  unlockedAt: new Date(),
                },
              });

              await prisma.user.update({
                where: { id: user.id },
                data: {
                  reputation: {
                    increment: achievement.points,
                  },
                },
              });

              console.log(`Added achievement "${achievement.name}" to user ${user.username}`);
            } catch (error) {
              console.error(`Error adding achievement to user: ${error}`);
            }
          }
        }
      }
    }

    console.log('Achievement seeding completed successfully');
  } catch (error) {
    console.error('Error seeding achievements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 