import { PanelLeftOpen, Plus, User } from 'lucide-react';
import type { TFunction } from 'i18next';

import { useAuth } from '../../../auth/context/AuthContext';

type SidebarCollapsedProps = {
  onExpand: () => void;
  onNewConversation: () => void | Promise<void>;
  onShowSettings: () => void;
  t: TFunction;
};

/**
 * Collapsed rail: only the expand button, the project-independent "New Chat"
 * action, and the user avatar at the bottom. Settings intentionally lives only
 * in the expanded sidebar's footer to keep this rail minimal.
 */
export default function SidebarCollapsed({
  onExpand,
  onNewConversation,
  onShowSettings,
  t,
}: SidebarCollapsedProps) {
  const { user } = useAuth();
  const username = typeof user?.username === 'string' && user.username.trim().length > 0 ? user.username.trim() : null;
  const initial = username ? username.charAt(0).toUpperCase() : null;

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

      {/* Project-independent "New Chat" — never disabled, matches the expanded
          sidebar's primary entry point. */}
      <button
        type="button"
        onClick={() => void onNewConversation()}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        aria-label={t('actions.newConversation')}
        title={t('actions.newConversation')}
      >
        <Plus className="h-4 w-4" />
      </button>

      <div className="flex-1" />

      {/* User avatar opens settings, mirroring the expanded footer's account row */}
      <button
        onClick={onShowSettings}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold uppercase text-primary transition-colors hover:bg-primary/25"
        aria-label={t('actions.settings')}
        title={t('actions.settings')}
      >
        {initial ?? <User className="h-4 w-4" />}
      </button>
    </div>
  );
}
