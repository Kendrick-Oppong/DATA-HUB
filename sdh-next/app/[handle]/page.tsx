import PublicStore from "@/components/public-store";

// Public agent storefront at smartdatahubgh.com/<handle>. Every reseller's shareable
// store link resolves here. Rendered fresh per request (store config is fetched client-side).
export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { handle: string } }) {
  return <PublicStore handle={params.handle} />;
}
