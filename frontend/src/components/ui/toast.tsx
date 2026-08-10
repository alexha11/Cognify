"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastType }>;
      if (customEvent.detail) {
        showToast(customEvent.detail.message, customEvent.detail.type);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("cognify-toast", handleToastEvent);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cognify-toast", handleToastEvent);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    // Full-width on phones so long messages don't wrap into a narrow column.
    <div
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-full sm:max-w-sm"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  // Toasts sit on an opaque raised surface rather than a tinted translucent
  // one, so the message stays legible over whatever is behind it. The status
  // colour is carried by the icon and the left border.
  const styles = {
    success: { accent: "border-l-success", icon: CheckCircle, tone: "text-success" },
    error: { accent: "border-l-error", icon: AlertCircle, tone: "text-error" },
    warning: { accent: "border-l-warning", icon: AlertTriangle, tone: "text-warning" },
    info: { accent: "border-l-info", icon: Info, tone: "text-info" },
  } as const;

  const style = styles[toast.type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-md border border-l-4 border-border bg-surface-raised p-4",
        "shadow-overlay animate-in slide-in-from-right-8 fade-in duration-200",
        style.accent,
      )}
      role={toast.type === "error" ? "alert" : "status"}
    >
      <Icon className={cn("mt-px h-4 w-4 shrink-0", style.tone)} aria-hidden="true" />
      <p className="flex-1 text-sm leading-relaxed text-foreground">
        {toast.message}
      </p>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1.5 -mt-1.5 shrink-0 text-muted-foreground"
      >
        <X />
      </Button>
    </div>
  );
}

export const toast = {
  success: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cognify-toast", {
          detail: { message, type: "success" },
        })
      );
    }
  },
  error: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cognify-toast", {
          detail: { message, type: "error" },
        })
      );
    }
  },
  warning: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cognify-toast", {
          detail: { message, type: "warning" },
        })
      );
    }
  },
  info: (message: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cognify-toast", {
          detail: { message, type: "info" },
        })
      );
    }
  },
};

