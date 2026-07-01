import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 40, className = "" }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const base = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary ${className}`;

  if (src) {
    return (
      <div className={base} style={{ width: size, height: size }}>
        <Image
          src={src}
          alt={name ?? "avatar"}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const fontSize = size <= 32 ? "text-xs" : size <= 48 ? "text-sm" : "text-xl";
  return (
    <div className={`${base} ${fontSize}`} style={{ width: size, height: size }}>
      {initials}
    </div>
  );
}
