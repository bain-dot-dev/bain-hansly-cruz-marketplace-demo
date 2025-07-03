"use client";

import Link from "next/link";
import { Facebook, Plus, Mail, Bell, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1877F2] rounded-full flex items-center justify-center">
              <Facebook className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:block">
              Marketplace
            </span>
          </Link>

          {/* Right side icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/create">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 sm:space-x-2 bg-transparent px-2 sm:px-3"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </Link>
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Mail className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="w-5 h-5" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
