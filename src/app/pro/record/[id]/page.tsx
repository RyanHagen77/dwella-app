// app/pro/record/[Id]/page.tsx
import ServiceRecordClient from "./ServiceRecordClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>; // Next 15 passes params as a Promise
}) {
  const { id } = await params;     // unwrap
  return <ServiceRecordClient id={id} />;
}
