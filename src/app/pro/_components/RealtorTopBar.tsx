"use client";

import { useEffect, useState } from "react";
import { GlobalHeader, TopBarLink } from "@/components/GlobalHeader";

type RealtorData = {
  listings: Array<{ id: string }>;
  requests: Array<{ id: string; state: "requested" | "pending" | "received" }>;
  reports: Array<{ id: string; state: "requested" | "pending" | "received" }>;
  buyers?: Array<{ id: string }>;
};

export default function RealtorTopBar() {
  const [counts, setCounts] = useState({ listings: 0, pending: 0, reports: 0, clients: 0 });

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("realtorData") : null;
    const db = raw ? (JSON.parse(raw) as RealtorData) : null;

    const listings = db?.listings?.length ?? 0;
    const pending =
      (db?.requests?.filter(r => r.state === "pending").length ?? 0) +
      (db?.reports?.filter(r => r.state === "pending").length ?? 0);
    const reports = db?.reports?.filter(r => r.state !== "received").length ?? 0;
    const clients = db?.buyers?.length ?? 0;

    setCounts({ listings, pending, reports, clients });
  }, []);

  const links: TopBarLink[] = [
    { href: "/pro/realtor", label: "Dashboard" },
    { href: "/pro/realtor/listings", label: "Listings", badge: counts.listings },
    { href: "/pro/realtor/clients", label: "Clients", badge: counts.clients, tone: "sky" },
    { href: "/pro/realtor/calendar", label: "Calendar" },
    { href: "/pro/realtor/reports", label: "Reports", badge: counts.reports },
    { href: "/pro/realtor/requests", label: "Requests", badge: counts.pending, tone: "sky" },
    { href: "/pro/realtor/profile", label: "Account" },
  ];

  return <GlobalHeader links={links} srBrand="MyHomeDox Realtor" logoAlt="MyHomeDox" />;
}
