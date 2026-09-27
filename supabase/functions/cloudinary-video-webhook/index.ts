import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url=Deno.env.get("SUPABASE_URL")!;
const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const apiSecret=Deno.env.get("CLOUDINARY_API_SECRET")!;

async function sha1(value:string){
  const digest=await crypto.subtle.digest("SHA-1",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST") return new Response("Method not allowed",{status:405});

  const body=await req.text();
  const timestamp=req.headers.get("X-Cld-Timestamp");
  const signature=req.headers.get("X-Cld-Signature");
  if(!timestamp||!signature) return new Response("Invalid signature",{status:401});

  const timestampNumber=Number(timestamp);
  if(!Number.isFinite(timestampNumber)||Math.abs(Math.floor(Date.now()/1000)-timestampNumber)>3600){
    return new Response("Expired signature",{status:401});
  }

  const expected=await sha1(body+timestamp+apiSecret);
  if(expected!==signature) return new Response("Invalid signature",{status:401});

  let payload:any;
  try{payload=JSON.parse(body);}catch{return new Response("Invalid JSON",{status:400});}

  if(payload?.notification_type!=="eager") return new Response("Ignored",{status:202});

  const publicId=typeof payload?.public_id==="string"?payload.public_id:"";
  const contextId=payload?.context?.custom?.media_id||payload?.context?.media_id||payload?.notification_context?.custom?.media_id||payload?.notification_context?.media_id;

  // Eager notifications can omit the original upload context. Our public_id
  // format is freetopia/posts/<user_id>/<post_id>-<uuid>, so recover post_id
  // from the asset name when context is unavailable.
  const postId=typeof contextId==="string"&&contextId?contextId:publicId.match(/^freetopia\/posts\/[^/]+\/([0-9a-f-]{36})-/i)?.[1];

  if(!postId&&!publicId) return new Response("Ignored",{status:202});

  const eager=Array.isArray(payload?.eager)?payload.eager:[];
  const failed=eager.some((item:any)=>String(item?.status||"").toLowerCase()==="failed");
  const hls=eager.find((item:any)=>{
    const format=String(item?.format||"").toLowerCase();
    const transformation=String(item?.transformation||"").toLowerCase();
    return format==="m3u8"||transformation.includes("f_m3u8");
  })?.secure_url||null;

  const admin=createClient(url,service);
  let query=admin.from("post_media").select("id").eq("media_type","video");
  if(postId) query=query.eq("post_id",postId);
  else query=query.eq("storage_path","cloudinary:"+publicId);

  const {data,error}=await query.order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(error) return new Response(JSON.stringify({error:error.message}),{status:500});
  if(!data) return new Response("Media not found", {status:500});

  const update=failed||!hls
    ? {processing_status:"failed",playback_url:null}
    : {processing_status:"ready",playback_url:hls};

  const {error:updateError}=await admin.from("post_media").update(update).eq("id",data.id);
  if(updateError) return new Response(JSON.stringify({error:updateError.message}),{status:500});

  return new Response("OK");
});