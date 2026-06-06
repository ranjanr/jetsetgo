import { createClient, kv as defaultKv } from "@vercel/kv";

const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const kv = (kvUrl && kvToken)
  ? createClient({ url: kvUrl, token: kvToken })
  : defaultKv;
