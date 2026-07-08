import { useState, useEffect, useRef } from 'react';
import type { MouseEvent, MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, FolderTree } from 'lucide-react';

import type { CodeEditorFile } from '../types/types';
import type { Project } from '../../../types/app';

import CodeEditor from './CodeEditor';
import EditorSidebarFileBrowser from './subcomponents/EditorSidebarFileBrowser';

type EditorSidebarProps = {
  editingFile: CodeEditorFile | null;
  isMobile: boolean;
  editorExpanded: boolean;
  editorWidth: number;
  isResizing: boolean;
  hasManualWidth: boolean;
  resizeHandleRef: MutableRefObject<HTMLDivElement | null>;
  onResizeStart: (event: MouseEvent<HTMLDivElement>) => void;
  onCloseEditor: () => void;
  onToggleEditorExpand: () => void;
  onSelectFile: (filePath: string) => void;
  projectPath?: string;
  selectedProject?: Project | null;
  fillSpace?: boolean;
};

// Minimum width for the left content (file tree, chat, etc.)
const MIN_LEFT_CONTENT_WIDTH = 200;
// Minimum width for the editor sidebar
const MIN_EDITOR_WIDTH = 280;

export default function EditorSidebar({
  editingFile,
  isMobile,
  editorExpanded,
  editorWidth,
  isResizing,
  hasManualWidth,
  resizeHandleRef,
  onResizeStart,
  onCloseEditor,
  onToggleEditorExpand,
  onSelectFile,
  projectPath,
  selectedProject,
  fillSpace,
}: EditorSidebarProps) {
  const { t } = useTranslation('codeEditor');
  const [poppedOut, setPoppedOut] = useState(false);
  const [panelView, setPanelView] = useState<'preview' | 'files'>('preview');
  const containerRef = useRef<HTMLDivElement>(null);
  const [effectiveWidth, setEffectiveWidth] = useState(editorWidth);

  // Adjust editor width when container size changes to ensure buttons are always visible
  useEffect(() => {
    if (!editingFile || isMobile || poppedOut) return;

    const updateWidth = () => {
      if (!containerRef.current) return;
      const parentElement = containerRef.current.parentElement;
      if (!parentElement) return;

      const containerWidth = parentElement.clientWidth;

      // Calculate maximum allowed editor width
      const maxEditorWidth = containerWidth - MIN_LEFT_CONTENT_WIDTH;

      if (maxEditorWidth < MIN_EDITOR_WIDTH) {
        // Not enough space - pop out the editor so user can still see everything
        setPoppedOut(true);
      } else if (editorWidth > maxEditorWidth) {
        // Editor is too wide - constrain it to ensure left content has space
        setEffectiveWidth(maxEditorWidth);
      } else {
        setEffectiveWidth(editorWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    // Also use ResizeObserver for more accurate detection
    const resizeObserver = new ResizeObserver(updateWidth);
    const parentEl = containerRef.current?.parentElement;
    if (parentEl) {
      resizeObserver.observe(parentEl);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      resizeObserver.disconnect();
    };
  }, [editingFile, isMobile, poppedOut, editorWidth]);

  if (!editingFile) {
    return null;
  }

  if (isMobile || poppedOut) {
    return (
      <CodeEditor
        file={editingFile}
        onClose={() => {
          setPoppedOut(false);
          onCloseEditor();
        }}
        projectPath={projectPath}
        isSidebar={false}
      />
    );
  }

  // In files tab, fill the remaining width unless user has dragged manually.
  const useFlexLayout = editorExpanded || (fillSpace && !hasManualWidth);

  return (
    <div ref={containerRef} className={`flex h-full min-w-0 ${editorExpanded ? 'flex-1' : ''}`}>
      {isResizing && (
        <div className="fixed inset-0 z-[10000] cursor-col-resize bg-transparent" />
      )}

      {!editorExpanded && (
        <div
          ref={resizeHandleRef}
          onMouseDown={onResizeStart}
          className="group relative z-10 w-2 flex-shrink-0 cursor-col-resize bg-transparent"
          title="Drag to resize"
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-200 transition-colors group-hover:bg-blue-500 dark:bg-gray-700 dark:group-hover:bg-blue-600" />
          <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-blue-600" />
        </div>
      )}

      <div
        className={`flex h-full flex-col overflow-hidden border-l border-gray-200 dark:border-gray-700 ${useFlexLayout ? 'min-w-0 flex-1' : 'flex-shrink-0'}`}
        style={useFlexLayout ? undefined : { width: `${effectiveWidth}px`, minWidth: `${MIN_EDITOR_WIDTH}px` }}
      >
        <div className="flex flex-shrink-0 items-center gap-1 border-b border-border bg-muted/30 px-2 py-1">
          <button
            type="button"
            onClick={() => setPanelView('preview')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              panelView === 'preview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            {t('sidebarTabs.preview')}
          </button>
          <button
            type="button"
            onClick={() => setPanelView('files')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              panelView === 'files'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            {t('sidebarTabs.files')}
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {panelView === 'files' && (
            <EditorSidebarFileBrowser
              selectedProject={selectedProject ?? null}
              activePath={editingFile.path}
              onSelectFile={onSelectFile}
            />
          )}
          <div className="min-w-0 flex-1">
            <CodeEditor
              file={editingFile}
              onClose={onCloseEditor}
              projectPath={projectPath}
              isSidebar
              isExpanded={editorExpanded}
              onToggleExpand={onToggleEditorExpand}
              onPopOut={() => setPoppedOut(true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
