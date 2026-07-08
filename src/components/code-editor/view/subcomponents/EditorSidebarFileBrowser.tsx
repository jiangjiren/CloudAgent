import { useTranslation } from 'react-i18next';
import { ChevronRight, Folder } from 'lucide-react';

import { ScrollArea } from '../../../../shared/view/ui';
import { useFileTreeData } from '../../../file-tree/hooks/useFileTreeData';
import { useExpandedDirectories } from '../../../file-tree/hooks/useExpandedDirectories';
import { getFileIconData, ICON_SIZE_CLASS } from '../../../file-tree/constants/fileIcons';
import type { FileTreeNode } from '../../../file-tree/types/types';
import type { Project } from '../../../../types/app';

type EditorSidebarFileBrowserProps = {
  selectedProject: Project | null;
  activePath?: string;
  onSelectFile: (path: string) => void;
};

const INDENT_PER_DEPTH = 14;
const BASE_PADDING = 8;
const FILE_ICON_OFFSET = 18;

function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export default function EditorSidebarFileBrowser({
  selectedProject,
  activePath,
  onSelectFile,
}: EditorSidebarFileBrowserProps) {
  const { t } = useTranslation('codeEditor');
  const { files, loading } = useFileTreeData(selectedProject);
  const { expandedDirs, toggleDirectory } = useExpandedDirectories();

  const renderNode = (node: FileTreeNode, depth: number) => {
    if (node.type === 'directory') {
      const isOpen = expandedDirs.has(node.path);
      const children = node.children ?? [];

      return (
        <div key={node.path}>
          <button
            type="button"
            onClick={() => toggleDirectory(node.path)}
            className="flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[13px] text-foreground/80 transition-colors hover:bg-accent/60"
            style={{ paddingLeft: `${BASE_PADDING + depth * INDENT_PER_DEPTH}px` }}
          >
            <ChevronRight
              className={`h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
            />
            <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{node.name}</span>
          </button>
          {isOpen && children.length > 0 && (
            <div>{sortNodes(children).map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    const { icon: Icon, color } = getFileIconData(node.name);
    const isActive = node.path === activePath;

    return (
      <button
        key={node.path}
        type="button"
        onClick={() => onSelectFile(node.path)}
        className={`flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[13px] transition-colors ${
          isActive
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-foreground/80 hover:bg-accent/60'
        }`}
        style={{ paddingLeft: `${BASE_PADDING + depth * INDENT_PER_DEPTH + FILE_ICON_OFFSET}px` }}
      >
        <Icon className={`${ICON_SIZE_CLASS} ${color}`} />
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  return (
    <div className="flex h-full w-[190px] flex-shrink-0 flex-col border-r border-border bg-muted/20">
      <div className="flex-shrink-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t('fileBrowser.title')}
      </div>
      <ScrollArea className="flex-1 px-1.5 pb-2">
        {loading ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">{t('fileBrowser.loading')}</p>
        ) : files.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">{t('fileBrowser.empty')}</p>
        ) : (
          sortNodes(files).map((node) => renderNode(node, 0))
        )}
      </ScrollArea>
    </div>
  );
}
