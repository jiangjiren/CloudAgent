import { useMemo, useState } from 'react';
import { ChevronRight, Folder, FolderPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../../shared/view/ui';
import { usePaletteOps } from '../../../../contexts/PaletteOpsContext';
import { formatTimeAgo } from '../../../../utils/dateUtils';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import {
  getAllSessions,
  getProjectLastActivity,
  getSessionName,
  getSessionTime,
  sortProjects,
} from '../../../sidebar/utils/utils';
import type { Project, ProjectSession } from '../../../../types/app';
import type { SessionWithProvider } from '../../../sidebar/types/types';
import type { MainContentStateViewProps } from '../../types/types';

import MobileMenuButton from './MobileMenuButton';

const MAX_RECENT_SESSIONS = 5;
const MAX_RECENT_PROJECTS = 6;

type RecentSessionEntry = {
  session: SessionWithProvider;
  project: Project;
};

function collectRecentSessions(projects: Project[]): RecentSessionEntry[] {
  return projects
    .flatMap((project) =>
      getAllSessions(project).map((session) => ({
        // Tag with the owning projectId so the URL-sync effect in
        // useProjectsState can resolve the project after navigation.
        session: { ...session, __projectId: project.projectId },
        project,
      })),
    )
    .sort((a, b) => new Date(getSessionTime(b.session) || 0).getTime() - new Date(getSessionTime(a.session) || 0).getTime())
    .slice(0, MAX_RECENT_SESSIONS);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function WelcomeView({
  projects,
  onProjectSelect,
  onSessionSelect,
}: {
  projects: Project[];
  onProjectSelect?: (project: Project) => void;
  onSessionSelect?: (session: ProjectSession) => void;
}) {
  const { t } = useTranslation();
  // The shared session-name and time-ago helpers resolve keys from the
  // sidebar namespace (`projects.*`, `time.*`), which `common` lacks.
  const { t: tSidebar } = useTranslation('sidebar');
  const paletteOps = usePaletteOps();
  // Freeze "now" for this render pass; relative times don't need live ticking here.
  const [now] = useState(() => new Date());

  const recentSessions = useMemo(() => collectRecentSessions(projects), [projects]);
  const recentProjects = useMemo(
    () => sortProjects(projects, 'date').slice(0, MAX_RECENT_PROJECTS),
    [projects],
  );

  const hasProjects = projects.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-xl px-6 py-10 sm:py-14">
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {hasProjects ? t('welcome.backTitle') : t('welcome.emptyTitle')}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            {hasProjects ? t('welcome.backDescription') : t('welcome.emptyDescription')}
          </p>
          <Button
            className="mt-5 rounded-xl"
            onClick={() => paletteOps.openCreateProject()}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            {t('welcome.newProject')}
          </Button>
        </div>

        {recentSessions.length > 0 && (
          <div className="mt-10">
            <SectionLabel>{t('welcome.recentSessions')}</SectionLabel>
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card/50">
              <div className="divide-y divide-border/50">
                {recentSessions.map(({ session, project }) => {
                  const sessionTime = getSessionTime(session);

                  return (
                    <button
                      key={`${project.projectId}-${session.__provider}-${session.id}`}
                      type="button"
                      className="group flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-accent/50"
                      onClick={() => onSessionSelect?.(session)}
                    >
                      <SessionProviderLogo provider={session.__provider} className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {getSessionName(session, tSidebar)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {project.displayName}
                          {sessionTime && (
                            <span className="text-muted-foreground/60"> · {formatTimeAgo(sessionTime, now, tSidebar)}</span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {hasProjects && (
          <div className="mt-8">
            <SectionLabel>{t('welcome.projects')}</SectionLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {recentProjects.map((project) => {
                const lastActivity = getProjectLastActivity(project);
                const hasActivity = lastActivity.getTime() > 0;

                return (
                  <button
                    key={project.projectId}
                    type="button"
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-3.5 py-3 text-left transition-colors hover:border-border hover:bg-accent/50"
                    onClick={() => onProjectSelect?.(project)}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted/70">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{project.displayName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground/70" title={project.fullPath}>
                        {hasActivity ? formatTimeAgo(lastActivity.toISOString(), now, tSidebar) : project.fullPath}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MainContentStateView({
  mode,
  isMobile,
  onMenuClick,
  projects = [],
  onProjectSelect,
  onSessionSelect,
}: MainContentStateViewProps) {
  const { t } = useTranslation();

  const isLoading = mode === 'loading';

  return (
    <div className="flex h-full flex-col">
      {isMobile && (
        <div className="pwa-header-safe flex-shrink-0 border-b border-border/50 bg-background/80 p-2 backdrop-blur-sm sm:p-3">
          <MobileMenuButton onMenuClick={onMenuClick} compact />
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="mx-auto mb-4 h-10 w-10">
              <div
                className="h-full w-full rounded-full border-[3px] border-muted border-t-primary"
                style={{
                  animation: 'spin 1s linear infinite',
                  WebkitAnimation: 'spin 1s linear infinite',
                  MozAnimation: 'spin 1s linear infinite',
                }}
              />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-foreground">{t('mainContent.loading')}</h2>
            <p className="text-sm">{t('mainContent.settingUpWorkspace')}</p>
          </div>
        </div>
      ) : (
        <WelcomeView
          projects={projects}
          onProjectSelect={onProjectSelect}
          onSessionSelect={onSessionSelect}
        />
      )}
    </div>
  );
}
