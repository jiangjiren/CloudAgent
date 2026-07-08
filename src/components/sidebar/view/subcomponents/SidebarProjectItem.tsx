import { useEffect, useRef, useState } from 'react';
import { Archive, Check, ChevronDown, ChevronRight, Edit3, Folder, MoreHorizontal, SquarePen, Star, Trash2, X } from 'lucide-react';
import type { TFunction } from 'i18next';

import { cn } from '../../../../lib/utils';
import type { Project, ProjectSession, LLMProvider } from '../../../../types/app';
import type { MCPServerStatus, SessionWithProvider } from '../../types/types';

import SidebarProjectSessions from './SidebarProjectSessions';

type SidebarProjectItemProps = {
  project: Project;
  selectedProject: Project | null;
  selectedSession: ProjectSession | null;
  isExpanded: boolean;
  isDeleting: boolean;
  isStarred: boolean;
  editingProject: string | null;
  editingName: string;
  sessions: SessionWithProvider[];
  initialSessionsLoaded: boolean;
  isLoadingMoreSessions: boolean;
  currentTime: Date;
  editingSession: string | null;
  editingSessionName: string;
  tasksEnabled: boolean;
  mcpServerStatus: MCPServerStatus;
  onEditingNameChange: (name: string) => void;
  onToggleProject: (projectName: string) => void;
  onProjectSelect: (project: Project) => void;
  onToggleStarProject: (projectName: string) => void;
  onStartEditingProject: (project: Project) => void;
  onCancelEditingProject: () => void;
  onSaveProjectName: (projectName: string) => void;
  onArchiveProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onSessionSelect: (session: SessionWithProvider, projectName: string) => void;
  onDeleteSession: (
    projectName: string,
    sessionId: string,
    sessionTitle: string,
    provider: LLMProvider,
  ) => void;
  onLoadMoreSessions: (projectId: string) => void;
  onNewSession: (project: Project) => void;
  onEditingSessionNameChange: (value: string) => void;
  onStartEditingSession: (sessionId: string, initialName: string) => void;
  onCancelEditingSession: () => void;
  onSaveEditingSession: (projectName: string, sessionId: string, summary: string, provider: LLMProvider) => void;
  t: TFunction;
};

type ProjectActionMenuProps = {
  project: Project;
  isStarred: boolean;
  onRename: (project: Project) => void;
  onToggleStar: () => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
  t: TFunction;
};

