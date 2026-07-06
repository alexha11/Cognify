import Image from "next/image";
import { cn } from "@/lib/utils";

interface CognifyLogoProps {
  size?: number;
  className?: string;
}

export function CognifyLogo({ size = 50, className }: CognifyLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Cognify"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  );
}
