export const getTypeName = (typeSlug: string | undefined): string => {
  if (!typeSlug) return '';

  const typeMap: Record<string, string> = {
    'bong-da': 'Bóng đá',
    'cau-long': 'Cầu lông',
    tennis: 'Tennis',
    'bong-ban': 'Bóng bàn',
  };

  return typeMap[typeSlug] || typeSlug.replace(/-/g, ' ');
};
