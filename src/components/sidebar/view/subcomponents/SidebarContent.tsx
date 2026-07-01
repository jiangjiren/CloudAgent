import { useState, type ReactNode } from 'react';
import { Archive, ChevronDown, ChevronRight, Folder, MessageSquare, RotateCcw, Search, Trash2 } from 'lucide-react';
import type { TFunction } from 'i18next';

import { ScrollArea } from '../../../../shared/view/ui';
import type { Project } from '../../../../types/app';
import type { ConversationSearchResults, SearchProgress } from '../../hooks/useSidebarController';
import type { ArchivedProjectListItem, ArchivedSessionListItem, SidebarSearchMode } from '../../types/types';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import { getAllSessions } from '../../utils/utils';

import SidebarFooter from './SidebarFooter';
import SidebarHeader from './SidebarHeader';
import SidebarProjectList, { type SidebarProjectListProps } from './SidebarProjectList';

function HighlightedSnippet({ snippet, highlights }: { snippet: string; highlights: { start: number; end: number }[] }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const h of highlights) {
    if (h.start > cursor) {
      parts.push(snippet.slice(cursor, h.start));
    }
    parts.push(
      <mark key={h.start} className="rounded-sm bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-800">
        {snippet.slice(h.start, h.end)}
      </mark>,
    );
    cursor = h.end;
  }
  if (cursor < snippet.length) {
    parts.push(snippet.slice(cursor));
  }
  return <span className="text-xs leading-relaxed text-muted-foreground">{parts}</span>;
}

type ArchivedSessionGroup = {
  key: string;
  projectId: string | null;
  projectDisplayName: string;
  projectPath: string | null;
  isProjectArchived: boolean;
  sessions: ArchivedSessionListItem[];
  latestActivity: string | null;
};

function groupArchivedSessionsByProject(sessions: ArchivedSessionListItem[]): ArchivedSessionGroup[] {
  const groups = new Map<string, ArchivedSessionGroup>();

  for (const session of sessions) {
    const key = session.projectId ?? session.projectPath ?? `session:${session.sessionId}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.sessions.push(session);
      if (!existingGroup.latestActivity || (session.lastActivity && session.lastActivity > existingGroup.latestActivity)) {
        existingGroup.latestActivity = session.lastActivity;
      }
      continue;
    }

    groups.set(key, {
      key,
      projectId: session.projectId,
      projectDisplayName: session.projectDisplayName,
      projectPath: session.projectPath,
      isProjectArchived: session.isProjectArchived,
      sessions: [session],
      latestActivity: session.lastActivity,
    });
  }

  return [...groups.values()].sort((groupA, groupB) => {
    const a = groupA.latestActivity ?? '';
    const b = groupB.latestActivity ?? '';
    return b.localeCompare(a);
  });
}

function formatCompactArchivedAge(dateString: string | null): string {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffInMinutes = Math.floor(Math.max(0, Date.now() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) {
    return '<1m';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}hr`;
  }

  return `${Math.floor(diffInHours / 24)}d`;
}

function getArchivedProjectSessionTime(session: ReturnType<typeof getAllSessions>[number]): string | null {
  if (typeof session.lastActivity === 'string') {
    return session.lastActivity;
  }
  if (typeof session.updated_at === 'string') {
    return session.updated_at;
  }
  if (typeof session.created_at === 'string') {
    return session.created_at;
  }
  return null;
}

function getArchivedProjectSessionTitle(session: ReturnType<typeof getAllSessions>[number]): string {
  if (typeof session.summary === 'string' && session.summary.trim().length > 0) {
    return session.summary;
  }
  if (typeof session.name === 'string' && session.name.trim().length > 0) {
    return session.name;
  }
  return String(session.id);
}

function SmallEmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="px-4 py-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        {icon ?? <Search className="h-5 w-5 text-muted-foreground" />}
      </div>
      <h3 className="mb-1 text-sm font-medium text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

