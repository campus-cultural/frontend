export function getEventImageUri(image: string | null) {
  if (!image) {
    return null;
  }

  if (
    image.startsWith('data:') ||
    image.startsWith('http://') ||
    image.startsWith('https://') ||
    image.startsWith('file:')
  ) {
    return image;
  }

  return `data:image/jpeg;base64,${image}`;
}

export function getEventImageBase64(image: string | null) {
  if (!image) {
    return '';
  }

  if (image.startsWith('data:')) {
    return image.split(',')[1] ?? '';
  }

  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('file:')) {
    return '';
  }

  return image;
}
