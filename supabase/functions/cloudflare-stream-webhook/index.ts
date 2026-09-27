import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("CLOUDFLARE_STREAM_WEBHOOK_SECRET")!;

async function verify(body:string, header:string|null) {
  if (!webhookSecret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map(v => v.split("=").map(x => x.trim())));
  const time = parts.time, sig = parts.sig1;
  if (!time || !sig) return false;
  const age = Math.abs(Date.now()/1000 - Number(time));
  if (!Number.isFinite(age) || age > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(webhookSecret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(time+"."+body));
  const expected = Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
  return expected === sig;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", {status:405});
  const body = await req.text();
  if (!(await verify(body, req.headers.get("Webhook-Signature")))) return new Response("Invalid signature", {status:401});
  const payload = JSON.parse(body);
  const admin = createClient(supabaseUrl, serviceKey);
  const mediaId = payload?.meta?.media_id;
  if (!mediaId) return new Response("Ignored", {status:202});
  const ready = payload?.readyToStream === true && payload?.status?.state === "ready";
  const failed = payload?.status?.state === "error";
  const update:any = failed ? {processing_status:"failed"} : ready ? {processing_status:"ready", playback_url:payload?.playback?.hls || null, thumbnail_path:payload?.thumbnail || null} : {processing_status:"processing"};
  const {error} = await admin.from("post_media").update(update).eq("id", mediaId);
  if (error) return new Response(JSON.stringify({error:error.message}), {status:500,headers:{"content-type":"application/json"}});
  return new Response("OK");
});