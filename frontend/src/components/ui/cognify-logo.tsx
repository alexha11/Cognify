import Image from "next/image";
import { cn } from "@/lib/utils";

interface CognifyLogoProps {
  size?: number;
  className?: string;
}

/**
 * Both theme variants are in the markup and CSS hides one (display: none).
 * They are deliberately not `priority`: a priority image is preloaded even
 * while hidden, so every page fetched both. A lazy image that is not
 * displayed is never requested, so each visitor downloads only the one they
 * see.
 */
export function CognifyLogo({ size = 50, className }: CognifyLogoProps) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Cognify"
        width={size}
        height={size}
        className="object-contain cognify-logo-light w-full h-full"
      />
      <Image
        src="/logo-dark.png"
        alt="Cognify"
        width={size}
        height={size}
        className="object-contain cognify-logo-dark w-full h-full"
      />
    </div>
  );
}
