// app/pro/record/[Id]/page.tsx
import JobRecordClient from "./JobRecordClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>; // Next 15 passes params as a Promise
}) {
  const { id } = await params;     // unwrap
  return <JobRecordClient id={id} />;
}
