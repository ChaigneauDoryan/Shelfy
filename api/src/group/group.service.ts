
import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class GroupService {
  private supabase;

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;

    this.supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
    );
  }

  async createGroup(createGroupDto: { name: string; description?: string; avatar_url?: string }, userId: string, accessToken: string) {
    const { name, description, avatar_url } = createGroupDto;

    console.log("User ID for group creation:", userId); // Ligne de débogage

    // Créer un client Supabase avec le token d'accès de l'utilisateur
    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    // 1. Créer le groupe
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        avatar_url,
        created_by: userId,
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
      throw new Error('Failed to create group.');
    }

    // 2. Ajouter le créateur comme premier membre (admin)
    const { error: memberError } = await supabase // Utiliser le client authentifié
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin', // Le créateur est admin par défaut
      });

    if (memberError) {
      // Idéalement, il faudrait une transaction pour annuler la création du groupe
      console.error('Error adding creator to group members:', memberError);
      throw new Error('Failed to add creator to group.');
    }

    return group;
  }

  async sendGroupInvitation(
    groupId: string,
    groupName: string,
    inviterName: string,
    invitedEmail: string,
    inviterId: string,
  ): Promise<void> {
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: userError } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('email', invitedEmail)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing user:', userError);
      throw new Error('Failed to check existing user.');
    }

    const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); // Simple token for now
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    let invitationLink = '';

    if (existingUser) {
      // Utilisateur existant: lien vers la page de connexion/acceptation
      invitationLink = `${baseUrl}/auth/login?redirectTo=/auth/invite?token=${invitationToken}&groupId=${groupId}`;
    } else {
      // Nouvel utilisateur: lien vers la page d'inscription/acceptation
      invitationLink = `${baseUrl}/auth/signup?redirectTo=/auth/invite?token=${invitationToken}&groupId=${groupId}&email=${encodeURIComponent(invitedEmail)}`;
    }

    // Enregistrer l'invitation dans la base de données
    const { error: insertError } = await this.supabase.from('group_invitations').insert({
      group_id: groupId,
      invited_email: invitedEmail,
      inviter_id: inviterId,
      token: invitationToken,
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expire dans 24 heures
    });

    if (insertError) {
      console.error('Error inserting invitation:', insertError);
      throw new Error('Failed to save invitation.');
    }

        await this.mailService.sendGroupInvitation(
      invitedEmail,
      groupName,
      inviterName,
      invitationLink,
    );
  }

  async acceptGroupInvitation(token: string, userId: string): Promise<boolean> {
    const { data: invitation, error: fetchError } = await this.supabase
      .from('group_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation || new Date(invitation.expires_at) < new Date()) {
      console.error('Invalid or expired invitation:', fetchError);
      return false;
    }

    // Ajouter l'utilisateur au groupe
    const { error: memberError } = await this.supabase.from('group_members').insert({
      group_id: invitation.group_id,
      user_id: userId,
      role: 'member',
    });

    if (memberError) {
      console.error('Error adding member to group:', memberError);
      return false;
    }

    // Mettre à jour le statut de l'invitation
    const { error: updateError } = await this.supabase
      .from('group_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      return false;
    }

    return true;
  }
}
