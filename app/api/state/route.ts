import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const sql = getSql();
    const rows = (await sql`
      SELECT data, updated_at FROM wandersail_state WHERE id = 1
    `) as { data: unknown; updated_at: string }[];
    if (rows.length === 0) {
      return NextResponse.json({ data: null, updatedAt: null });
    }
    return NextResponse.json({ data: rows[0].data, updatedAt: rows[0].updated_at });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sql = getSql();
    const body = (await req.json()) as { data: unknown };
    if (!body || typeof body !== "object" || !("data" in body)) {
      return NextResponse.json({ error: "Missing 'data' in body" }, { status: 400 });
    }
    const serialized = JSON.stringify(body.data);
    await sql`
      INSERT INTO wandersail_state (id, data, updated_at)
      VALUES (1, ${serialized}::jsonb, now())
      ON CONFLICT (id) DO UPDATE
      SET data = ${serialized}::jsonb, updated_at = now()
    `;
    return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
