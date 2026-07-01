import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type AssistantStatus = {
  text?: string;
  tokens?: number;
  can_interrupt?: boolean;
} | null;

type AssistantPendingBubbleProps = {
  status: AssistantStatus;
  isContinuing?: boolean;
};

export default function AssistantPendingBubble({
  status,
  isContinuing = false,
}: AssistantPendingBubbleProps) {
  const { t } = useTranslation('chat');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const fallbackStatus = (() => {
    if (isContinuing) {
      return t('assistantPending.continuing', { defaultValue: 'Continuing' });
    }

    if (elapsedTime >= 10) {
      return t('assistantPending.stillWorking', { defaultValue: 'Still working' });
    }

    if (elapsedTime >= 3) {
      return t('assistantPending.working', { defaultValue: 'Working' });
    }

    return t('assistantPending.thinking', { defaultValue: 'Thinking' });
  })();
  const statusText = (status?.text?.trim() || fallbackStatus).replace(/[.]+$/, '');
  const elapsedLabel = elapsedTime >= 3
    ? t('assistantPending.elapsed', { count: elapsedTime, defaultValue: `${elapsedTime}s` })
    : null;

  return (
    <div className="chat-message assistant px-3 sm:px-0" role="status" aria-live="polite">
      <div className="inline-flex max-w-full items-center gap-2 rounded-2xl rounded-tl-md border border-border/60 bg-muted/35 px-3 py-2 text-sm text-muted-foreground shadow-sm">
        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-foreground/45 animate-pulse" />
        <span className="min-w-0 truncate text-foreground/80">{statusText}</span>
        <span className="flex flex-shrink-0 items-center gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="assistant-pending-dot h-1 w-1 rounded-full bg-muted-foreground/70"
              style={{ animationDelay: `${index * 180}ms` }}
            />
          ))}
        </span>
        {elapsedLabel && (
          <span className="ml-1 hidden flex-shrink-0 border-l border-border/60 pl-2 text-[11px] tabular-nums text-muted-foreground sm:inline">
            {elapsedLabel}
          </span>
        )}
      </div>
    </div>
  );
}
