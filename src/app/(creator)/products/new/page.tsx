import { redirect } from "next/navigation";

export default function OldNewProductPage() {
  redirect("/dashboard/products/new");
}
