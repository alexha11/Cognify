"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { CognifyLogo } from "@/components/ui/cognify-logo";

export function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <CognifyLogo size={40} />
        </Link>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/organizations"
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#F2B84B] after:transition-all after:duration-300 hover:after:w-full"
            >
              Organizations
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {!user && !isLoading ? (
              <>
                <Link href="/login">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="rounded-full bg-zinc-950 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="rounded-full bg-zinc-950 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md"
                >
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
