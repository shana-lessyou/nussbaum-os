/**
 * DELETE /api/tasks/[id] — agent-side delete after archiving.
 * Auth: x-agent-secret header. Scoped to AGENT_USER_ID.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { checkAgentSecret } from "../route";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = checkAgentSecret(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const id = params.id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tasks")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });

  return NextResponse.json({ ok: true, deleted: id });
}
