import { useCallback, useRef, useState, useEffect } from 'react';
import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../../../lib/utils';
import { Tooltip } from '../../../../shared/view/ui';
import type { MainContentHeaderProps } from '../../types/types';

import MobileMenuButton from './MobileMenuButton';
import MainContentTabSwitcher from './MainContentTabSwitcher';
import MainContentTitle from './MainContentTitle';

export default function MainContentHeader({
  activeTab,
  setActiveTab,
  selectedProject,
  selectedSession,
  shouldShowTasksTab,
  filePanelOpen,
  onToggleFilePanel,
  isMobile,
  onMenuClick,
}: MainContentHeaderProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const filesLabel = t('mainContent.projectFiles', 'Project Files');

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState]);

  return (
    <div className="pwa-header-safe flex-shrink-0 border-b border-border/60 bg-background px-3 py-1.5 sm:px-4 sm:py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isMobile && <MobileMenuButton onMenuClick={onMenuClick} />}
          <MainContentTitle
            activeTab={activeTab}
            selectedProject={selectedProject}
            selectedSession={selectedSession}
            shouldShowTasksTab={shouldShowTasksTab}
          />
        </div>

        <div className="flex min-w-0 flex-shrink items-center gap-2 sm:flex-shrink-0">
          <Tooltip content={filesLabel} position="bottom">
            <button
              type="button"
              onClick={onToggleFilePanel}
              aria-label={filesLabel}
              aria-pressed={filePanelOpen}
              className={cn(
                'flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-all',
                filePanelOpen
                  ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border-border/70 bg-background hover:bg-accent hover:text-foreground',
              )}
            >
              <Folder className="h-4 w-4" strokeWidth={filePanelOpen ? 2.2 : 1.8} />
              <span className="hidden sm:inline">{filesLabel}</span>
            </button>
          </Tooltip>

          <div className="relative min-w-0 flex-shrink overflow-hidden">
            {canScrollLeft && (
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent" />
            )}
            <div
              ref={scrollRef}
              onScroll={updateScrollState}
              className="scrollbar-hide overflow-x-auto"
            >
              <MainContentTabSwitcher
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                shouldShowTasksTab={shouldShowTasksTab}
              />
            </div>
            {canScrollRight && (
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