function ProjectActionMenu({
  project,
  isStarred,
  onRename,
  onToggleStar,
  onArchive,
  onDelete,
  t,
}: ProjectActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const runAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div
      ref={menuRef}
      className="relative flex-shrink-0"
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('tooltips.projectActions', 'Project actions')}
        title={t('tooltips.projectActions', 'Project actions')}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent"
            onClick={() => runAction(() => onRename(project))}
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
            {t('actions.rename')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent"
            onClick={() => runAction(onToggleStar)}
          >
            <Star
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground',
                isStarred && 'fill-yellow-500 text-yellow-500',
              )}
            />
            {isStarred ? t('tooltips.removeFromFavorites') : t('tooltips.addToFavorites')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent"
            onClick={() => runAction(() => onArchive(project))}
          >
            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
            {t('deleteConfirmation.archiveProject', 'Archive project')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => runAction(() => onDelete(project))}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('actions.delete')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SidebarProjectItem({
  project,
  selectedProject,
  selectedSession,
  isExpanded,
  isDeleting,
  isStarred,
  editingProject,
  editingName,
  sessions,
  initialSessionsLoaded,
  isLoadingMoreSessions,
  currentTime,
  editingSession,
  editingSessionName,
  onEditingNameChange,
  onToggleProject,
  onProjectSelect,
  onToggleStarProject,
  onStartEditingProject,
  onCancelEditingProject,
  onSaveProjectName,
  onArchiveProject,
  onDeleteProject,
  onSessionSelect,
  onDeleteSession,
  onLoadMoreSessions,
  onNewSession,
  onEditingSessionNameChange,
  onStartEditingSession,
  onCancelEditingSession,
  onSaveEditingSession,
  t,
}: SidebarProjectItemProps) {
  // Project identity is tracked by the DB-assigned `projectId` everywhere
  // after the projectName → projectId migration.
  const isSelected = selectedProject?.projectId === project.projectId;
  const isEditing = editingProject === project.projectId;

  const toggleProject = () => onToggleProject(project.projectId);
  const toggleStarProject = () => onToggleStarProject(project.projectId);

  const saveProjectName = () => {
    onSaveProjectName(project.projectId);
  };

  const selectAndToggleProject = () => {
    if (selectedProject?.projectId !== project.projectId) {
      onProjectSelect(project);
    }

    toggleProject();
  };

  const startNewSession = () => {
    onProjectSelect(project);
    onNewSession(project);
  };

  return (
    <div className={cn('md:space-y-1', isDeleting && 'opacity-50 pointer-events-none')}>
      <div className="group">
        <div className="md:hidden">
          <div
            className={cn(
              'mx-3 my-0.5 rounded-lg px-2 py-2 transition-all duration-150 active:scale-[0.98]',
              isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
            )}
            onClick={toggleProject}
          >
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted/30 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-90"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleProject();
                  }}
                  aria-label={isExpanded ? t('actions.collapseAll') : t('actions.expandAll')}
                  title={isExpanded ? t('actions.collapseAll') : t('actions.expandAll')}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(event) => onEditingNameChange(event.target.value)}
                      className="w-full rounded-lg border-2 border-primary/40 bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-all duration-200 focus:border-primary focus:shadow-md focus:outline-none"
                      placeholder={t('projects.projectNamePlaceholder')}
                      autoFocus
                      autoComplete="off"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          saveProjectName();
                        }

                        if (event.key === 'Escape') {
                          onCancelEditingProject();
                        }
                      }}
                      style={{
                        fontSize: '16px',
                        WebkitAppearance: 'none',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <h3 className="truncate text-sm font-medium text-foreground">{project.displayName}</h3>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 shadow-sm transition-all duration-150 active:scale-90 active:shadow-none dark:bg-green-600"
                      onClick={(event) => {
                        event.stopPropagation();
                        saveProjectName();
                      }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-500 shadow-sm transition-all duration-150 active:scale-90 active:shadow-none dark:bg-gray-600"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCancelEditingProject();
                      }}
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </>
                ) : (
                  <>
                    <ProjectActionMenu
                      project={project}
                      isStarred={isStarred}
                      onRename={onStartEditingProject}
                      onToggleStar={toggleStarProject}
                      onArchive={onArchiveProject}
                      onDelete={onDeleteProject}
                      t={t}
                    />

                    {(isSelected || isExpanded) && (
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-90"
                        onClick={(event) => {
                          event.stopPropagation();
                          startNewSession();
                        }}
                        title={t('sessions.newSession')}
                        aria-label={t('sessions.newSession')}
                      >
                        <SquarePen className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          className={cn(
            'hidden h-11 w-full cursor-pointer items-center justify-between rounded-md px-1.5 text-sm font-normal transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:flex',
            isSelected && 'bg-accent text-accent-foreground',
          )}
          onClick={selectAndToggleProject}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              selectAndToggleProject();
            }
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                toggleProject();
              }}
              aria-label={isExpanded ? t('actions.collapseAll') : t('actions.expandAll')}
              title={isExpanded ? t('actions.collapseAll') : t('actions.expandAll')}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 text-left">
              {isEditing ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(event) => onEditingNameChange(event.target.value)}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground focus:ring-2 focus:ring-primary/20"
                  placeholder={t('projects.projectNamePlaceholder')}
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      saveProjectName();
                    }
                    if (event.key === 'Escape') {
                      onCancelEditingProject();
                    }
                  }}
                />
              ) : (
                <div className="truncate text-sm font-medium text-foreground" title={project.displayName}>
                  {project.displayName}
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              'flex flex-shrink-0 items-center gap-1 transition-opacity',
              !isEditing &&
                'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100',
            )}
          >
            {isEditing ? (
              <>
                <div
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-green-600 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                  onClick={(event) => {
                    event.stopPropagation();
                    saveProjectName();
                  }}
                >
                  <Check className="h-3 w-3" />
                </div>
                <div
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCancelEditingProject();
                  }}
                >
                  <X className="h-3 w-3" />
                </div>
              </>
            ) : (
              <>
                <ProjectActionMenu
                  project={project}
                  isStarred={isStarred}
                  onRename={onStartEditingProject}
                  onToggleStar={toggleStarProject}
                  onArchive={onArchiveProject}
                  onDelete={onDeleteProject}
                  t={t}
                />
                <button
                  type="button"
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    !isSelected &&
                      'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus:pointer-events-auto focus:opacity-100',
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    startNewSession();
                  }}
                  title={t('sessions.newSession')}
                  aria-label={t('sessions.newSession')}
                >
                  <SquarePen className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <SidebarProjectSessions
        project={project}
        isExpanded={isExpanded}
        sessions={sessions}
        selectedSession={selectedSession}
        initialSessionsLoaded={initialSessionsLoaded}
        hasMoreSessions={Boolean(project.sessionMeta?.hasMore)}
        isLoadingMoreSessions={isLoadingMoreSessions}
        currentTime={currentTime}
        editingSession={editingSession}
        editingSessionName={editingSessionName}
        onEditingSessionNameChange={onEditingSessionNameChange}
        onStartEditingSession={onStartEditingSession}
        onCancelEditingSession={onCancelEditingSession}
        onSaveEditingSession={onSaveEditingSession}
        onProjectSelect={onProjectSelect}
        onSessionSelect={onSessionSelect}
        onDeleteSession={onDeleteSession}
        onLoadMoreSessions={onLoadMoreSessions}
        onNewSession={onNewSession}
        t={t}
      />
    </div>
  );
}
