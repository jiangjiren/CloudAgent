import { Settings, PanelLeftOpen, SquarePen } from 'lucide-react';
import type { TFunction } from 'i18next';

import type { Project } from '../../../../types/app';

type SidebarCollapsedProps = {
  selectedProject: Project | null;
  onExpand: () => void;
  onNewSession: (project: Project) => void;
  onShowSettings: () => void;
  t: TFunction;
};

export default function SidebarCollapsed({
  selectedProject,
  onExpand,
  onNewSession,
  onShowSettings,
  t,
}: SidebarCollapsedProps) {
  const canCreateSession = Boolean(selectedProject);
  const newSessionLabel = canCreateSession
    ? t('sessions.newSession')
    : t('sessions.selectProjectFirst', 'Select a project first');

  return (
    <div className="flex h-full w-12 flex-col items-center gap-1 bg-background/80 py-3 backdrop-blur-sm">
      {/* Expand button with brand logo */}
      <button
        onClick={onExpand}
        className="group flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-accent/80"
        aria-label={t('common:versionUpdate.ariaLabels.showSidebar')}
        title={t('common:versionUpdate.ariaLabels.showSidebar')}
      >
        <PanelLeftOpen className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      </button>

      {/* New session for the current project */}
      <button
        type="button"
        onClick={() => {
          if (selectedProject) {
            onNewSession(selectedProject);
          }
        }}
        disabled={!canCreateSession}
        className="group flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        aria-label={newSessionLabel}
        title={newSessionLabel}
      >
        <SquarePen className="h-4 w-4" />
      </button>

      <div className="nav-divider my-1 w-6" />

      {/* Settings */}
      <button
        onClick={onShowSettings}
        className="group flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-accent/80"
        aria-label={t('actions.settings')}
        title={t('actions.settings')}
      >
        <Settings className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      </button>
    </div>
  );
}