function SearchSection({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: ReactNode;
  count?: number | string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {icon}
          <h2 className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

type ConversationResultsProps = {
  conversationResults: ConversationSearchResults | null;
  isSearching: boolean;
  searchProgress: SearchProgress | null;
  showEmpty: boolean;
  onConversationResultClick: (
    projectId: string | null,
    sessionId: string,
    provider: string,
    messageTimestamp?: string | null,
    messageSnippet?: string | null,
  ) => void;
  t: TFunction;
};

function ConversationResultsList({
  conversationResults,
  isSearching,
  searchProgress,
  showEmpty,
  onConversationResultClick,
  t,
}: ConversationResultsProps) {
  const hasPartialResults = Boolean(conversationResults && conversationResults.results.length > 0);

  if (isSearching && !hasPartialResults) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
        <p className="text-sm text-muted-foreground">{t('search.searching')}</p>
        {searchProgress && (
          <p className="mt-1 text-xs text-muted-foreground/60">
            {t('search.projectsScanned', { count: searchProgress.scannedProjects })}/{searchProgress.totalProjects}
          </p>
        )}
      </div>
    );
  }

  if (!isSearching && conversationResults && conversationResults.results.length === 0) {
    return showEmpty ? (
      <SmallEmptyState
        title={t('search.noResults')}
        description={t('search.tryDifferentQuery')}
        icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
      />
    ) : null;
  }

  if (!hasPartialResults) {
    return null;
  }

  return (
    <div className="space-y-3 px-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          {t('search.matches', { count: conversationResults?.totalMatches ?? 0 })}
        </p>
        {isSearching && searchProgress && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-muted-foreground/40 border-t-primary" />
            <p className="text-[10px] text-muted-foreground/60">
              {searchProgress.scannedProjects}/{searchProgress.totalProjects}
            </p>
          </div>
        )}
      </div>
      {isSearching && searchProgress && (
        <div className="mx-1 h-0.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/60 transition-all duration-300"
            style={{ width: `${Math.round((searchProgress.scannedProjects / searchProgress.totalProjects) * 100)}%` }}
          />
        </div>
      )}
      {conversationResults?.results.map((projectResult) => (
        <div key={projectResult.projectName} className="space-y-1">
          <div className="flex items-center gap-1.5 px-1 py-1">
            <Folder className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-medium text-foreground">
              {projectResult.projectDisplayName}
            </span>
          </div>
          {projectResult.sessions.map((session) => (
            <button
              key={`${projectResult.projectId ?? projectResult.projectName}-${session.sessionId}`}
              className="w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-accent/50"
              onClick={() => onConversationResultClick(
                projectResult.projectId,
                session.sessionId,
                session.provider || session.matches[0]?.provider || 'claude',
                session.matches[0]?.timestamp,
                session.matches[0]?.snippet,
              )}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3 flex-shrink-0 text-primary" />
                <span className="truncate text-xs font-medium text-foreground">
                  {session.sessionSummary}
                </span>
                {session.provider && session.provider !== 'claude' && (
                  <span className="flex-shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] uppercase text-muted-foreground">
                    {session.provider}
                  </span>
                )}
              </div>
              <div className="space-y-1 pl-4">
                {session.matches.map((match, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="mt-0.5 flex-shrink-0 text-[10px] font-medium uppercase text-muted-foreground/60">
                      {match.role === 'user' ? 'U' : 'A'}
                    </span>
                    <HighlightedSnippet
                      snippet={match.snippet}
                      highlights={match.highlights}
                    />
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

type ArchiveResultsProps = {
  archivedProjects: ArchivedProjectListItem[];
  groupedArchivedSessions: ArchivedSessionGroup[];
  archivedSessionsCount: number;
  isArchivedSessionsLoading: boolean;
  showEmpty: boolean;
  onRestoreArchivedProject: (projectId: string) => void;
  onArchivedSessionClick: (session: ArchivedSessionListItem) => void;
  onRestoreArchivedSession: (sessionId: string) => void;
  onDeleteArchivedSession: (session: ArchivedSessionListItem) => void;
  t: TFunction;
};

function ArchiveResultsList({
  archivedProjects,
  groupedArchivedSessions,
  archivedSessionsCount,
  isArchivedSessionsLoading,
  showEmpty,
  onRestoreArchivedProject,
  onArchivedSessionClick,
  onRestoreArchivedSession,
  onDeleteArchivedSession,
  t,
}: ArchiveResultsProps) {
  if (isArchivedSessionsLoading) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
        <h3 className="mb-1 text-sm font-medium text-foreground">
          {t('archived.loadingTitle', 'Loading archive...')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('archived.loadingDescription', 'Fetching hidden workspaces and sessions you can restore later.')}
        </p>
      </div>
    );
  }

  if (archivedProjects.length === 0 && groupedArchivedSessions.length === 0) {
    return showEmpty ? (
      <SmallEmptyState
        title={archivedSessionsCount > 0
          ? t('archived.noMatchingSessions', 'No matching archived items')
          : t('archived.emptyTitle', 'No archived items')}
        description={archivedSessionsCount > 0
          ? t('archived.tryDifferentSearch', 'Try a different search term.')
          : t('archived.emptyDescription', 'Archived workspaces and sessions will appear here when you hide them from the active list.')}
        icon={<Archive className="h-5 w-5 text-muted-foreground" />}
      />
    ) : null;
  }

  return (
    <div className="space-y-3 px-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          {`${archivedSessionsCount} ${t(
            archivedSessionsCount === 1 ? 'archived.sessionCountOne' : 'archived.sessionCountOther',
            archivedSessionsCount === 1 ? 'archived item' : 'archived items',
          )}`}
        </p>
      </div>
      {archivedProjects.map((project) => {
        const projectSessions = getAllSessions(project);

        return (
          <div key={project.projectId} className="overflow-hidden rounded-lg border border-border/70 bg-card/60 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium text-foreground">
                    {project.displayName}
                  </span>
                  <span className="inline-flex items-center justify-center rounded-full bg-muted px-1 py-px text-center text-[7px] font-medium uppercase leading-none tracking-[0.02em] text-muted-foreground">
                    {t('archived.projectArchived', 'Project archived')}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground/70" title={project.fullPath}>
                  {project.fullPath}
                </p>
              </div>
              <button
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                onClick={() => onRestoreArchivedProject(project.projectId)}
                title={t('archived.restoreProject', 'Restore workspace')}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
            {projectSessions.length > 0 && (
              <div className="divide-y divide-border/50">
                {projectSessions.map((session) => (
                  <button
                    key={String(session.id)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
                    onClick={() => onArchivedSessionClick({
                      sessionId: String(session.id),
                      provider: session.__provider,
                      projectId: project.projectId,
                      projectPath: project.fullPath,
                      projectDisplayName: project.displayName,
                      sessionTitle: getArchivedProjectSessionTitle(session),
                      createdAt: typeof session.created_at === 'string' ? session.created_at : null,
                      updatedAt: typeof session.updated_at === 'string' ? session.updated_at : null,
                      lastActivity: getArchivedProjectSessionTime(session),
                      isProjectArchived: true,
                    })}
                  >
                    <SessionProviderLogo provider={session.__provider} className="h-3.5 w-3.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium text-foreground">
                          {getArchivedProjectSessionTitle(session)}
                        </span>
                        <span className="ml-auto flex-shrink-0 text-[11px] text-muted-foreground">
                          {formatCompactArchivedAge(getArchivedProjectSessionTime(session))}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                        {session.__provider}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {groupedArchivedSessions.map((group) => (
        <div key={group.key} className="overflow-hidden rounded-lg border border-border/70 bg-card/60 shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-border/60 px-3 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium text-foreground">
                  {group.projectDisplayName}
                </span>
                {group.isProjectArchived && (
                  <span className="inline-flex items-center justify-center rounded-full bg-muted px-1 py-px text-center text-[7px] font-medium uppercase leading-none tracking-[0.02em] text-muted-foreground">
                    {t('archived.projectArchived', 'Project archived')}
                  </span>
                )}
              </div>
              {group.projectPath && (
                <p className="mt-1 truncate text-xs text-muted-foreground/70" title={group.projectPath}>
                  {group.projectPath}
                </p>
              )}
            </div>
            <span className="flex-shrink-0 text-[11px] text-muted-foreground">
              {group.sessions.length}
            </span>
          </div>
          <div className="divide-y divide-border/50">
            {group.sessions.map((session) => (
              <div key={session.sessionId} className="flex items-center gap-2 px-3 py-2.5">
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left transition-colors hover:text-foreground"
                  onClick={() => onArchivedSessionClick(session)}
                >
                  <SessionProviderLogo provider={session.provider} className="h-3.5 w-3.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-medium text-foreground">
                        {session.sessionTitle}
                      </span>
                      {session.lastActivity && (
                        <span className="ml-auto flex-shrink-0 text-[11px] text-muted-foreground">
                          {formatCompactArchivedAge(session.lastActivity)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                      {session.provider}
                    </p>
                  </div>
                </button>
                <button
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                  onClick={() => onRestoreArchivedSession(session.sessionId)}
                  title={t('archived.restore', 'Restore session')}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                  onClick={() => onDeleteArchivedSession(session)}
                  title={t('archived.deletePermanently', 'Delete permanently')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type SidebarContentProps = {
  isPWA: boolean;
  isMobile: boolean;
  isLoading: boolean;
  projects: Project[];
  archivedProjects: ArchivedProjectListItem[];
  archivedSessions: ArchivedSessionListItem[];
  archivedSessionsCount: number;
  isArchivedSessionsLoading: boolean;
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  onClearSearchFilter: () => void;
  searchMode: SidebarSearchMode;
  onSearchModeChange: (mode: SidebarSearchMode) => void;
  conversationResults: ConversationSearchResults | null;
  isSearching: boolean;
  searchProgress: SearchProgress | null;
  onRestoreArchivedProject: (projectId: string) => void;
  onArchivedSessionClick: (session: ArchivedSessionListItem) => void;
  onRestoreArchivedSession: (sessionId: string) => void;
  onDeleteArchivedSession: (session: ArchivedSessionListItem) => void;
  onConversationResultClick: (projectId: string | null, sessionId: string, provider: string, messageTimestamp?: string | null, messageSnippet?: string | null) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onCreateProject: () => void;
  onCollapseSidebar: () => void;
  onShowSettings: () => void;
  projectListProps: SidebarProjectListProps;
  t: TFunction;
};

export default function SidebarContent({
  isPWA,
  isMobile,
  isLoading,
  projects,
  archivedProjects,
  archivedSessions,
  archivedSessionsCount,
  isArchivedSessionsLoading,
  searchFilter,
  onSearchFilterChange,
  onClearSearchFilter,
  searchMode,
  onSearchModeChange,
  conversationResults,
  isSearching,
  searchProgress,
  onRestoreArchivedProject,
  onArchivedSessionClick,
  onRestoreArchivedSession,
  onDeleteArchivedSession,
  onConversationResultClick,
  onRefresh,
  isRefreshing,
  onCreateProject,
  onCollapseSidebar,
  onShowSettings,
  projectListProps,
  t,
}: SidebarContentProps) {
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
  const searchQuery = searchFilter.trim();
  const hasSearchQuery = searchQuery.length > 0;
  const groupedArchivedSessions = groupArchivedSessionsByProject(archivedSessions);
  const visibleArchivedItemsCount = archivedProjects.length + groupedArchivedSessions.reduce(
    (total, group) => total + group.sessions.length,
    0,
  );
  const projectMatchesCount = projectListProps.filteredProjects.length;
  const hasConversationRows = Boolean(conversationResults && conversationResults.results.length > 0);
  const allSearchHasNoResults =
    searchMode === 'all' &&
    projectMatchesCount === 0 &&
    visibleArchivedItemsCount === 0 &&
    (searchQuery.length < 2 || (!isSearching && conversationResults && conversationResults.results.length === 0));

  const archiveResults = (
    <ArchiveResultsList
      archivedProjects={archivedProjects}
      groupedArchivedSessions={groupedArchivedSessions}
      archivedSessionsCount={archivedSessionsCount}
      isArchivedSessionsLoading={isArchivedSessionsLoading}
      showEmpty
      onRestoreArchivedProject={onRestoreArchivedProject}
      onArchivedSessionClick={onArchivedSessionClick}
      onRestoreArchivedSession={onRestoreArchivedSession}
      onDeleteArchivedSession={onDeleteArchivedSession}
      t={t}
    />
  );

  return (
    <div className="flex h-full flex-col bg-background/80 backdrop-blur-sm md:w-72 md:select-none">
      <SidebarHeader
        isPWA={isPWA}
        isMobile={isMobile}
        isLoading={isLoading}
        projectsCount={projects.length}
        archivedSessionsCount={archivedSessionsCount}
        isArchivedSessionsLoading={isArchivedSessionsLoading}
        searchFilter={searchFilter}
        onSearchFilterChange={onSearchFilterChange}
        onClearSearchFilter={onClearSearchFilter}
        searchMode={searchMode}
        onSearchModeChange={onSearchModeChange}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onCreateProject={onCreateProject}
        onCollapseSidebar={onCollapseSidebar}
        t={t}
      />

      <ScrollArea className="flex-1 overflow-y-auto overscroll-contain md:px-1.5 md:py-2">
        {hasSearchQuery ? (
          <div className="space-y-4 pb-3">
            {searchMode === 'all' && (
              <>
                {projectMatchesCount > 0 && (
                  <SearchSection
                    title={t('search.modeProjects')}
                    icon={<Folder className="h-3.5 w-3.5 text-muted-foreground" />}
                    count={projectMatchesCount}
                  >
                    <SidebarProjectList {...projectListProps} />
                  </SearchSection>
                )}
                {searchQuery.length >= 2 && (isSearching || hasConversationRows) && (
                  <SearchSection
                    title={t('search.modeConversations')}
                    icon={<MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
                    count={conversationResults?.totalMatches}
                  >
                    <ConversationResultsList
                      conversationResults={conversationResults}
                      isSearching={isSearching}
                      searchProgress={searchProgress}
                      showEmpty={false}
                      onConversationResultClick={onConversationResultClick}
                      t={t}
                    />
                  </SearchSection>
                )}
                {visibleArchivedItemsCount > 0 && (
                  <SearchSection
                    title={t('archived.title', 'Archive')}
                    icon={<Archive className="h-3.5 w-3.5 text-muted-foreground" />}
                    count={visibleArchivedItemsCount}
                  >
                    <ArchiveResultsList
                      archivedProjects={archivedProjects}
                      groupedArchivedSessions={groupedArchivedSessions}
                      archivedSessionsCount={archivedSessionsCount}
                      isArchivedSessionsLoading={isArchivedSessionsLoading}
                      showEmpty={false}
                      onRestoreArchivedProject={onRestoreArchivedProject}
                      onArchivedSessionClick={onArchivedSessionClick}
                      onRestoreArchivedSession={onRestoreArchivedSession}
                      onDeleteArchivedSession={onDeleteArchivedSession}
                      t={t}
                    />
                  </SearchSection>
                )}
                {allSearchHasNoResults && (
                  <SmallEmptyState
                    title={t('search.noResults')}
                    description={t('search.tryDifferentQuery')}
                    icon={<Search className="h-5 w-5 text-muted-foreground" />}
                  />
                )}
              </>
            )}

            {searchMode === 'projects' && (
              <SearchSection
                title={t('search.modeProjects')}
                icon={<Folder className="h-3.5 w-3.5 text-muted-foreground" />}
                count={projectMatchesCount}
              >
                {projectMatchesCount > 0 ? (
                  <SidebarProjectList {...projectListProps} />
                ) : (
                  <SmallEmptyState
                    title={t('projects.noMatchingProjects')}
                    description={t('projects.tryDifferentSearch')}
                    icon={<Folder className="h-5 w-5 text-muted-foreground" />}
                  />
                )}
              </SearchSection>
            )}

            {searchMode === 'conversations' && (
              <SearchSection
                title={t('search.modeConversations')}
                icon={<MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
                count={conversationResults?.totalMatches}
              >
                {searchQuery.length < 2 ? (
                  <SmallEmptyState
                    title={t('search.keepTypingTitle', 'Keep typing')}
                    description={t('search.keepTypingDescription', 'Enter at least 2 characters to search conversation content.')}
                    icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
                  />
                ) : (
                  <ConversationResultsList
                    conversationResults={conversationResults}
                    isSearching={isSearching}
                    searchProgress={searchProgress}
                    showEmpty
                    onConversationResultClick={onConversationResultClick}
                    t={t}
                  />
                )}
              </SearchSection>
            )}

            {searchMode === 'archived' && (
              <SearchSection
                title={t('archived.title', 'Archive')}
                icon={<Archive className="h-3.5 w-3.5 text-muted-foreground" />}
                count={visibleArchivedItemsCount}
              >
                {archiveResults}
              </SearchSection>
            )}
          </div>
        ) : (
          <SidebarProjectList {...projectListProps} />
        )}
      </ScrollArea>

      {!hasSearchQuery && (
        <div className="border-t border-border/70 bg-background/95">
          <button
            type="button"
            className="flex h-10 w-full items-center gap-2 px-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            onClick={() => setIsArchiveExpanded((current) => !current)}
            aria-expanded={isArchiveExpanded}
          >
            {isArchiveExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <Archive className="h-3.5 w-3.5" />
            <span className="min-w-0 flex-1 truncate">{t('archived.title', 'Archive')}</span>
            {isArchivedSessionsLoading ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-muted-foreground/40 border-t-primary" />
            ) : (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {archivedSessionsCount}
              </span>
            )}
          </button>
          {isArchiveExpanded && (
            <div className="max-h-80 overflow-y-auto pb-2 pt-1">
              {archiveResults}
            </div>
          )}
        </div>
      )}

      <SidebarFooter
        onShowSettings={onShowSettings}
        t={t}
      />
    </div>
  );
}
