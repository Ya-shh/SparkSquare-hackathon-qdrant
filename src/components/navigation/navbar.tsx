"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiFolder,
  FiPlus,
  FiMenu,
  FiX,
  FiUser,
  FiLogIn,
  FiLogOut,
  FiHeart,
  FiBell,
  FiMessageSquare,
} from "react-icons/fi";
import Image from "next/image";
import NotificationPanel from "../NotificationPanel";
import ThemeToggle from "../ui/ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800">
      <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          {}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group" onClick={closeMenu}>
              <Image 
                src="/sparksquare-icon.svg" 
                alt="SparkSquare Logo" 
                width={32} 
                height={32} 
                className="mr-2" 
              />
              <span className="text-xl font-bold text-white">SparkSquare</span>
            </Link>
            <nav className="hidden md:flex ml-10 space-x-1">
              <NavLink href="/" active={isActive("/")} onClick={closeMenu}>
                <FiHome className="mr-2" />
                Home
              </NavLink>
              <NavLink href="/categories" active={isActive("/categories")} onClick={closeMenu}>
                <FiFolder className="mr-2" />
                Categories
              </NavLink>
              <NavLink href="/posts/create" active={isActive("/posts/create")} onClick={closeMenu}>
                <FiPlus className="mr-2" />
                New Post
              </NavLink>
              <NavLink href="/categories" active={isActive("/discussions")} onClick={closeMenu}>
                <FiMessageSquare className="mr-2" />
                Discussions
              </NavLink>
            </nav>
          </div>

          {}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {session ? (
              <div className="flex items-center space-x-3">
                <NotificationPanel />
                
                <div className="relative group">
                  <Link
                    href={`/users/${session.user.username || session.user.id}`}
                    className="flex items-center space-x-1"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="h-8 w-8 rounded-full object-cover border border-gray-700"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {session.user.name?.charAt(0) || session.user.username?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      {session.user.name || session.user.username}
                    </span>
                  </Link>

                  <div className="absolute right-0 mt-2 w-48 hidden group-hover:block">
                    <div className="py-2 rounded-lg bg-gray-800 border border-gray-700 shadow-lg">
                      <Link 
                        href={`/users/${session.user.username || session.user.id}`}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        <FiUser className="inline-block mr-2" /> Profile
                      </Link>
                      <Link 
                        href={`/users/${session.user.username || session.user.id}/bookmarks`}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        <FiHeart className="inline-block mr-2" /> Bookmarks
                      </Link>
                      <div className="border-t border-gray-700 my-1"></div>
                      <button 
                        onClick={() => signOut()}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        <FiLogOut className="inline-block mr-2" /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/sign-in" 
                  className="text-sm font-medium px-4 py-2 rounded-md text-white border border-gray-700 hover:bg-gray-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/sign-up" 
                  className="text-sm font-medium px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {isOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {}
      <div className={`md:hidden ${isOpen ? "block" : "hidden"}`}>
        <div className="px-4 pt-3 pb-5 space-y-2 bg-gray-900 border-t border-gray-800">
          
          <MobileNavLink href="/" active={isActive("/")} onClick={closeMenu}>
            <FiHome className="mr-3" />
            Home
          </MobileNavLink>
          <MobileNavLink href="/categories" active={isActive("/categories")} onClick={closeMenu}>
            <FiFolder className="mr-3" />
            Categories
          </MobileNavLink>
          <MobileNavLink href="/posts/create" active={isActive("/posts/create")} onClick={closeMenu}>
            <FiPlus className="mr-3" />
            New Post
          </MobileNavLink>
          <MobileNavLink href="/categories" active={isActive("/discussions")} onClick={closeMenu}>
            <FiMessageSquare className="mr-3" />
            Discussions
          </MobileNavLink>
          
          <div className="pt-3 pb-1">
            <div className="border-t border-gray-800" />
          </div>

          {session ? (
            <>
              <div className="flex items-center p-2 mb-2">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-10 w-10 rounded-full object-cover border border-gray-700"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-base font-semibold text-white">
                      {session.user.name?.charAt(0) || session.user.username?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{session.user.name || session.user.username}</p>
                  <p className="text-xs text-gray-400">{session.user.email}</p>
                </div>
              </div>
              <MobileNavLink
                href={`/users/${session.user.username || session.user.id}`}
                active={isActive(`/users/${session.user.username || session.user.id}`)}
                onClick={closeMenu}
              >
                <FiUser className="mr-3" />
                Profile
              </MobileNavLink>
              <MobileNavLink
                href={`/users/${session.user.username || session.user.id}/bookmarks`}
                active={isActive(`/users/${session.user.username || session.user.id}/bookmarks`)}
                onClick={closeMenu}
              >
                <FiHeart className="mr-3" />
                Bookmarks
              </MobileNavLink>
              <button
                onClick={() => {
                  signOut();
                  closeMenu();
                }}
                className="w-full flex items-center px-3 py-2.5 text-sm rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <FiLogOut className="mr-3" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <div className="p-2">
                <Link 
                  href="/sign-in" 
                  onClick={closeMenu}
                  className="block w-full text-center mb-2 px-3 py-2 text-sm rounded-md text-white border border-gray-700 hover:bg-gray-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/sign-up" 
                  onClick={closeMenu}
                  className="block w-full text-center px-3 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink = ({ href, active, children, onClick }: NavLinkProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-300 hover:text-white hover:bg-gray-800"
      }`}
    >
      {children}
    </Link>
  );
};

const MobileNavLink = ({ href, active, children, onClick }: NavLinkProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-3 py-2.5 text-sm rounded-md transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-300 hover:text-white hover:bg-gray-800"
      }`}
    >
      {children}
    </Link>
  );
}; 