"use client";

import Link from "next/link";
import Image from "next/image";
import { User, Home, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "@workos-inc/authkit-nextjs";

interface ProfileMenuProps {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    profilePictureUrl?: string | null;
  };
}

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none"
      >
        {user?.profilePictureUrl ? (
          <Image
            className="h-8 w-8 rounded-full cursor-pointer border-2 border-gray-700 hover:border-gray-500 transition-colors"
            src={user.profilePictureUrl}
            alt="Profile"
            width={32}
            height={32}
          />
        ) : (
          <div className="h-8 w-8 rounded-full cursor-pointer border-2 border-gray-700 hover:border-gray-500 transition-colors bg-gray-800 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-lg border border-gray-800 py-1 z-50">
          <div className="flex items-center gap-3 p-3 border-b border-gray-800">
            {user?.profilePictureUrl ? (
              <Image
                className="h-8 w-8 rounded-full"
                src={user.profilePictureUrl}
                alt="Profile"
                width={32}
                height={32}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-100 truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || "User"}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="border-t border-gray-800 py-1">
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
