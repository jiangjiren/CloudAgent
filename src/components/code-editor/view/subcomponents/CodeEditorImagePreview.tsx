import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';

import { authenticatedFetch } from '../../../../utils/api';
import type { CodeEditorFile } from '../../types/types';

type CodeEditorImagePreviewProps = {
  file: CodeEditorFile;
  isSidebar: boolean;
  isFullscreen: boolean;
  onClose: () => void;
  onDownload: () => void;
};

export default function CodeEditorImagePreview({
  file,
  isSidebar,
  isFullscreen,
  onClose,
  onDownload,
}: CodeEditorImagePreviewProps) {
  const { t } = useTranslation('codeEditor');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file.projectId) {
      setLoading(false);
      setError(t('imagePreview.error'));
      return;
    }

    let objectUrl: string | null = null;
    const controller = new AbortController();
    const contentPath = `/api/projects/${file.projectId}/files/content?path=${encodeURIComponent(file.path)}`;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        setImageUrl(null);

        const response = await authenticatedFetch(contentPath, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (loadError: unknown) {
        if (loadError instanceof Error && loadError.name === 'AbortError') {
          return;
        }
        console.error('Error loading image preview:', loadError);
        setError(t('imagePreview.error'));
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file.path, file.projectId, t]);

  const body = (
    <div className="flex h-full w-full items-center justify-center bg-muted/20 p-6">
      {loading && <p className="text-sm text-muted-foreground">{t('imagePreview.loading')}</p>}
      {!loading && imageUrl && (
        <img
          src={imageUrl}
          alt={file.name}
          className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
        />
      )}
      {!loading && !imageUrl && (
        <div className="text-center text-sm text-muted-foreground">
          <p>{error || t('imagePreview.error')}</p>
          <p className="mt-2 break-all text-xs">{file.path}</p>
        </div>
      )}
    </div>
  );

  const header = (
    <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-1.5">
      <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</h3>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center justify-center rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          title={t('actions.download')}
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          title={t('actions.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (isSidebar) {
    return (
      <div className="flex h-full w-full flex-col bg-background">
        {header}
        {body}
      </div>
    );
  }

  const containerClassName = isFullscreen
    ? 'fixed inset-0 z-[9999] bg-background flex flex-col'
    : 'fixed inset-0 z-[9999] md:bg-black/50 md:flex md:items-center md:justify-center md:p-4';

  const innerClassName = isFullscreen
    ? 'bg-background flex flex-col w-full h-full'
    : 'bg-background shadow-2xl flex flex-col w-full h-full md:rounded-lg md:shadow-2xl md:w-full md:max-w-3xl md:h-auto md:max-h-[80vh]';

  return (
    <div className={containerClassName}>
      <div className={innerClassName}>
        {header}
        {body}
      </div>
    </div>
  );
}
