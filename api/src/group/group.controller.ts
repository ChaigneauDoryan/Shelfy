
import { Controller, Post, Body, UseGuards, Req, Get, Query, UnauthorizedException } from '@nestjs/common';
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
    @Body('groupId') groupId: string,
    @Body('groupName') groupName: string,
    @Body('invitedEmail') invitedEmail: string,
    @Req() req,
  ) {
    const inviterName = req.user.username || req.user.email; // Ou le nom réel de l'utilisateur
    const inviterId = req.user.id;
    await this.groupService.sendGroupInvitation(groupId, groupName, inviterName, invitedEmail, inviterId);
    return { message: 'Invitation envoyée avec succès.' };
  }

  @Get('accept-invitation')
  @UseGuards(AuthGuard('jwt')) // L'utilisateur doit être connecté pour accepter
  async acceptInvitation(@Query('token') token: string, @Req() req) {
    const userId = req.user.id; // L'ID de l'utilisateur connecté
    const success = await this.groupService.acceptGroupInvitation(token, userId);
    if (success) {
      return { message: 'Invitation acceptée avec succès.' };
    } else {
      return { message: 'Échec de l\'acceptation de l\'invitation ou invitation invalide.', error: true };
    }
  }
}
