
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ClientLayoutContent from "./ClientLayoutContent";

export default async function DashboardLayout({
  children,
  addBookModal,
}: {
  children: React.ReactNode;
  addBookModal: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <ClientLayoutContent user={user} profile={profile}>
      {children}
    </ClientLayoutContent>
  );
}
