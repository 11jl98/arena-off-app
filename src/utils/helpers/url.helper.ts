export const normalizeImageUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;

  try {
    const urlObj = new URL(url);
    if (urlObj.pathname.startsWith('/uploads/')) {
      return urlObj.pathname;
    }
    return url;
  } catch {
    return url;
  }
};
