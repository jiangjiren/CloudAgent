import { useCallback, useEffect, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Folder, ClipboardCheck, ChevronDown, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Tooltip, PillBar, Pill } from '../../../../shared/view/ui';
import { cn } from '../../../../lib/utils';
import type { AppTab } from '../../../../types/app';
import { usePlugins } from '../../../../contexts/PluginsContext';
import PluginIcon from '../../../plugins/view/PluginIcon';

type MainContentTabSwitcherProps = {
  activeTab: AppTab;
  setActiveTab: Dispatch<SetStateAction<AppTab>>;
  shouldShowTasksTab: boolean;
};

type BuiltInTab = {
  kind: 'builtin';
  id: AppTab;
  labelKey: string;
  icon: LucideIcon;
};

type PluginTab = {
  kind: 'plugin';
  id: AppTab;
  label: string;
  pluginName: string;
  iconFile: string;
};

const BASE_TABS: BuiltInTab[] = [
  { kind: 'builtin', id: 'chat',  labelKey: 'tabs.chat',  icon: MessageSquare },
  { kind: 'builtin', id: 'files', labelKey: 'tabs.files', icon: Folder },
];

const TASKS_TAB: BuiltInTab = {
  kind: 'builtin',
  id: 'tasks',
  labelKey: 'tabs.tasks',
  icon: ClipboardCheck,
};

// Plugins are user-installed and unbounded in number, so they don't get a
// permanent slot in the primary tab row (that grows unboundedly and forces
// horizontal scrolling). Instead they live behind this overflow menu, keeping
// the row a stable, small set of core navigation targets. The command palette
// still offers direct keyboard access to any plugin tab.
//
// The menu portals to document.body: the tab row sits inside ancestors with
// overflow-hidden/overflow-x-auto (for the horizontal-scroll safety net), so
// an absolutely-positioned dropdown would get clipped instead of overlaying.
function PluginOverflowMenu({
  pluginTabs,
  activeTab,
  setActiveTab,
}: {
  pluginTabs: PluginTab[];
  activeTab: AppTab;
  setActiveTab: Dispatch<SetStateAction<AppTab>>;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const activePluginTab = pluginTabs.find((tab) => tab.id === activeTab) ?? null;
  const isActive = activePluginTab !== null;
  const triggerLabel = activePluginTab?.label ?? t('tabs.more', 'More');

  return (
    <div ref={triggerRef} className="inline-flex flex-shrink-0">
      <Tooltip content={triggerLabel} position="bottom">
        <Pill
          isActive={isActive}
          onClick={() => setIsOpen((current) => !current)}
          className="px-2.5 py-[5px]"
        >
          {activePluginTab ? (
            <PluginIcon
              pluginName={activePluginTab.pluginName}
              iconFile={activePluginTab.iconFile}
              className="flex h-3.5 w-3.5 items-center justify-center [&>svg]:h-full [&>svg]:w-full"
            />
          ) : (
            <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
          )}
          <span className="hidden lg:inline">{triggerLabel}</span>
          <ChevronDown className="hidden h-3 w-3 opacity-60 lg:inline" />
        </Pill>
      </Tooltip>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={menuStyle ?? { position: 'fixed', top: -9999, left: -9999 }}
          className="w-48 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {pluginTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent',
                tab.id === activeTab && 'bg-accent/60',
              )}
              onClick={() => {
                setActiveTab(tab.id);
                setIsOpen(false);
              }}
            >
              <PluginIcon
                pluginName={tab.pluginName}
                iconFile={tab.iconFile}
                className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full"
              />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

export default function MainContentTabSwitcher({
  activeTab,
  setActiveTab,
  shouldShowTasksTab,
}: MainContentTabSwitcherProps) {
  const { t } = useTranslation();
  const { plugins } = usePlugins();

  const builtInTabs: BuiltInTab[] = shouldShowTasksTab ? [...BASE_TABS, TASKS_TAB] : BASE_TABS;

  const pluginTabs: PluginTab[] = plugins
    .filter((p) => p.enabled)
    .map((p) => ({
      kind: 'plugin',
      id: `plugin:${p.name}` as AppTab,
      label: p.displayName,
      pluginName: p.name,
      iconFile: p.icon,
    }));

  return (
    <PillBar>
      {builtInTabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const displayLabel = t(tab.labelKey);

        return (
          <Tooltip key={tab.id} content={displayLabel} position="bottom">
            <Pill
              isActive={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="px-2.5 py-[5px]"
            >
              <tab.icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="hidden lg:inline">{displayLabel}</span>
            </Pill>
          </Tooltip>
        );
      })}

      {pluginTabs.length > 0 && (
        <PluginOverflowMenu pluginTabs={pluginTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </PillBar>
  );
}
