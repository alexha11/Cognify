import Image from "next/image";
import { cn } from "@/lib/utils";

interface CognifyLogoProps {
  size?: number;
  className?: string;
}

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
        priority
      />
      <Image
        src="/logo-dark.png"
        alt="Cognify"
        width={size}
        height={size}
        className="object-contain cognify-logo-dark w-full h-full"
        priority
      />
    </div>
  );
}
