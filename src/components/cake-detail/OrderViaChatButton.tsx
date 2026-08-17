import { buildChatLink, type ChatContext } from "@/lib/chat/buildChatLink";

export function OrderViaChatButton({
  context,
  className = "",
}: {
  context?: ChatContext;
  className?: string;
}) {
  return (
    <a
      href={buildChatLink("whatsapp", context)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#25D366] px-5 py-2.5 font-body text-sm font-bold text-[#128C4A] transition-colors hover:bg-[#25D366]/10 ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.03c-.24.68-1.4 1.3-1.94 1.36-.5.05-1.08.24-3.6-.76-3.05-1.2-5-4.32-5.15-4.52-.15-.2-1.23-1.64-1.23-3.13s.79-2.22 1.07-2.52c.28-.3.6-.37.8-.37.2 0 .4 0 .58.01.19.01.44-.07.68.53.24.6.83 2.08.9 2.23.07.15.12.33.02.53-.1.2-.15.33-.3.5-.15.18-.31.4-.44.53-.15.15-.3.31-.13.6.17.3.76 1.26 1.64 2.04 1.12 1 2.06 1.31 2.36 1.46.3.15.48.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.68-.15.28.1 1.75.83 2.05.98.3.15.5.23.57.35.08.13.08.73-.16 1.41Z" />
      </svg>
      Order via chat
    </a>
  );
}
