import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storageInstance } from './config';

export type UploadProgress = { progress: number; done: boolean; url?: string; error?: string };

/**
 * Sube un archivo a Firebase Storage y devuelve la download URL pública.
 * path: ej. "products/burger.jpg" o "categories/drinks.png"
 * onProgress: callback con 0-100 mientras sube, luego url al terminar.
 * Lanza si Storage no está disponible (Firebase deshabilitado).
 */
export async function uploadImage(
  file: File,
  path: string,
  onProgress?: (p: UploadProgress) => void,
): Promise<string> {
  if (!storageInstance) {
    throw new Error('Firebase Storage no disponible. Verificá VITE_USE_FIREBASE y VITE_FIREBASE_STORAGE_BUCKET.');
  }

  const storageRef = ref(storageInstance, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.({ progress, done: false });
      },
      (error) => {
        onProgress?.({ progress: 0, done: true, error: error.message });
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onProgress?.({ progress: 100, done: true, url });
        resolve(url);
      },
    );
  });
}

export function buildImagePath(folder: 'products' | 'categories', filename: string): string {
  const ext = filename.split('.').pop() ?? 'jpg';
  const base = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${folder}/${Date.now()}_${base}.${ext}`;
}
