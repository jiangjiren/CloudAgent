import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import ChatInterface from '../../chat/view/ChatInterface';
import StandaloneShell from '../../standalone-shell/view/StandaloneShell';
import GitPanel from '../../git-panel/view/GitPanel';
import PluginTabContent from '../../plugins/view/PluginTabContent';
import type { MainContentProps } from '../types/types';
import { useTaskMaster } from '../../../contexts/TaskMasterContext';
import { usePaletteOpsRegister } from '../../../contexts/PaletteOpsContext';
import { useTasksSettings } from '../../../contexts/TasksSettingsContext';
import { useUiPreferences } from '../../../hooks/useUiPreferences';
import type { CodeEditorDiffInfo, CodeEditorFile } from '../../code-editor/types/types';
import type { Project } from '../../../types/app';

import MainContentHeader from './subcomponents/MainContentHeader';
import MainContentStateView from './subcomponents/MainContentStateView';
import FileWorkspacePanel from './subcomponents/FileWorkspacePanel';
import ErrorBoundary from './ErrorBoundary';

const TaskMasterPanel = React.lazy(() => import('../../task-master').then((module) => ({ default: module.TaskMasterPanel })));

const FILE_PANEL_DEFAULT_WIDTH = 760;
const FILE_PANEL_MIN_WIDTH = 460;
const MAIN_CONTENT_MIN_WIDTH = 360;

type TaskMasterContextValue = {
  currentProject?: Project | null;
  setCurrentProject?: ((project: Project) => void) | null;
};

type TasksSettingsContextValue = {
  tasksEnabled: boolean;
  isTaskMasterInstalled: boolean | null;
  isTaskMasterReady: boolean | null;
};

