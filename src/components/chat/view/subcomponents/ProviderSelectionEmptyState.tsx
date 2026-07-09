import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Bug, GitCompare, type LucideIcon } from "lucide-react";

import type {
  ProjectSession,
  LLMProvider,
  ProviderModelsDefinition,
} from "../../../../types/app";

const NextTaskBanner = React.lazy(() => import("../../../task-master/view/NextTaskBanner"));

type ProviderSelectionEmptyStateProps = {
  selectedSession: ProjectSession | null;
  currentSessionId: string | null;
  provider: LLMProvider;
  setProvider: (next: LLMProvider) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  claudeModel: string;
  setClaudeModel: (model: string) => void;
  cursorModel: string;
  setCursorModel: (model: string) => void;
  codexModel: string;
  setCodexModel: (model: string) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  opencodeModel: string;
  setOpenCodeModel: (model: string) => void;
  providerModelCatalog: Partial<Record<LLMProvider, ProviderModelsDefinition>>;
  providerModelsLoading: boolean;
  tasksEnabled: boolean;
  isTaskMasterInstalled: boolean | null;
  onShowAllTasks?: (() => void) | null;
  setInput: React.Dispatch<React.SetStateAction<string>>;
};

// The model picker now lives in the composer (next to the send button). This
// empty state shows a welcome line, starter prompts that prefill the composer,
// and the optional task banner. The remaining props are kept on the interface
// so the caller does not have to change, but are no longer rendered here.
export default function ProviderSelectionEmptyState({
  selectedSession,
  currentSessionId,
  provider,
  textareaRef,
  tasksEnabled,
  isTaskMasterInstalled,
  onShowAllTasks,
  setInput,
}: ProviderSelectionEmptyStateProps) {
  const { t } = useTranslation("chat");

  const nextTaskPrompt = t("tasks.nextTaskPrompt", {
    defaultValue: "Start the next task",
  });

  const starters: Array<{ icon: LucideIcon; label: string; prompt: string }> = [
    {
      icon: BookOpen,
      label: t("starters.explainLabel"),
      prompt: t("starters.explainPrompt"),
    },
    {
      icon: GitCompare,
      label: t("starters.reviewLabel"),
      prompt: t("starters.reviewPrompt"),
    },
    {
      icon: Bug,
      label: t("starters.fixLabel"),
      prompt: t("starters.fixPrompt"),
    },
  ];

  const applyStarter = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  if (!selectedSession && !currentSessionId) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {t("providerSelection.title")}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("providerSelection.description")}
          </p>

          <div className="mt-6 space-y-2 text-left">
            {starters.map((starter) => (
              <button
                key={starter.label}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-3.5 py-2.5 text-left transition-colors hover:border-border hover:bg-accent/50"
                onClick={() => applyStarter(starter.prompt)}
              >
                <starter.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {starter.label}
                </span>
              </button>
            ))}
          </div>

          {provider && tasksEnabled && isTaskMasterInstalled && (
            <div className="mt-5">
              <Suspense fallback={null}>
                <NextTaskBanner
                  onStartTask={() => setInput(nextTaskPrompt)}
                  onShowAllTasks={onShowAllTasks}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md px-6 text-center">
          <p className="mb-1.5 text-lg font-semibold text-foreground">
            {t("session.continue.title")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("session.continue.description")}
          </p>

          {tasksEnabled && isTaskMasterInstalled && (
            <div className="mt-5">
              <Suspense fallback={null}>
                <NextTaskBanner
                  onStartTask={() => setInput(nextTaskPrompt)}
                  onShowAllTasks={onShowAllTasks}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
