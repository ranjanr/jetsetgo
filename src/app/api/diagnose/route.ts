import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";

export async function GET() {
  const diagnostics = {
    has_vercel_kv: !!process.env.KV_REST_API_URL,
    has_upstash_redis: !!process.env.UPSTASH_REDIS_REST_URL,
    redis_test: {
      ok: false,
      error: null as string | null,
      val: null as any
    }
  };

  try {
    await kv.set("test_diagnose_key", "hello", { ex: 10 });
    const val = await kv.get("test_diagnose_key");
    diagnostics.redis_test.ok = true;
    diagnostics.redis_test.val = val;
  } catch (err: any) {
    diagnostics.redis_test.error = err.message;
  }

  return NextResponse.json(diagnostics);
}

export const dynamic = "force-dynamic";
