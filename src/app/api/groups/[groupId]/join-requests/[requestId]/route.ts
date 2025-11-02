
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup, InvitationStatus } from '@prisma/client';
import { Resend } from 'resend';
import GroupJoinRequestEmail from '@/emails/GroupJoinRequestEmail';
import { render } from '@react-email/render';
import { checkAndAwardGroupMembershipBadges, checkAndAwardInvitationBadges } from '@/lib/badge-utils';

const resend = new Resend(process.env.RESEND_API_KEY);

// This is the new path for the file
// src/app/api/groups/[groupId]/join-requests/[requestId]/route.ts

export async function PUT(request: Request, { params }: { params: { groupId: string, requestId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, requestId } = await params;

  const body = await request.json();
  const { action } = body;

  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
  }

  try {
    // 1. Verify user is an admin of the group
    const membership = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!membership || membership.role !== RoleInGroup.ADMIN) {
      return NextResponse.json({ message: 'Forbidden: You are not an admin of this group.' }, { status: 403 });
    }

    // 2. Find the join request
    const joinRequest = await prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true, // Include the user who sent the request
        group: true, // Include the group details
      },
    });

    if (!joinRequest || joinRequest.groupId !== groupId || joinRequest.status !== InvitationStatus.PENDING) {
      return NextResponse.json({ message: 'Join request not found or already processed.' }, { status: 404 });
    }

    if (action === 'accept') {
      // Use a transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Add user to the group
        await tx.groupMember.create({
          data: {
            group_id: groupId,
            user_id: joinRequest.userId,
            role: RoleInGroup.MEMBER, // New members are always MEMBER
            invited_by_id: userId,
          },
        });

        // Update the request status
        await tx.groupJoinRequest.update({
          where: { id: requestId },
          data: { status: InvitationStatus.ACCEPTED },
        });
      });

      await checkAndAwardGroupMembershipBadges(joinRequest.userId);
      await checkAndAwardInvitationBadges(userId);

      // Send email notification to the user that their request was accepted
      if (joinRequest.user.email) {
        try {
          const emailHtml = await render(GroupJoinRequestEmail({
            adminName: 'Admin', // This email is sent to the requester, so adminName is generic
            requesterName: joinRequest.user.name || 'Utilisateur',
            groupName: joinRequest.group.name,
            managementUrl: `${process.env.NEXTAUTH_URL}/groups/${joinRequest.groupId}`, // Link to the group page
            status: 'accepted',
          }));

          await resend.emails.send({
            from: `Shelfy <${process.env.RESEND_FROM_EMAIL}>` || 'noreply@shelfy.fr',
            to: joinRequest.user.email,
            subject: `Votre demande pour rejoindre ${joinRequest.group.name} a été acceptée`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error(`Failed to send acceptance email to ${joinRequest.user.email}:`, emailError);
        }
      }

    } else { // action === 'decline'
      await prisma.groupJoinRequest.update({
        where: { id: requestId },
        data: { status: InvitationStatus.DECLINED },
      });

      // Send email notification to the user that their request was declined
      if (joinRequest.user.email) {
        try {
          const emailHtml = await render(GroupJoinRequestEmail({
            adminName: 'Admin', // This email is sent to the requester, so adminName is generic
            requesterName: joinRequest.user.name || 'Utilisateur',
            groupName: joinRequest.group.name,
            managementUrl: `${process.env.NEXTAUTH_URL}/groups/${joinRequest.groupId}`, // Link to the group page
            status: 'declined',
          }));

          await resend.emails.send({
            from: `Shelfy <${process.env.RESEND_FROM_EMAIL}>` || 'noreply@shelfy.fr',
            to: joinRequest.user.email,
            subject: `Votre demande pour rejoindre ${joinRequest.group.name} a été refusée`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error(`Failed to send declination email to ${joinRequest.user.email}:`, emailError);
        }
      }
    }

    return NextResponse.json({ message: `Request successfully ${action}ed.` });

  } catch (error) {
    console.error(`Failed to ${action} join request:`, error);
    // Check for unique constraint violation on member creation
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        return NextResponse.json({ message: 'This user is already a member of the group.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'An internal error occurred.' }, { status: 500 });
  }
}
