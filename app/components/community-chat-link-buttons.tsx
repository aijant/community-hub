import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { TelegramMark, WhatsappMark } from "./icons/chat-group-icons";
import { useAuthRole } from "../hooks/use-auth-role";

const WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/K21RqZeMe9v3UtHN3njVNZ?mode=gi_t";

/** Public invite or t.me link, e.g. https://t.me/yourgroup */
const TELEGRAM_GROUP_URL = "";

const headerChatBtnClass =
  "h-9 min-w-0 flex-1 gap-1.5 rounded-lg border-gray-200 bg-white px-2 text-xs font-bold text-gray-900 shadow-none hover:bg-gray-50 sm:flex-initial sm:px-4 sm:text-sm";

const linkDisabledClass = "pointer-events-none cursor-not-allowed opacity-50";

export function CommunityChatLinkButtons() {
  const { user, loading, isClient, canPin } = useAuthRole();
  const chatLinksEnabled = Boolean(user && !loading && (isClient || canPin));

  const telegramUrl = TELEGRAM_GROUP_URL.trim() || undefined;
  const telegramOpen = Boolean(chatLinksEnabled && telegramUrl);
  const whatsappOpen = chatLinksEnabled;

  const whatsappTitle = whatsappOpen
    ? "WhatsApp group (opens in a new tab)"
    : "Sign in with a client, manager, or admin account to open this link.";
  const telegramTitle = !chatLinksEnabled
    ? "Sign in with a client, manager, or admin account to open this link."
    : telegramUrl
      ? "Telegram group (opens in a new tab)"
      : "Set TELEGRAM_GROUP_URL in community-chat-link-buttons.tsx.";

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
      <Button variant="outline" size="sm" className={headerChatBtnClass} asChild>
        <a
          href={whatsappOpen ? WHATSAPP_GROUP_URL : "#"}
          target={whatsappOpen ? "_blank" : undefined}
          rel={whatsappOpen ? "noopener noreferrer" : undefined}
          aria-disabled={!whatsappOpen}
          tabIndex={whatsappOpen ? undefined : -1}
          aria-label={whatsappOpen ? "Open WhatsApp group in a new tab" : whatsappTitle}
          title={whatsappTitle}
          className={cn(!whatsappOpen && linkDisabledClass)}
          onClick={(e) => {
            if (!whatsappOpen) e.preventDefault();
          }}
        >
          <WhatsappMark className="h-4 w-4 shrink-0 text-gray-900" aria-hidden />
          <span aria-hidden="true" className="sm:hidden">
            WhatsApp
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            WhatsApp Group
          </span>
        </a>
      </Button>
      <Button variant="outline" size="sm" className={headerChatBtnClass} asChild>
        <a
          href={telegramOpen ? telegramUrl : "#"}
          target={telegramOpen ? "_blank" : undefined}
          rel={telegramOpen ? "noopener noreferrer" : undefined}
          aria-disabled={!telegramOpen}
          tabIndex={telegramOpen ? undefined : -1}
          aria-label={telegramOpen ? "Open Telegram group in a new tab" : telegramTitle}
          title={telegramTitle}
          className={cn(!telegramOpen && linkDisabledClass)}
          onClick={(e) => {
            if (!telegramOpen) e.preventDefault();
          }}
        >
          <TelegramMark className="h-4 w-4 shrink-0 text-gray-900" aria-hidden />
          <span aria-hidden="true" className="sm:hidden">
            Telegram
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            Telegram Group
          </span>
        </a>
      </Button>
    </div>
  );
}
