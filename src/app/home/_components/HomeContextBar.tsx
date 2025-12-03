"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClaimHomeModal } from "./ClaimHomeModal";

type Home = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
};

function formatAddress(home: Home) {
  return `${home.address}${
    home.city ? `, ${home.city}` : ""
  }${home.state ? `, ${home.state}` : ""}${
    home.zip ? ` ${home.zip}` : ""
  }`;
}

function HomeContextBarInner() {
  const router = useRouter();
  const pathname = usePathname();

  const [homes, setHomes] = useState<Home[]>([]);
  const [currentHomeId, setCurrentHomeId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  // derive current home from URL when on /home/[homeId]
  useEffect(() => {
    const match = pathname?.match(/\/home\/([^/]+)/);
    if (match) {
      setCurrentHomeId(match[1]);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lastHomeId", match[1]);
      }
    } else if (typeof window !== "undefined") {
      // non-home pages: use last visited if available
      const last = window.localStorage.getItem("lastHomeId");
      if (last) setCurrentHomeId(last);
    }
  }, [pathname]);

  // fetch homes once
  useEffect(() => {
    async function loadHomes() {
      try {
        const res = await fetch("/api/user/homes");
        if (!res.ok) return;
        const data = await res.json();
        setHomes(data.homes || []);
      } catch (err) {
        console.error("Failed to fetch homes", err);
      }
    }
    loadHomes();
  }, []);

  const currentHome = homes.find((h) => h.id === currentHomeId) ?? homes[0];

  async function switchHome(homeId: string) {
    setPickerOpen(false);
    setCurrentHomeId(homeId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("lastHomeId", homeId);
    }

    try {
      await fetch("/api/user/last-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeId }),
      });
    } catch (err) {
      console.error("Failed to update last home", err);
    }

    // only push when we’re not already on that home
    if (!pathname?.startsWith(`/home/${homeId}`)) {
      router.push(`/home/${homeId}`);
    }
  }

  return (
    <>
      {/* BAR: sits above the hero card */}
      <div className="relative z-[60] mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-5 md:px-6 pt-2 md:pt-3">
        {/* picker */}
        <div className="relative z-[70] w-full max-w-md">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-full border border-white/25 bg-black/35 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-md"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
              <HomeTraceHouseIcon className="h-4 w-4" />
            </span>
            <span className="flex-1 truncate text-left">
              {currentHome ? formatAddress(currentHome) : "Select a home"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${
                pickerOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {pickerOpen && (
            <>
              {/* backdrop above page but under dropdown */}
              <div
                className="fixed inset-0 z-[75]"
                onClick={() => setPickerOpen(false)}
              />
              {/* dropdown itself – ABOVE hero buttons */}
              <div className="absolute left-0 top-full z-[80] mt-2 w-[min(360px,calc(100vw-3rem))] rounded-2xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                  Your homes
                </div>
                <div className="max-h-80 overflow-y-auto px-2 pb-2">
                  {homes.map((home) => (
                    <button
                      key={home.id}
                      type="button"
                      onClick={() => switchHome(home.id)}
                      className={`mb-1 flex w-full flex-col items-start rounded-xl px-3 py-2 text-left text-sm ${
                        home.id === currentHome?.id
                          ? "bg-white/15 text-white"
                          : "bg-white/5 text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <span className="truncate">{formatAddress(home)}</span>
                      {home.id === currentHome?.id && (
                        <span className="mt-0.5 text-xs text-emerald-300">
                          Current home
                        </span>
                      )}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      setClaimOpen(true);
                    }}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/30 bg-transparent px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                      +
                    </span>
                    Add another home
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* right-side CTA – keep small and only show from sm+ */}
        <button
          type="button"
          onClick={() => setClaimOpen(true)}
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-xs">
            +
          </span>
          Add home
        </button>
      </div>

      {/* small spacer so the bar doesn’t overlap the hero card */}
      <div className="h-2" />

      <ClaimHomeModal
        open={claimOpen}
        onCloseAction={() => setClaimOpen(false)}
      />
    </>
  );
}

/** Just the little house outline from our logo */
function HomeTraceHouseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 11.5V18a1 1 0 0 0 1 1h3v-4h6v4h3a1 1 0 0 0 1-1v-6.5a1 1 0 0 0-.34-.75l-7-6a1 1 0 0 0-1.32 0l-7 6A1 1 0 0 0 5 11.5z"
        fill="none"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeContextBar() {
  return <HomeContextBarInner />;
}

export default HomeContextBar;
export { HomeContextBar };