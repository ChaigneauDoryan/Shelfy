'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Menu, BookText } from "lucide-react";
import Link from "next/link";
import { User } from '@prisma/client';
import { useTheme } from 'next-themes';
import { FaSun, FaMoon, FaDesktop, FaUser } from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react';
import { useUserSubscription } from '@/hooks/useUserSubscription'; // Nouvelle importation
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Pour le switch d'abonnement
import { FREE_PLAN_ID, PREMIUM_PLAN_ID } from '@/lib/subscription-utils'; // Pour les IDs de plan
import { useToast } from '@/hooks/use-toast'; // Pour les notifications

export default function TopNavbar() {
  const { data: session } = useSession();
  const user = session?.user as User | null;
  const profile = user ? { username: user.name || '', avatar_url: user.image || '' } : null;

  const { data: subscription, isLoading: isSubscriptionLoading } = useUserSubscription(user?.id); // Utilisation du hook
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const switchSubscriptionMutation = useMutation({
    mutationFn: async (newPlanId: string) => {
      const response = await fetch('/api/user/subscription/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlanId }),
      });
      if (!response.ok) throw new Error('Failed to switch subscription');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription', user?.id] });
      toast({ title: 'Succès', description: 'Votre abonnement a été mis à jour.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleSwitchSubscription = (newPlanId: string) => {
    if (user?.id && subscription?.planId !== newPlanId) {
      switchSubscriptionMutation.mutate(newPlanId);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };
  const { setTheme, theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/dashboard">
            <BookText className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Shelfy
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/dashboard"
            >
              Dashboard
            </Link>
            {(subscription?.planId === PREMIUM_PLAN_ID || isSubscriptionLoading) && ( // Afficher si Premium ou en chargement
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/discover"
              >
                Découvrir
              </Link>
            )}
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/library"
            >
              Mes Livres
            </Link>
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/groups"
            >
              Groupes de Lecture
            </Link>
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/contact"
            >
              Contact
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top">
                <div className="grid gap-2 py-6">
                  <Link
                    className="flex items-center space-x-2"
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookText className="h-6 w-6" />
                    <span className="font-bold">Shelfy</span>
                  </Link>
                  <Link
                    className="flex w-full items-center py-2 text-lg font-semibold"
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {(subscription?.planId === PREMIUM_PLAN_ID || isSubscriptionLoading) && ( // Afficher si Premium ou en chargement
                    <Link
                      className="flex w-full items-center py-2 text-lg font-semibold"
                      href="/discover"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Découvrir
                    </Link>
                  )}
                  <Link
                    className="flex w-full items-center py-2 text-lg font-semibold"
                    href="/library"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Mes Livres
                  </Link>
                  <Link
                    className="flex w-full items-center py-2 text-lg font-semibold"
                    href="/groups"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Groupes de Lecture
                  </Link>
                  <Link
                    className="flex w-full items-center py-2 text-lg font-semibold"
                    href="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
                  {theme === 'light' && <FaSun className="h-5 w-5" />}
                  {theme === 'dark' && <FaMoon className="h-5 w-5" />}
                  {theme === 'system' && <FaDesktop className="h-5 w-5" />}
                  {!theme && <FaDesktop className="h-5 w-5" />}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <FaSun className="mr-2 h-4 w-4" />
                  Clair
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <FaMoon className="mr-2 h-4 w-4" />
                  Sombre
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <FaDesktop className="mr-2 h-4 w-4" />
                  Système
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                    <AvatarFallback>{getInitials(profile?.username || 'U')}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                      <FaUser className="mr-2 h-4 w-4" />
                      Mon Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Plan actuel : {isSubscriptionLoading ? 'Chargement...' : (subscription?.planId === FREE_PLAN_ID ? 'Gratuit' : 'Premium')}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/subscription" className="flex items-center">
                    Gérer mon abonnement
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
