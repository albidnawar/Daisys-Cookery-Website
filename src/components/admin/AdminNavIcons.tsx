import type { SVGProps } from "react";

// One consistent line-icon set for the admin sidebar (24x24 grid, 1.75
// stroke, rounded caps/joins) so nav items read as one system instead of
// mixed emoji from different platforms/fonts.
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function NewOrderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </Icon>
  );
}

export function OverviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 21V10M10 21V4M16 21v-7" />
      <path d="M3 21h18" />
    </Icon>
  );
}

export function BoardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="9.5" y="4" width="5" height="10" rx="1" />
      <rect x="16" y="4" width="5" height="13" rx="1" />
    </Icon>
  );
}

export function ChefHatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 10a4 4 0 0 1 1.2-7.7A4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 4.8-1.7A4 4 0 0 1 18 10v3H6v-3Z" />
      <path d="M6 13h12v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6Z" />
    </Icon>
  );
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </Icon>
  );
}

export function CardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 9.5h19" />
      <path d="M6 15h4" />
    </Icon>
  );
}

// Customers and Settings use the provided icon art (public/icons/*.png)
// instead of a hand-drawn path — rendered as a CSS mask so the solid
// glyph still inherits currentColor (and so still picks up the active/
// hover orange the rest of the sidebar's currentColor SVGs get) rather
// than freezing as a flat black raster image.
function MaskIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export function UsersIcon({ className }: SVGProps<SVGSVGElement>) {
  return <MaskIcon src="/icons/group.png" className={className} />;
}

export function GalleryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5-9 9" />
    </Icon>
  );
}

export function FlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-3 4 3 4H5" />
    </Icon>
  );
}

export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-.6 1.4l-9 9a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1 0-2.8l9-9A2 2 0 0 1 12 2Z" />
      <circle cx="16.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function MegaphoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l7 4V5L6 9H5a2 2 0 0 0-2 2Z" />
      <path d="M14 8.5a4 4 0 0 1 0 7" />
    </Icon>
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6Z" />
    </Icon>
  );
}

export function TruckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 7h11v9H3Z" />
      <path d="M14 10h4l3 3v3h-7Z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </Icon>
  );
}

export function GearIcon({ className }: SVGProps<SVGSVGElement>) {
  return <MaskIcon src="/icons/settings.png" className={className} />;
}

export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" />
    </Icon>
  );
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </Icon>
  );
}
