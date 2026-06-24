import { useRef, useState } from 'react';
import { firebaseEnabled } from '@/lib/firebase/config';
import { uploadImage, buildImagePath } from '@/lib/firebase/storage';
import { useLabels } from '@/i18n/I18nContext';

interface ImageUploadFieldProps {
  folder: 'products' | 'categories';
  value: string;
  onChange: (url: string) => void;
}

export function ImageUploadField({ folder, value, onChange }: ImageUploadFieldProps) {
  const { t } = useLabels();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const path = buildImagePath(folder, file.name);
      const url = await uploadImage(file, path, (p) => {
        if (!p.done) setProgress(p.progress);
      });
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="ff-image-upload-field">
      <div className="ff-image-upload-preview">
        {value
          ? <img src={value} alt="" className="ff-image-upload-thumb" />
          : <div className="ff-image-upload-thumb-ph"><i className="bi bi-image" /></div>
        }
      </div>

      <div className="ff-image-upload-controls">
        <input
          className="ff-admin-form-input"
          type="url"
          value={value}
          placeholder={t('imageUpload.urlPlaceholder')}
          onChange={(e) => onChange(e.target.value)}
          disabled={uploading}
        />

        {firebaseEnabled && (
          <>
            <button
              type="button"
              className="ff-image-upload-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title={t('imageUpload.uploadButton')}
            >
              {uploading
                ? <><i className="bi bi-arrow-repeat ff-spin" /> {progress}%</>
                : <><i className="bi bi-upload" /> {t('imageUpload.uploadButton')}</>
              }
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </>
        )}
      </div>

      {error && <div className="ff-image-upload-error">{error}</div>}
    </div>
  );
}
