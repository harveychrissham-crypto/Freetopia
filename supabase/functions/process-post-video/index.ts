import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cloudflareAccountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
const cloudflareToken = Deno.env.get("CLOUDFLARE_API_TOKEN");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return new Response("Unauthorized", { status: 401 });
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => null);
  const mediaId = body?.media_id;
  if (!mediaId) return new Response(JSON.stringify({ error: "media_id is required" }), { status: 400 });
  const { data: media, error } = await admin.from("post_media").select("id,post_id,storage_path,media_type").eq("id", mediaId).single();
  if (error || !media) return new Response(JSON.stringify({ error: "Media not found" }), { status: 404 });
  if (media.media_type !== "video") return new Response(JSON.stringify({ error: "Media is not a video" }), { status: 400 });
  const { data: post } = await admin.from("posts").select("author_id").eq("id", media.post_id).single();
  if (!post || post.author_id !== userData.user.id) return new Response("Forbidden", { status: 403 });
  if (!cloudflareAccountId || !cloudflareToken) return new Response(JSON.stringify({ error: "Video transcoding is not configured yet.", required_env: ["CLOUDFLARE_ACCOUNT_ID","CLOUDFLARE_API_TOKEN"] }), { status: 503, headers: { "content-type": "application/json" } });
  const sourceUrl = admin.storage.from("post-media").getPublicUrl(media.storage_path).data.publicUrl;
  await admin.from("post_media").update({ processing_status: "processing" }).eq("id", mediaId);
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream/copy`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${cloudflareToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: sourceUrl, meta: { media_id: media.id, storage_path: media.storage_path, post_id: media.post_id }, creator: userData.user.id, thumbnailTimestampPct: 0.1 })
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    await admin.from("post_media").update({ processing_status: "failed" }).eq("id", mediaId);
    return new Response(JSON.stringify({ error: "Cloudflare Stream rejected the video", details: result?.errors || null }), { status: 502, headers: { "content-type": "application/json" } });
  }
  return new Response(JSON.stringify({ ok: true, status: "processing", media_id: mediaId, stream_uid: result.result?.uid || null }), { headers: { "content-type": "application/json" } });
});