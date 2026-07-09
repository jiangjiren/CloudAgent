import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Clock, Pin, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import type { TFunction } from 'i18next';

import { cn } from '../../../../lib/utils';
import type { Project, ProjectSession, LLMProvider } from '../../../../types/app';
import { createSessionViewModel, formatCompactAge, type RecentSessionEntry } from '../../utils/utils';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';

type SidebarRecentSessionsProps = {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  entries: RecentSessionEntry[];
  selectedSession: ProjectSession | null;
  currentTime: Date;
  isProjectStarred: (projectId: string) => boolean;
  onSessionSelect: (session: RecentSessionEntry['session'], project: Project) => void;
  onPinProject: (projectId: string) => void;
  onCreateProject: () => void;
  editingSession?: string | null;
  editingSessionName?: string;
  onEditingSessionNameChange?: (value: string) => void;
  onStartEditingSession?: (sessionId: string, initialName: string) => void;
  onCancelEditingSession?: () => void;
  onSaveEditingSession?: (projectId: string, sessionId: string, summary: string, provider: LLMProvider) => void;
  onDeleteSession?: (projectId: string, sessionId: string, sessionTitle: string, provider: LLMProvider) => void;
  t: TFunction;
};

/* ── Click-based dropdown menu (portaled to body to avoid overflow clipping) ── */

type MoreMenuProps = {
  sessionId: string;
  sessionName: string;
  isCursorSession: boolean;
  projectId: string;
  provider: LLMProvider;
  size?: 'sm' | 'md';
  onStartEditing?: (sessionId: string, initialName: string) => void;
  onDelete?: (projectId: string, sessionId: string, sessionTitle: string, provider: LLMProvider) => void;
  t: TFunction;
};

