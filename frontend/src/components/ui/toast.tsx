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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
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

  const styles = {
    success: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15 backdrop-blur-md",
      border: "border-emerald-500/20 dark:border-emerald-500/30",
      text: "text-emerald-800 dark:text-emerald-400",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    error: {
      bg: "bg-destructive/10 backdrop-blur-md",
      border: "border-destructive/20",
      text: "text-destructive",
      icon: <AlertCircle className="w-5 h-5 text-destructive" />,
    },
    warning: {
      bg: "bg-amber-500/10 dark:bg-amber-500/15 backdrop-blur-md",
      border: "border-amber-500/20 dark:border-amber-500/30",
      text: "text-amber-800 dark:text-amber-400",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    },
    info: {
      bg: "bg-zinc-900/90 dark:bg-zinc-900/95 backdrop-blur-md",
      border: "border-zinc-800 dark:border-zinc-700/50",
      text: "text-zinc-100 dark:text-zinc-100",
      icon: <Info className="w-5 h-5 text-zinc-100" />,
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-5 rounded-2xl border shadow-xl animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto",
        style.bg,
        style.border
      )}
      role="alert"
    >
      <div className="shrink-0">{style.icon}</div>
      <p
        className={cn("flex-1 text-xs font-medium tracking-tight", style.text)}
      >
        {toast.message}
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(toast.id)}
        className={cn(style.text, "opacity-30 hover:opacity-100 h-8 w-8")}
      >
        <X className="w-4 h-4" />
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

