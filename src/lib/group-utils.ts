import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const createSupabaseServiceRoleClient = async () => {
  const accessToken = await (cookies() as any).get('sb-access-token')?.value;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

function generateCode(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createGroup(createGroupDto: { name: string; description?: string; avatar_url?: string }, userId: string) {
  const supabase = await createSupabaseServiceRoleClient();
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

export async function deleteGroup(groupId: string, userId: string): Promise<void> {
  const supabase = await createSupabaseServiceRoleClient();

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)
    .eq('created_by', userId);

  if (error) {
    console.error('Error deleting group:', error);
    throw new Error('Failed to delete group or not authorized.');
  }
}

export async function updateGroup(groupId: string, updateGroupDto: { name?: string; description?: string; avatar_url?: string }) {
  const supabase = await createSupabaseServiceRoleClient();

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

export async function joinGroup(invitationCode: string, userId: string) {
  const supabase = await createSupabaseServiceRoleClient();

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

export async function leaveGroup(groupId: string, userId: string) {
  const supabase = await createSupabaseServiceRoleClient();

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
  // Check if user is admin/owner of the group using the passed supabase client
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
