import { NextResponse } from "next/server";

export async function GET() {
  const keys = Object.keys(process.env).filter(key => 
    key.toLowerCase().includes("redis") || 
    key.toLowerCase().includes("kv") || 
    key.toLowerCase().includes("blob") ||
    key.toLowerCase().includes("url") ||
    key.toLowerCase().includes("token")
  );
  
  return NextResponse.json({ 
    env_keys: Object.keys(process.env),
    filtered_keys: keys
  });
}

export const dynamic = "force-dynamic";
