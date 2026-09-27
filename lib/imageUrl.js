export function getImageUrl(uri, options = {}) {
  if (!uri || typeof uri !== 'string') return uri;

  const width = Math.min(Math.max(Number(options.width || 800), 1), 2500);
  const height = Math.min(Math.max(Number(options.height || width), 1), 2500);
  const quality = Math.min(Math.max(Number(options.quality || 100), 20), 100);
  const resize = options.resize || 'cover';

  if (!uri.includes('/storage/v1/object/public/')) return uri;

  const transformed = uri.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  const separator = transformed.includes('?') ? '&' : '?';

  return transformed + separator + 'width=' + width + '&height=' + height + '&resize=' + resize + '&quality=' + quality;
}
