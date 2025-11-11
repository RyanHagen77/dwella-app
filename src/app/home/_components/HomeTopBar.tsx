"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type Home = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
};

export default function HomeTopBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [homes, setHomes] = useState<Home[]>([]);
  const [currentHomeId, setCurrentHomeId] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Extract homeId from URL
  useEffect(() => {
    const match = pathname?.match(/\/home\/([^\/]+)/);
    if (match) {
      setCurrentHomeId(match[1]);
      localStorage.setItem('lastHomeId', match[1]);
    }
  }, [pathname]);

  // Fetch user's homes
  useEffect(() => {
    async function fetchHomes() {
      try {
        const res = await fetch('/api/user/homes');
        if (res.ok) {
          const data = await res.json();
          setHomes(data.homes || []);
        }
      } catch (error) {
        console.error('Failed to fetch homes:', error);
      }
    }
    if (session?.user?.id) {
      fetchHomes();
    }
  }, [session?.user?.id]);

  const currentHome = homes.find(h => h.id === currentHomeId);
  const hasMultipleHomes = homes.length > 1;

  function formatAddress(home: Home) {
    return `${home.address}${home.city ? `, ${home.city}` : ''}${home.state ? `, ${home.state}` : ''}`;
  }

  function switchHome(homeId: string) {
    setSwitcherOpen(false);
    router.push(`/home/${homeId}`);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href={currentHomeId ? `/home/${currentHomeId}` : "/"}
              className="inline-flex items-center gap-3 shrink-0 group"
            >
              <Image
                src="/myhomedox_logo.png"
                alt="MyHomeDox"
                width={160}
                height={44}
                priority
                className="h-7 w-auto sm:h-9 transition-opacity group-hover:opacity-90"
                sizes="(min-width: 640px) 160px, 120px"
              />
            </Link>

            {/* Current Home Selector (if multiple homes) */}
            {hasMultipleHomes && currentHome && (
              <button
                onClick={() => setSwitcherOpen(true)}
                className="hidden md:flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15 transition-colors max-w-xs"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 flex-shrink-0"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span className="truncate">{formatAddress(currentHome)}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 flex-shrink-0"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
              </button>
            )}

            {/* Right side navigation */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Account Menu */}
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15 transition-colors"
                >
                  {/* User avatar/icon */}
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">
                    {session?.user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`w-4 h-4 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {accountMenuOpen && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setAccountMenuOpen(false)}
                    />

                    {/* Menu content */}
                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-white/20 bg-black/90 backdrop-blur-xl shadow-xl z-50">
                      <div className="p-3 border-b border-white/10">
                        <p className="text-sm text-white/90 font-medium truncate">
                          {session?.user?.name || 'Account'}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {session?.user?.email}
                        </p>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => {
                            router.push(`/account${currentHomeId ? `?homeId=${currentHomeId}` : ''}`);
                            setAccountMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Account Settings
                        </button>

                        {hasMultipleHomes && (
                          <button
                            onClick={() => {
                              setSwitcherOpen(true);
                              setAccountMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                            </svg>
                            Switch Home
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login?role=homeowner" })}
                className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Home Switcher Modal */}
      {switcherOpen && (
        <HomeSwitcherModal
          homes={homes}
          currentHomeId={currentHomeId}
          onSwitch={switchHome}
          onClose={() => setSwitcherOpen(false)}
        />
      )}
    </>
  );
}

// Home Switcher Modal
function HomeSwitcherModal({
  homes,
  currentHomeId,
  onSwitch,
  onClose,
}: {
  homes: Home[];
  currentHomeId: string | null;
  onSwitch: (homeId: string) => void;
  onClose: () => void;
}) {
  function formatAddress(home: Home) {
    return `${home.address}${home.city ? `, ${home.city}` : ''}${home.state ? `, ${home.state}` : ''}`;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[70]">
        <div className="mx-4 rounded-xl border border-white/20 bg-black/90 backdrop-blur-xl shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Switch Home</h2>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {homes.map((home) => (
                <button
                  key={home.id}
                  onClick={() => onSwitch(home.id)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    home.id === currentHomeId
                      ? 'bg-white/15 border-2 border-white/30'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-white/70 flex-shrink-0 mt-0.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{formatAddress(home)}</p>
                      {home.id === currentHomeId && (
                        <p className="text-xs text-green-400 mt-1">Current home</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}