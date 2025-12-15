
// Le middleware s'occupe de la protection de cette route.
// Ce layout n'a plus besoin de récupérer de données.

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* La TopNavbar est maintenant autonome grâce au SessionProvider et au hook useSession */}
      <main className="flex-1 p-4 md:p-8 bg-gray-100/50">
        <div className="container mx-auto max-w-screen-lg">
          {children}
        </div>
      </main>
    </div>
  );
}
