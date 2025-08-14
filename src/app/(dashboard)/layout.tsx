// layout.tsx
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import ClientLayoutContent from "./ClientLayoutContent";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    // Dans un layout, on ne peut pas retourner NextResponse
    // On utilise notFound() ou on affiche une erreur dans l'UI
    notFound();
  }

  return (
    <ClientLayoutContent user={user} profile={profile}>
      {children}
    </ClientLayoutContent>
  );
}