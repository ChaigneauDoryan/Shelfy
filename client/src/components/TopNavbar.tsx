'use client'

import { FaHome, FaSearch, FaBook, FaUser, FaUsers, FaBars, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface TopNavbarProps {
  user: User | null;
  profile: { username: string; avatar_url: string } | null;
  onSignOut: () => void;
}

export default function TopNavbar({ user, profile, onSignOut }: TopNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gray-800 text-white py-2 px-4 md:px-6 shadow-lg rounded-xl mx-auto mt-4 flex items-center gap-x-8 relative">
      <div className="text-xl font-bold">
        Codex
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex flex-grow space-x-10">
        <Link href="/dashboard" className="flex items-center text-base hover:text-gray-300 transition duration-300">
          <FaHome className="mr-2" /> Dashboard
        </Link>
        <Link href="/discover" className="flex items-center text-base hover:text-gray-300 transition duration-300">
          <FaSearch className="mr-2" /> Découvrir
        </Link>
        <Link href="/library" className="flex items-center text-base hover:text-gray-300 transition duration-300">
          <FaBook className="mr-2" /> Mes Livres
        </Link>
        <Link href="/groups" className="flex items-center text-base hover:text-gray-300 transition duration-300">
          <FaUsers className="mr-2" /> Groupes de Lecture
        </Link>
        <Link href="/profile" className="flex items-center text-base hover:text-gray-300 transition duration-300">
          <FaUser className="mr-2" /> Mon Profil
        </Link>
      </div>

      {/* Desktop Sign Out Button */}
      <div className="hidden md:block">
        {user && (
          <Button onClick={onSignOut} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
            Déconnexion
          </Button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center ml-auto">
        <button onClick={toggleMenu} className="text-white focus:outline-none">
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-gray-800 shadow-lg rounded-b-xl py-4 z-50">
          <div className="flex flex-col items-center space-y-4">
            <Link href="/dashboard" className="flex items-center text-lg hover:text-gray-300 transition duration-300" onClick={toggleMenu}>
              <FaHome className="mr-2" /> Dashboard
            </Link>
            <Link href="/discover" className="flex items-center text-lg hover:text-gray-300 transition duration-300" onClick={toggleMenu}>
              <FaSearch className="mr-2" /> Découvrir
            </Link>
            <Link href="/library" className="flex items-center text-lg hover:text-gray-300 transition duration-300" onClick={toggleMenu}>
              <FaBook className="mr-2" /> Mes Livres
            </Link>
            <Link href="/groups" className="flex items-center text-lg hover:text-gray-300 transition duration-300" onClick={toggleMenu}>
              <FaUsers className="mr-2" /> Groupes de Lecture
            </Link>
            <Link href="/dashboard/profile" className="flex items-center text-lg hover:text-gray-300 transition duration-300" onClick={toggleMenu}>
              <FaUser className="mr-2" /> Mon Profil
            </Link>
            {user && (
              <Button onClick={() => { onSignOut(); toggleMenu(); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 w-auto">
                Déconnexion
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}