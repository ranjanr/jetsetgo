import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import fs from "fs";
import path from "path";

export async function GET() {
  const diagnostics: any = {
    env: {
      has_kv_url: !!process.env.KV_REST_API_URL,
      has_kv_token: !!process.env.KV_REST_API_TOKEN,
      has_blob_token: !!process.env.BLOB_READ_WRITE_TOKEN,
      node_env: process.env.NODE_ENV
    },
    kv: {
      success: false,
      error: null,
      test_read: null
    },
    fs: {
      write_success: false,
      write_error: null
    }
  };

  // Test KV connection
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      await kv.set("diagnostic_test_key", { ok: true, time: new Date().toISOString() }, { ex: 30 });
      const readVal = await kv.get("diagnostic_test_key");
      diagnostics.kv.success = true;
      diagnostics.kv.test_read = readVal;
    } catch (err: any) {
      diagnostics.kv.error = err.message;
    }
  } else {
    diagnostics.kv.error = "Vercel KV environment variables are not set.";
  }

  // Test local FS write
  try {
    const testPath = path.join(process.cwd(), "users", "diagnostic_test.json");
    const testDir = path.dirname(testPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testPath, JSON.stringify({ ok: true }), "utf8");
    diagnostics.fs.write_success = true;
    fs.unlinkSync(testPath); // clean up
  } catch (err: any) {
    diagnostics.fs.write_error = err.message;
  }

  return NextResponse.json(diagnostics);
}

export const dynamic = "force-dynamic";
