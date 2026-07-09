import type { MouseEvent, MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../../../lib/utils';
import type { Project } from '../../../../types/app';
import type { CodeEditorFile } from '../../../code-editor/types/types';
import CodeEditor from '../../../code-editor/view/CodeEditor';
import FileTree from '../../../file-tree/view/FileTree';

type FileWorkspacePanelProps = {
  selectedProject: Project;
  selectedFile: CodeEditorFile | null;
  isMobile: boolean;
  width: number;
  isResizing: boolean;
  resizeHandleRef: MutableRefObject<HTMLDivElement | null>;
  onResizeStart: (event: MouseEvent<HTMLDivElement>) => void;
  onFileOpen: (filePath: string) => void;
  /** Mobile only: pop the full-screen file layer back to the tree. */
  onFileClose: () => void;
  /** Close the whole panel — the single meaning of every ✕ on desktop. */
  onClose: () => void;
};

/**
 * The project-files inspector: one panel, one header, one close action.
 * The tree fills the panel until a file is selected, then settles into a
 * fixed column beside the content; it never disappears, so "going back"
 * needs no dedicated control — selecting another file just switches content.
 */
export default function FileWorkspacePanel({
  selectedProject,
  selectedFile,
  isMobile,
  width,
  isResizing,
  resizeHandleRef,
  onResizeStart,
  onFileOpen,
  onFileClose,
  onClose,
}: FileWorkspacePanelProps) {
  const { t } = useTranslation();

  // Mobile pushes the file content as a full-screen layer over the tree,
  // and closing it pops back — the platform's two-level navigation pattern.
  if (isMobile && selectedFile) {
    return (
      <CodeEditor
        file={selectedFile}
        onClose={onFileClose}
        projectPath={selectedProject.path}
        isSidebar={false}
      />
    );
  }

  const showContent = Boolean(selectedFile) && !isMobile;

  return (
    <aside
      className={cn(
        'flex min-h-0 flex-col overflow-hidden border-l border-border bg-background',
        isMobile ? 'absolute inset-0 z-40' : 'relative flex-shrink-0',
      )}
      style={isMobile ? undefined : { width: `${width}px`, maxWidth: 'calc(100% - 200px)' }}
    >
      {isResizing && <div className="fixed inset-0 z-[10000] cursor-col-resize bg-transparent" />}

      {!isMobile && (
        <div
          ref={resizeHandleRef}
          onMouseDown={onResizeStart}
          className="group absolute inset-y-0 left-0 z-20 w-3 -translate-x-1/2 cursor-col-resize"
          aria-label={t('mainContent.resizeFilesPanel', 'Resize files panel')}
          role="separator"
        >
          <div
            className={cn(
              'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors',
              isResizing ? 'bg-blue-500' : 'group-hover:bg-blue-500',
            )}
          />
          <div
            className={cn(
              'absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-blue-500 opacity-0 transition-opacity',
              isResizing ? 'opacity-100' : 'group-hover:opacity-100',
            )}
          />
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            'flex min-h-0 flex-col overflow-hidden',
            showContent ? 'w-[300px] flex-shrink-0 border-r border-border' : 'min-w-0 flex-1',
          )}
        >
          <FileTree selectedProject={selectedProject} onFileOpen={onFileOpen} onCollapsePanel={onClose} />
        </div>

        {showContent && selectedFile && (
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <CodeEditor
              file={selectedFile}
              onClose={onClose}
              projectPath={selectedProject.path}
              isSidebar
            />
          </div>
        )}
      </div>
    </aside>
  );
}
