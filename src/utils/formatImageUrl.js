export default function formatImageUrl(path) {
  const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://invid.au';
  if (!path) return `${SITE_URL}/uploads/avatars/default.png`;
  if (path.startsWith('http')) return path;

  // Detect if this is an avatar filename (adjust as needed)
  if (path.includes('/uploads/avatars/')) {
    const filename = path.split('/').pop();
    return `${SITE_URL}/api/avatar/${filename}`; // ← Changed from /mobile/media/avatar/ to /api/avatar/
  }

  return `${SITE_URL}${path}`;
}