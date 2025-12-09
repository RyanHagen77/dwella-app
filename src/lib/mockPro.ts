// src/lib/mockPro.ts
import { lookupByAddress } from "./mock";

export type ProData = {
  pro: { id:string; business:string; category:string; rating:number; verified:boolean; logo?:string };
  jobs: { id:string; title:string; clientAddress:string; due:string; status:"requested"|"scheduled"|"in_progress"|"complete"; estAmount?:number }[];
  records: { id:string; title:string; date:string; address:string; amount?:number }[];
  clients: { id:string; address:string; sharedLink:string; owner?:string }[];
  reviews: { id:string; author:string; rating:number; text:string; date:string }[];
};

export async function buildProDataFromAddress(address: string): Promise<ProData> {
  const seed = (s:string)=>Math.abs([...s].reduce((h,c)=>(h^c.charCodeAt(0))*16777619,2166136261));
  const { property, records, vendors } = await lookupByAddress(address);

  // pick (or synthesize) a pro from the vendor list
  const primary = vendors[0] ?? { id:"pro1", name:"Local Pro", type:"General", rating:4.6, verified:false };
  const business = primary.name;
  const category = primary.type;
  const verified = !!primary.verified;
  const rating = primary.rating ?? 4.6;

  // derive a few document-completed-service-submissions-records-records from homeowner records (future → active)
  const today = new Date();
  const addDays = (n:number)=>{ const d=new Date(today); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };

  const services = [
    { id:"j1", title:"Seasonal HVAC Tune-up", clientAddress: address, due: addDays(2), status:"scheduled", estAmount:180 },
    { id:"j2", title:"Filter Replacement", clientAddress: address, due: addDays(7), status:"requested" as const },
    { id:"j3", title:"Warranty Check", clientAddress: address, due: addDays(10), status:"in_progress" as const, estAmount:120 },
  ];

  // past document-completed-service-submissions-records-records from homeowner records
  const recs = records.slice(0,3).map(r=>({
    id: r.id, title: r.category, date: r.date, address, amount: r.cost
  }));

  const clients = [
    { id:"c1", address, sharedLink:`/report?h=${encodeURIComponent(property.id)}`, owner:"Owner" },
  ];

  const reviews = [
    { id:"rev1", author:"Homeowner", rating:5, text:"On time and professional.", date:addDays(-14) },
    { id:"rev2", author:"Neighbor", rating:4, text:"Clean install, fair price.", date:addDays(-30) },
  ];

  return {
    pro: { id: `pro_${seed(business)}`, business, category, rating, verified, logo: "/logo-placeholder.svg" },
    services, records: recs, clients, reviews
  };
}
