'use client';

import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface ClientLayoutContentProps {
  user: User | null;
  profile: { username: string; avatar_url: string } | null;
  children: React.ReactNode;
}

export default function ClientLayoutContent({
  user,
  profile,
  children,
}: ClientLayoutContentProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} profile={profile} onSignOut={handleSignOut} />
      <main className="flex-1 p-8 bg-gray-100/50">
        {children}
      </main>
    </div>
  );
}
