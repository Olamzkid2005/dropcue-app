import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LegacyProductDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/products/${id}/edit`);
}
