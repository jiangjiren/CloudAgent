import { ChevronDown, ChevronRight, Folder, FolderPlus } from 'lucide-react';
import type { TFunction } from 'i18next';

import SidebarProjectList, { type SidebarProjectListProps } from './SidebarProjectList';

type SidebarProjectsSectionProps = {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  projectCount: number;
  onCreateProject: () => void;
  projectListProps: SidebarProjectListProps;
  t: TFunction;
};

/**
 * Collapsible "Projects" section of the redesigned sidebar. The default
 * workspace project is filtered out upstream (see `Sidebar.tsx`) so this
 * section only ever lists projects the user explicitly created.
 */
export default function SidebarProjectsSection({
  isExpanded,
  onToggleExpanded,
  projectCount,
  onCreateProject,
  projectListProps,
  t,
}: SidebarProjectsSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-0.5 px-1.5">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 text-left transition-colors hover:bg-accent/50"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          )}
          <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('sections.projects')}
          </span>
          {projectCount > 0 && (
            <span className="ml-auto flex-shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {projectCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onCreateProject}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={t('projects.newProject')}
          aria-label={t('projects.newProject')}
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      </div>
      {isExpanded && (
        <div className="mt-1">
          <SidebarProjectList {...projectListProps} onCreateProject={onCreateProject} />
        </div>
      )}
    </div>
  );
}
