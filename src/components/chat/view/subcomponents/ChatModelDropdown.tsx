import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronRight, Plug } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  LLMProvider,
  ProviderModelsDefinition,
} from "../../../../types/app";
import type { EffortLevel } from "../../types/types";
import type { ProviderAuthStatusMap } from "../../../provider-auth/types";
import SessionProviderLogo from "../../../llm-logo-provider/SessionProviderLogo";

const PROVIDER_META: { id: LLMProvider; name: string }[] = [
  { id: "claude", name: "Anthropic" },
  { id: "codex", name: "OpenAI" },
  { id: "gemini", name: "Google" },
  { id: "cursor", name: "Cursor" },
  { id: "opencode", name: "OpenCode" },
];

type ChatModelDropdownProps = {
  provider: LLMProvider;
  setProvider: (next: LLMProvider) => void;
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
  claudeEffort: EffortLevel;
  setClaudeEffort: (level: EffortLevel) => void;
  codexEffort: EffortLevel;
  setCodexEffort: (level: EffortLevel) => void;
  providerModelCatalog: Partial<Record<LLMProvider, ProviderModelsDefinition>>;
  providerModelsLoading: boolean;
  providerAuthStatus: ProviderAuthStatusMap;
  onShowSettings?: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
};

type MenuPosition = { bottom: number; right: number; maxHeight: number };

function getModelConfig(
  p: LLMProvider,
  catalog: Partial<Record<LLMProvider, ProviderModelsDefinition>>,
): ProviderModelsDefinition {
  return catalog[p] ?? { OPTIONS: [], DEFAULT: "" };
}

function getCurrentModel(
  p: LLMProvider,
  c: string,
  cu: string,
  co: string,
  g: string,
  o: string,
) {
  if (p === "claude") return c;
  if (p === "codex") return co;
  if (p === "gemini") return g;
  if (p === "opencode") return o;
  return cu;
}

function getProviderDisplayName(p: LLMProvider) {
  if (p === "claude") return "Claude";
  if (p === "cursor") return "Cursor";
  if (p === "codex") return "Codex";
  if (p === "opencode") return "OpenCode";
  return "Gemini";
}

