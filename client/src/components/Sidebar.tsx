
'use client'

import { FaHome, FaSearch, FaBook, FaUser, FaUsers } from 'react-icons/fa';
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Initial fetch
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white w-64 p-4 shadow-lg">
      <div className="text-2xl font-bold mb-8">
        Codex
      </div>
      <nav className="flex-grow">
        <ul className="space-y-4">
          <li>
            <Link href="/dashboard" className="flex items-center text-lg hover:text-gray-300 transition duration-300">
              <FaHome className="mr-3" /> Dashboard
            </Link>
          </li>
          <li>
            <Link href="/discover" className="flex items-center text-lg hover:text-gray-300 transition duration-300">
              <FaSearch className="mr-3" /> Découvrir
            </Link>
          </li>
          <li>
            <Link href="/library" className="flex items-center text-lg hover:text-gray-300 transition duration-300">
              <FaBook className="mr-3" /> Mes Livres
            </Link>
          </li>
          <li>
            <Link href="/groups" className="flex items-center text-lg hover:text-gray-300 transition duration-300">
              <FaUsers className="mr-3" /> Groupes de Lecture
            </Link>
          </li>
          <li>
            <Link href="/account" className="flex items-center text-lg hover:text-gray-300 transition duration-300">
              <FaUser className="mr-3" /> Mon Profil
            </Link>
          </li>
        </ul>
      </nav>
      <div className="mt-auto">
        {user && (
          <button onClick={handleSignOut} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
            Déconnexion
          </button>
        )}
      </div>
    </div>
  );
}
