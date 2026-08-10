export const isValidCoverUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return true;
  return url.startsWith('http://') || url.startsWith('https://');
};