import { Hint } from "@/components/shared/hint";

interface ConnectionIndicatorProps {
  state: 'connected' | 'reconnecting' | 'disconnected';
  className?: string;
}

/**
 * Connection State Visual Indicator
 * 
 * Shows connection quality with colored dots:
 * - Green: Connected and stable
 * - Yellow (pulsing): Reconnecting
 * - Red: Disconnected
 */
export function ConnectionIndicator({ state, className = "" }: ConnectionIndicatorProps) {
  const getIndicatorStyles = () => {
    switch (state) {
      case 'connected':
        return {
          dot: "bg-green-500",
          label: "Connected",
          description: "Stream connection is stable",
        };
      case 'reconnecting':
        return {
          dot: "bg-yellow-500 animate-pulse",
          label: "Reconnecting",
          description: "Attempting to reconnect to stream",
        };
      case 'disconnected':
        return {
          dot: "bg-red-500",
          label: "Disconnected",
          description: "Stream connection lost",
        };
    }
  };

  const { dot, label, description } = getIndicatorStyles();

  return (
    <Hint label={description} asChild>
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <div className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
    </Hint>
  );
}

/**
 * Minimal Connection Dot (just the indicator, no label)
 */
export function ConnectionDot({ state }: { state: 'connected' | 'reconnecting' | 'disconnected' }) {
  const getDotStyles = () => {
    switch (state) {
      case 'connected':
        return "bg-green-500";
      case 'reconnecting':
        return "bg-yellow-500 animate-pulse";
      case 'disconnected':
        return "bg-red-500";
    }
  };

  return (
    <div className="relative flex h-2 w-2">
      {state === 'reconnecting' && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${getDotStyles()}`}></span>
    </div>
  );
}
