import { SupabaseClient } from '@supabase/supabase-js';

function generateCode(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createGroup(supabase: SupabaseClient, createGroupDto: { name: string; description?: string; avatar_url?: string }, userId: string) {
  const { name, description, avatar_url } = createGroupDto;

  const invitation_code = generateCode(10);

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name,
      description,
      avatar_url,
      created_by: userId,
      invitation_code,
    })
    .select()
    .single();

  if (groupError) {
    console.error('Error creating group:', groupError);
    throw new Error('Failed to create group.');
  }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: userId,
      role: 'admin',
    });

  if (memberError) {
    console.error('Error adding creator to group:', memberError);
    throw new Error('Failed to add creator to group.');
  }

  return group;
}

export async function deleteGroup(supabase: SupabaseClient, groupId: string, userId: string): Promise<void> {
  // Debugging step: Check if the user is an admin
  const { data: member, error: memberCheckError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  if (memberCheckError || !member || member.role !== 'admin') {
    throw new Error('User is not an admin of this group.');
  }

  // First, delete all members of the group
  const { error: memberError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId);

  if (memberError) {
    console.error('Error deleting group members:', memberError);
    throw new Error('Failed to delete group members.');
  }

  // Then, delete the group itself
  const { error: groupError } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (groupError) {
    console.error('Error deleting group:', groupError);
    throw new Error('Failed to delete group or not authorized.');
  }
}

export async function updateGroup(supabase: SupabaseClient, groupId: string, updateGroupDto: { name?: string; description?: string; avatar_url?: string }) {
  const { data, error } = await supabase
    .from('groups')
    .update(updateGroupDto)
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    console.error('Error updating group:', error);
    throw new Error('Failed to update group.');
  }

  return data;
}

export async function joinGroup(supabase: SupabaseClient, invitationCode: string, userId: string) {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id')
    .eq('invitation_code', invitationCode)
    .single();

  if (groupError || !group) {
    throw new Error('Code d\'invitation invalide ou expiré.');
  }

  const { data: existingMember, error: memberCheckError } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .single();

  if (memberCheckError && memberCheckError.code !== 'PGRST116') {
    throw new Error('Erreur lors de la vérification des membres.');
  }

  if (existingMember) {
    throw new Error('Vous êtes déjà membre de ce groupe.');
  }

  const { error: insertError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: userId,
      role: 'member',
    });

  if (insertError) {
    console.error('Error adding user to group:', insertError);
    throw new Error('Échec de l\'ajout au groupe.');
  }

  return { message: 'Groupe rejoint avec succès !' };
}

export async function leaveGroup(supabase: SupabaseClient, groupId: string, userId: string) {
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  if (memberError || !member) {
    throw new Error('Vous n\'êtes pas membre de ce groupe ou le groupe n\'existe pas.');
  }

  const { error: deleteError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error leaving group:', deleteError);
    throw new Error('Échec de la sortie du groupe.');
  }

  return { message: 'Vous avez quitté le groupe avec succès.' };
}

export async function regenerateInvitationCode(supabase: SupabaseClient, groupId: string, userId: string) {
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  if (memberError || !member || (member.role !== 'admin' && member.role !== 'owner')) {
    throw new Error('Unauthorized: User is not an admin or owner of this group.');
  }

  const newCode = generateCode(10);

  const { data, error } = await supabase
    .from('groups')
    .update({ invitation_code: newCode })
    .eq('id', groupId)
    .select('invitation_code')
    .single();

  if (error) {
    console.error('Error regenerating invitation code:', error);
    throw new Error('Impossible de régénérer le code d\'invitation.');
  }

  return data;
}