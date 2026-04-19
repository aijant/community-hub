import { Button } from "./ui/button";
import { getTelegramGroupUrl, getWhatsappGroupUrl } from "../lib/chat-group-urls";
import { TelegramMark, WhatsappMark } from "./icons/chat-group-icons";

const headerChatBtnClass =
  "h-9 min-w-0 flex-1 gap-1.5 rounded-lg border-gray-200 bg-white px-2 text-xs font-bold text-gray-900 shadow-none hover:bg-gray-50 sm:flex-initial sm:px-4 sm:text-sm";

export function CommunityChatLinkButtons() {
  const whatsappUrl = getWhatsappGroupUrl();
  const telegramUrl = getTelegramGroupUrl();

  const whatsappTitle = whatsappUrl
    ? "WhatsApp group (opens in a new tab)"
    : "Set VITE_WHATSAPP_GROUP_URL in .env.local (restart dev server).";
  const telegramTitle = telegramUrl
    ? "Telegram group (opens in a new tab)"
    : "Set VITE_TELEGRAM_GROUP_URL in .env.local (restart dev server).";

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
      <Button variant="outline" size="sm" className={headerChatBtnClass} asChild>
        <a
          href={whatsappUrl ?? "#"}
          aria-label={whatsappUrl ? "Open WhatsApp group in a new tab" : whatsappTitle}
          title={whatsappTitle}
          onClick={(e) => {
            if (!whatsappUrl) e.preventDefault();
          }}
          {...(whatsappUrl ? { target: "_blank" as const, rel: "noopener noreferrer" as const } : {})}
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
          href={telegramUrl ?? "#"}
          aria-label={telegramUrl ? "Open Telegram group in a new tab" : telegramTitle}
          title={telegramTitle}
          onClick={(e) => {
            if (!telegramUrl) e.preventDefault();
          }}
          {...(telegramUrl ? { target: "_blank" as const, rel: "noopener noreferrer" as const } : {})}
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
