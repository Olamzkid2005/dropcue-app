import Image from "next/image";

export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Dropcue"
      width={1024}
      height={1024}
      priority
      className={className}
    />
  );
}
