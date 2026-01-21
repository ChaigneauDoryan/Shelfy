'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Users, MessageCircle, User } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { FaDesktop, FaMoon, FaSun } from 'react-icons/fa';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/library', label: 'Livres', Icon: BookOpen },
  { href: '/groups', label: 'Groupes', Icon: Users },
  { href: '/contact', label: 'Contact', Icon: MessageCircle },
] as const;

interface MobileBottomTabsProps {
  activePath?: string;
}

export function MobileBottomTabs({ activePath }: MobileBottomTabsProps) {
  const { data: session } = useSession();
  const profile = session?.user;
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  let pathname: string | null = null;
  try {
    pathname = usePathname();
  } catch (error) {
    if (!activePath && process.env.NODE_ENV !== 'production') {
      console.warn('MobileBottomTabs: usePathname is unavailable outside the Next.js router context.', error);
    }
  }
  const currentPath = activePath ?? pathname ?? '/';

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      data-testid="mobile-bottom-tabs"
    >
      <ul className="flex items-center justify-between gap-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = currentPath.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium transition-colors',
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => setAccountSheetOpen(true)}
            className="flex w-full flex-col items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {profile ? (
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile.image || undefined} alt={profile.name || 'Profil'} />
                <AvatarFallback>{profile.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}</AvatarFallback>
              </Avatar>
            ) : (
              <User className="h-5 w-5" aria-hidden />
            )}
            <span>Compte</span>
          </button>
        </li>
      </ul>
      <Sheet open={accountSheetOpen} onOpenChange={setAccountSheetOpen}>
        <SheetContent side="bottom" className="pb-8 pt-6">
          <SheetHeader>
            <SheetTitle className="text-left text-lg">Mon compte</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            {profile && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3 text-foreground">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.image || undefined} alt={profile.name || 'Profil'} />
                  <AvatarFallback>{profile.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold text-foreground">Thème</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={theme === 'light' ? 'default' : 'secondary'}
                  className="h-10 w-full gap-2"
                  onClick={() => setTheme('light')}
                >
                  <FaSun className="h-4 w-4" />
                  Clair
                </Button>
                <Button
                  type="button"
                  variant={theme === 'dark' ? 'default' : 'secondary'}
                  className="h-10 w-full gap-2"
                  onClick={() => setTheme('dark')}
                >
                  <FaMoon className="h-4 w-4" />
                  Sombre
                </Button>
                <Button
                  type="button"
                  variant={theme === 'system' ? 'default' : 'secondary'}
                  className="h-10 w-full gap-2"
                  onClick={() => setTheme('system')}
                >
                  <FaDesktop className="h-4 w-4" />
                  Auto
                </Button>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/subscription" onClick={() => setAccountSheetOpen(false)}>
                Gérer mon abonnement
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/profile" onClick={() => setAccountSheetOpen(false)}>
                Voir mon profil
              </Link>
            </Button>
          </div>
          <SheetFooter className="mt-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Déconnexion
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