export default function ChatModelDropdown({
  provider,
  setProvider,
  claudeModel,
  setClaudeModel,
  cursorModel,
  setCursorModel,
  codexModel,
  setCodexModel,
  geminiModel,
  setGeminiModel,
  opencodeModel,
  setOpenCodeModel,
  claudeEffort,
  setClaudeEffort,
  codexEffort,
  setCodexEffort,
  providerModelCatalog,
  providerModelsLoading,
  providerAuthStatus,
  onShowSettings,
  textareaRef,
}: ChatModelDropdownProps) {
  const { t } = useTranslation("chat");
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  // Which provider's model list is expanded in the menu. Defaults to the
  // active provider each time the menu opens; others collapse to single rows.
  const [expandedProvider, setExpandedProvider] = useState<LLMProvider>(provider);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Only providers the user has actually connected (authenticated) show up.
  const connectedGroups = useMemo(() => {
    return PROVIDER_META.filter(
      (p) => providerAuthStatus[p.id]?.authenticated,
    ).map((p) => ({
      id: p.id,
      name: p.name,
      models: providerModelCatalog[p.id]?.OPTIONS ?? [],
    }));
  }, [providerAuthStatus, providerModelCatalog]);

  const hasConnected = connectedGroups.length > 0;

  const currentModel = getCurrentModel(
    provider,
    claudeModel,
    cursorModel,
    codexModel,
    geminiModel,
    opencodeModel,
  );

  const currentModelLabel = useMemo(() => {
    const config = getModelConfig(provider, providerModelCatalog);
    const found = config.OPTIONS.find(
      (o: { value: string; label: string }) => o.value === currentModel,
    );
    return found?.label || currentModel;
  }, [provider, currentModel, providerModelCatalog]);

  // Thinking-depth levels, shown inside the menu rather than as a second
  // toolbar control. 'auto' is the invisible default: nothing is sent to the
  // backend and no badge appears on the trigger. Each provider exposes a
  // different subset of levels (Claude has max, Codex has minimal).
  const effortLabels: Record<
    EffortLevel,
    { label: string; short: string; description: string }
  > = useMemo(
    () => ({
      auto: {
        label: t("effort.auto", { defaultValue: "Auto" }),
        short: t("effort.autoShort", { defaultValue: "Auto" }),
        description: t("effort.autoDescription", {
          defaultValue: "The model decides how much to think",
        }),
      },
      minimal: {
        label: t("effort.minimal", { defaultValue: "Minimal" }),
        short: t("effort.minimalShort", { defaultValue: "Min" }),
        description: t("effort.minimalDescription", {
          defaultValue: "Quickest responses, barely any reasoning",
        }),
      },
      low: {
        label: t("effort.low", { defaultValue: "Low" }),
        short: t("effort.lowShort", { defaultValue: "Low" }),
        description: t("effort.lowDescription", {
          defaultValue: "Fastest responses, minimal thinking",
        }),
      },
      medium: {
        label: t("effort.medium", { defaultValue: "Medium" }),
        short: t("effort.mediumShort", { defaultValue: "Med" }),
        description: t("effort.mediumDescription", {
          defaultValue: "Balanced depth and speed",
        }),
      },
      high: {
        label: t("effort.high", { defaultValue: "High" }),
        short: t("effort.highShort", { defaultValue: "High" }),
        description: t("effort.highDescription", {
          defaultValue: "Deeper reasoning for harder tasks",
        }),
      },
      xhigh: {
        label: t("effort.xhigh", { defaultValue: "Very high" }),
        short: t("effort.xhighShort", { defaultValue: "XHigh" }),
        description: t("effort.xhighDescription", {
          defaultValue: "Extra depth for complex problems",
        }),
      },
      max: {
        label: t("effort.max", { defaultValue: "Max" }),
        short: t("effort.maxShort", { defaultValue: "Max" }),
        description: t("effort.maxDescription", {
          defaultValue: "Maximum effort · select models only",
        }),
      },
    }),
    [t],
  );

  const providerEffortLevels: Partial<Record<LLMProvider, EffortLevel[]>> = {
    claude: ["auto", "low", "medium", "high", "xhigh", "max"],
    codex: ["auto", "minimal", "low", "medium", "high", "xhigh"],
  };

  const getEffortForProvider = useCallback(
    (providerId: LLMProvider): EffortLevel | null => {
      if (providerId === "claude") return claudeEffort;
      if (providerId === "codex") return codexEffort;
      return null;
    },
    [claudeEffort, codexEffort],
  );

  const handleEffortSelect = useCallback(
    (providerId: LLMProvider, level: EffortLevel) => {
      if (providerId === "claude") {
        setClaudeEffort(level);
        localStorage.setItem("claude-effort", level);
      } else if (providerId === "codex") {
        setCodexEffort(level);
        localStorage.setItem("codex-effort", level);
      }
    },
    [setClaudeEffort, setCodexEffort],
  );

  const activeEffort = getEffortForProvider(provider);
  const activeEffortLevels = providerEffortLevels[provider] ?? null;

  // Active provider's group leads the menu; everything else collapses below it.
  const orderedGroups = useMemo(() => {
    return [
      ...connectedGroups.filter((g) => g.id === provider),
      ...connectedGroups.filter((g) => g.id !== provider),
    ];
  }, [connectedGroups, provider]);

  const setModelForProvider = useCallback(
    (providerId: LLMProvider, modelValue: string) => {
      if (providerId === "claude") {
        setClaudeModel(modelValue);
        localStorage.setItem("claude-model", modelValue);
      } else if (providerId === "codex") {
        setCodexModel(modelValue);
        localStorage.setItem("codex-model", modelValue);
      } else if (providerId === "gemini") {
        setGeminiModel(modelValue);
        localStorage.setItem("gemini-model", modelValue);
      } else if (providerId === "opencode") {
        setOpenCodeModel(modelValue);
        localStorage.setItem("opencode-model", modelValue);
      } else {
        setCursorModel(modelValue);
        localStorage.setItem("cursor-model", modelValue);
      }
    },
    [setClaudeModel, setCursorModel, setCodexModel, setGeminiModel, setOpenCodeModel],
  );

  const handleModelSelect = useCallback(
    (providerId: LLMProvider, modelValue: string) => {
      setProvider(providerId);
      localStorage.setItem("selected-provider", providerId);
      setModelForProvider(providerId, modelValue);
      setOpen(false);
      setTimeout(() => textareaRef?.current?.focus(), 100);
    },
    [setProvider, setModelForProvider, textareaRef],
  );

  // Anchor the menu above the trigger button, bounded by the space available so
  // its top never clips off-screen. Rendered through a portal so no ancestor's
  // overflow can cut it off.
  const computePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceAbove = rect.top - 16;
    setMenuPos({
      bottom: window.innerHeight - rect.top + 8,
      right: Math.max(8, window.innerWidth - rect.right),
      maxHeight: Math.max(160, Math.min(360, spaceAbove)),
    });
  }, []);

  const toggleOpen = useCallback(() => {
    setOpen((value) => {
      const next = !value;
      if (next) {
        computePosition();
        setExpandedProvider(provider);
      }
      return next;
    });
  }, [computePosition, provider]);

  // Close on outside click / Escape; reposition on scroll & resize.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onReflow = () => computePosition();
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, computePosition]);

  // No provider connected: guide the user to settings instead of a dead dropdown.
  if (!hasConnected) {
    return (
      <button
        type="button"
        onClick={onShowSettings}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        title={t("modelDropdown.connectHint", {
          defaultValue: "No provider connected. Click to connect in Settings.",
        })}
      >
        <Plug className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden whitespace-nowrap sm:inline">
          {t("modelDropdown.connectProvider", { defaultValue: "Connect provider" })}
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex max-w-[180px] items-center gap-1.5 rounded-lg border border-border/60 bg-muted/50 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted active:scale-[0.98]"
        title={t("modelDropdown.changeModel", { defaultValue: "Change model" })}
      >
        <SessionProviderLogo provider={provider} className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-medium text-foreground">{currentModelLabel}</span>
        {activeEffort && activeEffort !== "auto" && (
          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
            {effortLabels[activeEffort].label}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: "fixed",
                bottom: menuPos.bottom,
                right: menuPos.right,
                maxHeight: menuPos.maxHeight,
              }}
              className="z-[200] flex w-64 flex-col rounded-xl border border-border/60 bg-popover p-1 text-popover-foreground shadow-lg"
            >
              {/* Scrollable model area: only one provider expanded at a time,
                  the rest collapse to single rows. */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {orderedGroups.map((group) =>
                  group.id === expandedProvider ? (
                    <div key={group.id}>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <SessionProviderLogo
                          provider={group.id}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        {group.name}
                      </div>
                      {group.models.length === 0 && providerModelsLoading ? (
                        <div className="px-3 py-1.5 text-xs text-muted-foreground">
                          {t("providerSelection.loadingModels", {
                            defaultValue: "Loading models…",
                          })}
                        </div>
                      ) : null}
                      {group.models.map((model) => {
                        const isSelected =
                          provider === group.id && currentModel === model.value;
                        return (
                          <button
                            key={`${group.id}-${model.value}`}
                            type="button"
                            role="menuitem"
                            onClick={() => handleModelSelect(group.id, model.value)}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                              isSelected ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {model.label}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setExpandedProvider(group.id)}
                      className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <SessionProviderLogo
                        provider={group.id}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {getProviderDisplayName(group.id)}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  ),
                )}
              </div>

              {/* One effort control, pinned below the list, always bound to the
                  provider currently in use. */}
              {activeEffortLevels && (
                <div className="mt-1 shrink-0 border-t border-border/40 px-2 pb-1.5 pt-1.5">
                  <div className="px-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {t("effort.title", { defaultValue: "Thinking depth" })}
                  </div>
                  <div className="mt-1.5 flex rounded-lg border border-border/50 bg-muted/30 p-0.5">
                    {activeEffortLevels.map((level) => {
                      const isActive = level === (activeEffort ?? "auto");
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleEffortSelect(provider, level)}
                          className={`flex-1 rounded-md px-0.5 py-1 text-center text-[10px] transition-colors ${
                            isActive
                              ? "bg-background font-semibold text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {effortLabels[level].short}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 min-h-[15px] px-0.5 text-[11px] leading-snug text-muted-foreground/80">
                    {effortLabels[activeEffort ?? "auto"].description}
                  </p>
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