function MainContent({
  projects,
  selectedProject,
  selectedSession,
  onProjectSelect,
  onSessionSelect,
  activeTab,
  setActiveTab,
  ws,
  sendMessage,
  latestMessage,
  isMobile,
  onMenuClick,
  isLoading,
  onInputFocusChange,
  onSessionActive,
  onSessionInactive,
  onSessionProcessing,
  onSessionNotProcessing,
  processingSessions,
  onNavigateToSession,
  onShowSettings,
  externalMessageUpdate,
  newSessionTrigger,
}: MainContentProps) {
  const { preferences, setPreference } = useUiPreferences();
  const { autoExpandTools, showRawParameters, showThinking, autoScrollToBottom, sendByCtrlEnter, sidebarVisible } = preferences;

  const sidebarAutoCollapsedRef = useRef(false);
  // The whole files inspector reduces to three pieces of state.
  const [filePanelOpen, setFilePanelOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CodeEditorFile | null>(null);
  const [filePanelWidth, setFilePanelWidth] = useState(FILE_PANEL_DEFAULT_WIDTH);

  const [isFilePanelResizing, setIsFilePanelResizing] = useState(false);
  const contentAreaRef = useRef<HTMLDivElement | null>(null);
  const filePanelResizeHandleRef = useRef<HTMLDivElement | null>(null);

  const { currentProject, setCurrentProject } = useTaskMaster() as TaskMasterContextValue;
  const { tasksEnabled, isTaskMasterInstalled } = useTasksSettings() as TasksSettingsContextValue;

  const shouldShowTasksTab = Boolean(tasksEnabled && isTaskMasterInstalled);

  // Opening a file from anywhere (tree, chat, git, palette) means opening the
  // panel with that file selected — one surface, one state.
  const handleFileOpen = useCallback(
    (filePath: string, diffInfo: CodeEditorDiffInfo | null = null) => {
      const normalizedPath = filePath.replace(/\\/g, '/');
      const fileName = normalizedPath.split('/').pop() || filePath;

      setSelectedFile({
        name: fileName,
        path: filePath,
        // DB projectId is forwarded to the editor so it can read/save files
        // via `/api/projects/:projectId/file` endpoints.
        projectId: selectedProject?.projectId,
        diffInfo,
      });
      setFilePanelOpen(true);
    },
    [selectedProject?.projectId],
  );

  const handleCloseFilePanel = useCallback(() => {
    setFilePanelOpen(false);
    setSelectedFile(null);
  }, []);

  const clampFilePanelWidth = useCallback((width: number) => {
    const containerWidth = contentAreaRef.current?.getBoundingClientRect().width;
    const maxWidth = containerWidth
      ? Math.max(containerWidth - MAIN_CONTENT_MIN_WIDTH, FILE_PANEL_MIN_WIDTH)
      : Number.POSITIVE_INFINITY;
    return Math.min(Math.max(width, FILE_PANEL_MIN_WIDTH), maxWidth);
  }, []);

  const handleToggleFilePanel = useCallback(() => {
    if (filePanelOpen) {
      handleCloseFilePanel();
      return;
    }
    setFilePanelWidth((width) => clampFilePanelWidth(width));
    setFilePanelOpen(true);
  }, [filePanelOpen, handleCloseFilePanel, clampFilePanelWidth]);

  const handleFilePanelResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile || event.button !== 0) {
        return;
      }
      setIsFilePanelResizing(true);
      event.preventDefault();
      event.stopPropagation();
    },
    [isMobile],
  );

  useEffect(() => {
    if (!isFilePanelResizing) {
      return undefined;
    }

    const handleMouseMove = (event: globalThis.MouseEvent) => {
      if (event.buttons !== 1) {
        setIsFilePanelResizing(false);
        return;
      }

      const containerRect = contentAreaRef.current?.getBoundingClientRect();
      if (!containerRect) {
        return;
      }

      setFilePanelWidth(clampFilePanelWidth(containerRect.right - event.clientX));
    };

    const stopResize = () => {
      setIsFilePanelResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', stopResize, true);
    document.addEventListener('contextmenu', stopResize, true);
    window.addEventListener('blur', stopResize);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', stopResize, true);
      document.removeEventListener('contextmenu', stopResize, true);
      window.removeEventListener('blur', stopResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isFilePanelResizing, clampFilePanelWidth]);

  useEffect(() => {
    if (isMobile) return;

    // The panel needs the horizontal room the sidebar occupies; give it back
    // when the panel closes, unless the user re-expanded the sidebar themselves.
    const shouldAutoCollapse = filePanelOpen;

    if (shouldAutoCollapse) {
      if (sidebarVisible) {
        if (sidebarAutoCollapsedRef.current) {
          // If we auto-collapsed it, but now it is visible, the user manually expanded it.
          // We respect this and release the auto-collapse hold.
          sidebarAutoCollapsedRef.current = false;
        } else {
          sidebarAutoCollapsedRef.current = true;
          setPreference('sidebarVisible', false);
        }
      }
    } else {
      if (!sidebarVisible && sidebarAutoCollapsedRef.current) {
        sidebarAutoCollapsedRef.current = false;
        setPreference('sidebarVisible', true);
      }
    }
  }, [filePanelOpen, sidebarVisible, isMobile, setPreference]);

  useEffect(() => {
    // Identify projects by DB `projectId`; the TaskMaster context uses the
    // same identifier to key its internal maps.
    const selectedProjectId = selectedProject?.projectId;
    const currentProjectId = currentProject?.projectId;

    if (selectedProject && selectedProjectId !== currentProjectId) {
      setCurrentProject?.(selectedProject);
    }
  }, [selectedProject, currentProject?.projectId, setCurrentProject]);

  useEffect(() => {
    if (!shouldShowTasksTab && activeTab === 'tasks') {
      setActiveTab('chat');
    }
  }, [shouldShowTasksTab, activeTab, setActiveTab]);

  useEffect(() => {
    if (activeTab === 'files') {
      setFilePanelOpen(true);
      setActiveTab('chat');
    }
  }, [activeTab, setActiveTab]);

  usePaletteOpsRegister({
    openFile: (filePath: string) => {
      handleFileOpen(filePath);
    },
  });

  if (isLoading) {
    return <MainContentStateView mode="loading" isMobile={isMobile} onMenuClick={onMenuClick} />;
  }

  if (!selectedProject) {
    return (
      <MainContentStateView
        mode="empty"
        isMobile={isMobile}
        onMenuClick={onMenuClick}
        projects={projects}
        onProjectSelect={onProjectSelect}
        onSessionSelect={onSessionSelect}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <MainContentHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedProject={selectedProject}
        selectedSession={selectedSession}
        shouldShowTasksTab={shouldShowTasksTab}
        filePanelOpen={filePanelOpen}
        onToggleFilePanel={handleToggleFilePanel}
        isMobile={isMobile}
        onMenuClick={onMenuClick}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden" ref={contentAreaRef}>
        <div className="flex min-h-0 min-w-[200px] flex-1 flex-col overflow-hidden">
          <div className={`h-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
            <ErrorBoundary showDetails>
              <ChatInterface
                selectedProject={selectedProject}
                selectedSession={selectedSession}
                ws={ws}
                sendMessage={sendMessage}
                latestMessage={latestMessage}
                onFileOpen={handleFileOpen}
                onInputFocusChange={onInputFocusChange}
                onSessionActive={onSessionActive}
                onSessionInactive={onSessionInactive}
                onSessionProcessing={onSessionProcessing}
                onSessionNotProcessing={onSessionNotProcessing}
                processingSessions={processingSessions}
                onNavigateToSession={onNavigateToSession}
                onShowSettings={onShowSettings}
                autoExpandTools={autoExpandTools}
                showRawParameters={showRawParameters}
                showThinking={showThinking}
                autoScrollToBottom={autoScrollToBottom}
                sendByCtrlEnter={sendByCtrlEnter}
                externalMessageUpdate={externalMessageUpdate}
                newSessionTrigger={newSessionTrigger}
                onShowAllTasks={tasksEnabled ? () => setActiveTab('tasks') : null}
              />
            </ErrorBoundary>
          </div>

          {activeTab === 'shell' && (
            <div className="h-full w-full overflow-hidden">
              <StandaloneShell
                project={selectedProject}
                session={selectedSession}
                showHeader={false}
                isActive={activeTab === 'shell'}
              />
            </div>
          )}

          {activeTab === 'git' && (
            <div className="h-full overflow-hidden">
              <GitPanel selectedProject={selectedProject} isMobile={isMobile} onFileOpen={handleFileOpen} />
            </div>
          )}

          {shouldShowTasksTab && (
            <Suspense fallback={null}>
              <TaskMasterPanel isVisible={activeTab === 'tasks'} />
            </Suspense>
          )}

          <div className={`h-full overflow-hidden ${activeTab === 'preview' ? 'block' : 'hidden'}`} />

          {activeTab.startsWith('plugin:') && (
            <div className="h-full overflow-hidden">
              <PluginTabContent
                pluginName={activeTab.replace('plugin:', '')}
                selectedProject={selectedProject}
                selectedSession={selectedSession}
              />
            </div>
          )}
        </div>

        {filePanelOpen && (
          <FileWorkspacePanel
            selectedProject={selectedProject}
            selectedFile={selectedFile}
            isMobile={isMobile}
            width={filePanelWidth}
            isResizing={isFilePanelResizing}
            resizeHandleRef={filePanelResizeHandleRef}
            onResizeStart={handleFilePanelResizeStart}
            onFileOpen={handleFileOpen}
            onFileClose={() => setSelectedFile(null)}
            onClose={handleCloseFilePanel}
          />
        )}
      </div>
    </div>
  );
}

export default React.memo(MainContent);
