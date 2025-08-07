
import { Controller, Post, Body, UseGuards, Req, Get, Query, UnauthorizedException, Delete, Param } from '@nestjs/common';
import { GroupService } from './group.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createGroup(@Body() createGroupDto: { name: string; description?: string; avatar_url?: string }, @Req() req) {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1]; // Extraire le token Bearer

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found.');
    }

    const group = await this.groupService.createGroup(createGroupDto, userId, accessToken);
    return group;
  }

  @Post('invite')
  @UseGuards(AuthGuard('jwt')) // Assurez-vous que l'utilisateur est authentifié
  async inviteToGroup(
    @Req() req: any, // Get the raw request object
  ) {
    console.log('DEBUG (API Raw): Request Headers:', req.headers);
    console.log('DEBUG (API Raw): Request Body:', req.body);

    const { groupId, groupName, invitedEmails } = req.body; // Access directly from raw body

    if (!Array.isArray(invitedEmails)) {
      console.error('DEBUG (API Raw): invitedEmails is not an array or is undefined:', invitedEmails);
      throw new Error('Invalid invitedEmails format. Expected an array.');
    }

    const inviterName = req.user.username || req.user.email; // Ou le nom réel de l'utilisateur
    const inviterId = req.user.id;
    const results: { email: string; status: string; message: string; }[] = [];

    for (const invitedEmail of invitedEmails) {
      try {
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (!accessToken) {
          throw new UnauthorizedException('Access token not found.');
        }
        await this.groupService.sendGroupInvitation(groupId, groupName, inviterName, invitedEmail, inviterId, accessToken);
        results.push({ email: invitedEmail, status: 'success', message: 'Invitation envoyée.' });
      } catch (error: any) {
        // Gérer les erreurs spécifiques (déjà membre, déjà invité, etc.)
        if (error.message.includes('already a member')) {
          results.push({ email: invitedEmail, status: 'already_member', message: 'Déjà membre du groupe.' });
        } else if (error.message.includes('already invited')) {
          results.push({ email: invitedEmail, status: 'already_invited', message: 'Déjà invité à ce groupe.' });
        } else {
          results.push({ email: invitedEmail, status: 'error', message: error.message || 'Erreur inconnue.' });
        }
      }
    }
    return results;
  }

  @Get('accept-invitation')
  @UseGuards(AuthGuard('jwt')) // L'utilisateur doit être connecté pour accepter
  async acceptInvitation(@Query('token') token: string, @Req() req) {
    const userId = req.user.id; // L'ID de l'utilisateur connecté
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      throw new UnauthorizedException('Access token not found.');
    }
    const success = await this.groupService.acceptGroupInvitation(token, userId, accessToken);
    if (success) {
      return { message: 'Invitation acceptée avec succès.' };
    } else {
      return { message: 'Échec de l\acceptation de l\'invitation ou invitation invalide.', error: true };
    }
  }

  @Delete(':groupId')
  @UseGuards(AuthGuard('jwt'))
  async deleteGroup(@Param('groupId') groupId: string, @Req() req) {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found.');
    }

    await this.groupService.deleteGroup(groupId, userId, accessToken);
    return { message: 'Groupe supprimé avec succès.' };
  }
}