function MoreMenu({
  sessionId,
  sessionName,
  isCursorSession,
  projectId,
  provider,
  size = 'sm',
  onStartEditing,
  onDelete,
  t,
}: MoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Position the portal menu relative to the trigger button
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - 140),
    });
  }, [isOpen]);

  // Close on outside click, Escape, or scroll
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    const handleScroll = () => closeMenu();

    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, closeMenu]);

  const btnSize = size === 'md' ? 'h-7 w-7' : 'h-6 w-6';
  const iconSize = size === 'md' ? 'h-4 w-4' : 'h-3 w-3';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'flex items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm transition-all hover:bg-gray-50 hover:text-foreground dark:hover:bg-gray-900/40',
          btnSize,
          isOpen && 'bg-gray-100 text-foreground dark:bg-gray-800',
        )}
        title={t('tooltips.moreOptions', 'More options')}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
      >
        <MoreHorizontal className={iconSize} />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-[140px] rounded-lg border border-border bg-popover p-1 shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {onStartEditing && (
              <button
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing(sessionId, sessionName);
                  closeMenu();
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
                {t('tooltips.editSessionName')}
              </button>
            )}
            {!isCursorSession && onDelete && (
              <button
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(projectId, sessionId, sessionName, provider);
                  closeMenu();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('actions.delete', 'Delete')}
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * Flat, cross-project list of the most recently active sessions. This is the
 * "Recent" half of the redesigned sidebar: new users never need to understand
 * "projects" to find their last conversation, and power users can promote any
 * session's project to a starred entry in the Projects section via the pin
 * affordance. Default-workspace sessions use the same affordance to open the
 * project creation flow, because the default workspace itself is never surfaced
 * as a project.
 */
export default function SidebarRecentSessions({
  isExpanded,
  onToggleExpanded,
  entries,
  selectedSession,
  currentTime,
  isProjectStarred,
  onSessionSelect,
  onPinProject,
  onCreateProject,
  editingSession,
  editingSessionName,
  onEditingSessionNameChange,
  onStartEditingSession,
  onCancelEditingSession,
  onSaveEditingSession,
  onDeleteSession,
  t,
}: SidebarRecentSessionsProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="px-1.5">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex h-8 w-full items-center gap-1.5 rounded-md px-1 text-left transition-colors hover:bg-accent/50"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          )}
          <Clock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('sections.recent')}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-1 space-y-0.5">
          {entries.map(({ session, project }) => {
            const sessionView = createSessionViewModel(session, currentTime, t);
            const isSelected = selectedSession?.id === session.id;
            const isEditing = editingSession === session.id;
            const canPin = Boolean(project.isDefault) || !isProjectStarred(project.projectId);
            const age = formatCompactAge(sessionView.sessionTime, currentTime);
            const rowKey = `${project.projectId}-${session.__provider}-${session.id}`;

            const saveEditedSession = () => {
              if (onSaveEditingSession && editingSessionName !== undefined) {
                onSaveEditingSession(project.projectId, session.id, editingSessionName, session.__provider);
              }
            };

            return (
              <div key={rowKey} className="group relative">
                {/* Mobile */}
                <button
                  type="button"
                  className={cn(
                    'mx-3 my-0.5 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-md border p-2 pr-11 text-left transition-all duration-150 active:scale-[0.98] md:hidden',
                    isSelected ? 'border-primary/20 bg-primary/5' : 'border-border/30 bg-card',
                  )}
                  onClick={() => onSessionSelect(session, project)}
                >
                  <SessionProviderLogo provider={session.__provider} className="h-3.5 w-3.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-medium text-foreground">{sessionView.sessionName}</span>
                      {age && <span className="ml-auto flex-shrink-0 text-[11px] text-muted-foreground">{age}</span>}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{project.displayName}</div>
                  </div>
                </button>
                {/* Kept outside the row button: nested interactive elements are invalid HTML. */}
                <div className="absolute right-5 top-1/2 -translate-y-1/2 md:hidden">
                  <MoreMenu
                    sessionId={session.id}
                    sessionName={sessionView.sessionName}
                    isCursorSession={sessionView.isCursorSession}
                    projectId={project.projectId}
                    provider={session.__provider}
                    size="md"
                    onStartEditing={onStartEditingSession}
                    onDelete={onDeleteSession}
                    t={t}
                  />
                </div>

                {/* Desktop: a div while renaming — an input inside a button is invalid HTML. */}
                {isEditing ? (
                  <div className="hidden w-full items-center gap-2 rounded-md bg-accent px-2 py-1.5 text-left md:flex">
                    <SessionProviderLogo provider={session.__provider} className="h-3 w-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={editingSessionName ?? ''}
                        onChange={(event) => {
                          if (onEditingSessionNameChange) {
                            onEditingSessionNameChange(event.target.value);
                          }
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === 'Enter') {
                            saveEditedSession();
                          } else if (event.key === 'Escape') {
                            if (onCancelEditingSession) onCancelEditingSession();
                          }
                        }}
                        onBlur={() => saveEditedSession()}
                        className="w-full min-w-0 truncate rounded border border-primary/40 bg-transparent px-0.5 py-0 text-xs font-medium text-foreground outline-none ring-1 ring-primary/30"
                        autoFocus
                      />
                      <div className="truncate text-[11px] text-muted-foreground/70">{project.displayName}</div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      'hidden w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/50 md:flex',
                      isSelected && 'bg-accent text-accent-foreground',
                    )}
                    onClick={() => onSessionSelect(session, project)}
                  >
                    <SessionProviderLogo provider={session.__provider} className="h-3 w-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium text-foreground">{sessionView.sessionName}</span>
                        {age && (
                          <span className="ml-auto flex-shrink-0 text-[11px] text-muted-foreground transition-opacity duration-200 group-hover:opacity-0">
                            {age}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground/70">{project.displayName}</div>
                    </div>
                  </button>
                )}
                <div
                  className={cn(
                    'absolute right-2 top-1/2 hidden -translate-y-1/2 transform items-center gap-1 transition-all duration-200 md:flex',
                    isEditing ? 'md:hidden' : 'opacity-0 group-hover:opacity-100',
                  )}
                >
                  <MoreMenu
                    sessionId={session.id}
                    sessionName={sessionView.sessionName}
                    isCursorSession={sessionView.isCursorSession}
                    projectId={project.projectId}
                    provider={session.__provider}
                    onStartEditing={onStartEditingSession}
                    onDelete={onDeleteSession}
                    t={t}
                  />
                  {canPin && (
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm transition-opacity hover:text-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (project.isDefault) {
                          onCreateProject();
                          return;
                        }
                        onPinProject(project.projectId);
                      }}
                      title={t('tooltips.pinToProject')}
                      aria-label={t('tooltips.pinToProject')}
                    >
                      <Pin className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
