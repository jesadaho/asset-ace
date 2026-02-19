export type UploadResponse = {
  uploads: { key: string }[];
  bucketName?: string | null;
  error?: string;
};

/**
 * Upload files via XHR to /api/upload and report progress via onProgress(0-100).
 * Rejects on non-2xx or network error. Resolves with same shape as API response.
 */
export function uploadFilesWithProgress(
  files: File[],
  onProgress: (percent: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      const percent = event.lengthComputable
        ? Math.min(100, (event.loaded / event.total) * 100)
        : 0;
      onProgress(percent);
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}") as UploadResponse & {
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            uploads: data.uploads ?? [],
            bucketName: data.bucketName ?? null,
          });
        } else {
          reject(
            new Error(data.error ?? `Upload failed (${xhr.status})`)
          );
        }
      } catch {
        reject(new Error("Invalid upload response"));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error"));
    };

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}
