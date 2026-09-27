# Freetopia Cloudinary Video Setup

Freetopia now uploads post videos directly to Cloudinary through the `cloudinary-video-upload` Supabase Edge Function. Cloudinary generates an adaptive HLS stream asynchronously and notifies `cloudinary-video-webhook` when the stream is ready.

## Required Supabase Edge Function secrets

Set these secrets in the Freetopia Supabase project:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_WEBHOOK_URL`

Use this webhook URL:

https://eynrhaiwakmczgdpjnnp.supabase.co/functions/v1/cloudinary-video-webhook

Do not put `CLOUDINARY_API_SECRET` in the mobile app.

## Cloudinary upload configuration

The upload function requests:

- resource type: video
- adaptive streaming profile: `sp_hd`
- HLS output: `f_m3u8`
- asynchronous eager processing
- signed uploads
- deletion token for short-lived rollback

The client stores the Cloudinary public ID in `post_media.storage_path` with the prefix `cloudinary:` and stores the HLS playback URL in `post_media.playback_url`.

## Cloudinary webhook

Configure Cloudinary to allow the webhook endpoint above to receive eager transformation notifications. The webhook verifies the `X-Cld-Timestamp` and `X-Cld-Signature` headers before updating `post_media`.

## Upload limit

The current direct upload implementation is intended for videos within Cloudinary's direct Upload API size limit. A chunked upload path can be added later for larger videos.
