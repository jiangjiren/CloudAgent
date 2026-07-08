import { ChevronDown, ChevronRight, Clock, Pin } from 'lucide-react';
import type { TFunction } from 'i18next';

import { cn } from '../../../../lib/utils';
import type { Project, ProjectSession } from '../../../../types/app';
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
  t: TFunction;
};

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
            const canPin = Boolean(project.isDefault) || !isProjectStarred(project.projectId);
            const age = formatCompactAge(sessionView.sessionTime, currentTime);
            const rowKey = `${project.projectId}-${session.__provider}-${session.id}`;

            return (
              <div key={rowKey} className="group relative">
                {/* Mobile */}
                <button
                  type="button"
                  className={cn(
                    'mx-3 my-0.5 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-md border p-2 text-left transition-all duration-150 active:scale-[0.98] md:hidden',
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

                {/* Desktop */}
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
                        <span
                          className={cn(
                            'ml-auto flex-shrink-0 text-[11px] text-muted-foreground transition-opacity duration-200',
                            canPin && 'group-hover:opacity-0',
                          )}
                        >
                          {age}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground/70">{project.displayName}</div>
                  </div>
                </button>
                {canPin && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground group-hover:opacity-100 md:flex"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
