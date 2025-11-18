"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClaimHomeModal } from "./ClaimHomeModal";

type Home = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
};

export function HomePicker({
  currentHomeId,
  initialAddress,
}: {
  currentHomeId: string;
  initialAddress: string;
}) {
  const router = useRouter();

  const [homes, setHomes] = React.useState<Home[]>([]);
  const [open, setOpen] = React.useState(false);
  const [claimOpen, setClaimOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchHomes() {
      try {
        const res = await fetch("/api/user/homes");
        if (!res.ok) return;
        const data = await res.json();
        setHomes(data.homes || []);
      } catch (err) {
        console.error("Failed to fetch homes", err);
      }
    }
    fetchHomes();
  }, []);

  const currentHome =
    homes.find((h) => h.id === currentHomeId) ||
    (homes.length > 0 ? homes[0] : null);

  function formatAddress(home: Home) {
    return `${home.address}${home.city ? `, ${home.city}` : ""}${
      home.state ? `, ${home.state}` : ""
    }${home.zip ? ` ${home.zip}` : ""}`;
  }

  const displayAddress =
    currentHome != null ? formatAddress(currentHome) : initialAddress;

  async function switchHome(homeId: string) {
    setOpen(false);

    try {
      await fetch("/api/user/last-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeId }),
      });
    } catch (err) {
      console.error("Failed to update last home", err);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("lastHomeId", homeId);
    }

    router.push(`/home/${homeId}`);
  }

  return (
    <>
      {/* wrapper gets its own stack level */}
      <div className="relative z-[30] w-full max-w-sm text-left">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-xs sm:text-sm text-white hover:bg-black/50 backdrop-blur-sm"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/12 flex-shrink-0">
            <HomeGlyph />
          </span>

          <span className="flex-1 min-w-0 truncate text-left">
            {displayAddress}
          </span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 flex-shrink-0 transition-transform"
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

        {open && (
          <>
            {/* backdrop over page but under menu */}
            <div
              className="fixed inset-0 z-[40]"
              onClick={() => setOpen(false)}
            />

            {/* dropdown itself */}
            <div
              className="absolute left-0 top-full z-[50] mt-2
                         w-[min(320px,calc(100vw-3rem))]
                         rounded-2xl border border-white/15 bg-black/90
                         backdrop-blur-xl shadow-2xl"
            >
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                  Your homes
                </p>
              </div>

              <div className="max-h-72 space-y-1 overflow-y-auto px-2 py-2">
                {homes.map((home) => {
                  const isCurrent = home.id === currentHomeId;
                  return (
                    <button
                      key={home.id}
                      type="button"
                      onClick={() => switchHome(home.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        isCurrent
                          ? "bg-white/15 border-white/35"
                          : "bg-white/5 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <p className="truncate text-white">
                        {formatAddress(home)}
                      </p>
                      {isCurrent && (
                        <p className="mt-1 text-xs text-emerald-300">
                          Current home
                        </p>
                      )}
                    </button>
                  );
                })}

                {homes.length === 0 && (
                  <p className="px-3 py-2 text-xs text-white/70">
                    No homes yet. Add your first home to get started.
                  </p>
                )}
              </div>

              <div className="border-t border-white/10 px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setClaimOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20"
                >
                  <span className="text-base leading-none">＋</span>
                  <span>Add another home</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ClaimHomeModal
        open={claimOpen}
        onCloseAction={() => {
          setClaimOpen(false);
          fetch("/api/user/homes")
            .then((res) => res.json())
            .then((data) => setHomes(data.homes || []))
            .catch(console.error);
        }}
      />
    </>
  );
}

/** Mini logo-style house icon */
function HomeGlyph() {
  return (
    <svg viewBox="0 0 72 72" className="h-5 w-5" aria-hidden="true">
      <path
        d="M18 52C16.343 52 15 50.657 15 49V27.414C15 26.52 15.36 25.661 16 25.02L35.586 5.434C36.367 4.653 37.633 4.653 38.414 5.434L58 25.02C58.64 25.661 59 26.52 59 27.414V49C59 50.657 57.657 52 56 52H42C40.343 52 39 50.657 39 49V39H25V49C25 50.657 23.657 52 22 52H18Z"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M32.5 34L40 41.5L54 27.5"
        stroke="#33C17D"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}