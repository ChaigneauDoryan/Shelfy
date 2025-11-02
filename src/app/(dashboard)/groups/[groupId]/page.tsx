import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import GroupDetailsPage from './GroupDetailsPage';
import { Suspense } from 'react';

async function getGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      books: {
        include: {
          book: true,
        },
      },
      polls: {
        include: {
          options: {
            include: {
              groupBook: {
                include: {
                  book: true,
                },
              },
              votes: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  const isMember = group.members.some((member) => member.user_id === userId);
  if (!isMember) {
    return null;
  }

  const adminCount = group.members.filter(member => member.role === 'ADMIN').length;
  const memberCount = group.members.length;

  return { ...group, adminCount, memberCount };
}

export default async function GroupPage({ params }: { params: { groupId: string } }) {
  const awaitedParams = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return notFound();
  }

  const group = await getGroup(awaitedParams.groupId, session.user.id);

  if (!group) {
    return notFound();
  }

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <GroupDetailsPage group={group} />
    </Suspense>
  );
}