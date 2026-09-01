/**
 * Triggers a browser file download for a Blob, ArrayBuffer, or string payload.
 */
export function downloadFile(
  data: Blob | ArrayBuffer | string,
  filename: string,
  mimeType = 'application/octet-stream'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  let blob: Blob;
  if (data instanceof Blob) {
    blob = data;
  } else if (data instanceof ArrayBuffer) {
    blob = new Blob([data], { type: mimeType });
  } else {
    blob = new Blob([data], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
