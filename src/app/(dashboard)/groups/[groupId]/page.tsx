import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import GroupDetailsPage from './GroupDetailsPage';

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
        where: {
          status: { in: ['CURRENTLY_READING', 'FINISHED', 'SUGGESTED'] },
        },
        include: {
          book: true,
          votes: true,
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
  const session = await getSession();
  if (!session?.user?.id) {
    return notFound();
  }

  const group = await getGroup(params.groupId, session.user.id);

  if (!group) {
    return notFound();
  }

  return <GroupDetailsPage group={group} />;
}