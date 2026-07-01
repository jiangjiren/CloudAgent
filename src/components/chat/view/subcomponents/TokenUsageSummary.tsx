import { ActivityIcon } from 'lucide-react';

import { cn } from '../../../../lib/utils';

type TokenUsageSummaryProps = {
  usage: Record<string, unknown> | null;
  onClick?: () => void;
  variant?: 'toolbar' | 'menuitem';
  label?: string;
  unitLabel?: string;
};

const formatTokenCount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }

  if (value >= 10_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString();
};

const readUsageNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function TokenUsageSummary({
  usage,
  onClick,
  variant = 'toolbar',
  label = 'Token usage',
  unitLabel = 'tokens used',
}: TokenUsageSummaryProps) {
  const breakdown =
    usage?.breakdown && typeof usage.breakdown === 'object'
      ? usage.breakdown as Record<string, unknown>
      : null;
  const inputTokens = readUsageNumber(usage?.inputTokens ?? breakdown?.input);
  const outputTokens = readUsageNumber(usage?.outputTokens ?? breakdown?.output);
  const usedTokens = readUsageNumber(usage?.used) || inputTokens + outputTokens;
  const fullUsageLabel = `${usedTokens.toLocaleString()} ${unitLabel}`;

  return (
    <button
      type="button"
      onClick={onClick}
      role={variant === 'menuitem' ? 'menuitem' : undefined}
      className={cn(
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        variant === 'menuitem'
          ? 'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-foreground hover:bg-accent'
          : 'inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-2 text-xs text-muted-foreground shadow-sm hover:border-primary/25 hover:text-foreground sm:gap-2 sm:px-2.5',
      )}
      title={fullUsageLabel}
      aria-label={label}
    >
      <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/10 text-primary">
        <ActivityIcon className="h-3.5 w-3.5" />
      </span>
      {variant === 'menuitem' ? (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium leading-4 text-foreground">{label}</span>
            <span className="truncate text-[11px] leading-4 text-muted-foreground">{fullUsageLabel}</span>
          </span>
          <span className="font-medium text-foreground">{formatTokenCount(usedTokens)}</span>
        </>
      ) : (
        <>
          <span className="font-medium text-foreground">{formatTokenCount(usedTokens)}</span>
          <span className="hidden text-muted-foreground/70 sm:inline">tokens</span>
        </>
      )}
    </button>
  );
}
