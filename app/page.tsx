import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Board } from "@/components/Board";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sb = createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  return <Board />;
}
