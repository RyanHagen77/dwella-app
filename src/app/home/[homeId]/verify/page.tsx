// app/home/[homeId]/verify/page.tsx

import VerifyHomeClient from "./VerifyHomeClient";

type PageProps = {
  params: { homeId: string };
};

export default function VerifyHomePage({ params }: PageProps) {
  return <VerifyHomeClient homeId={params.homeId} />;
}