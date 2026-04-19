import { Button } from "./ui/button";
import { getTelegramGroupUrl, getWhatsappGroupUrl } from "../lib/chat-group-urls";
import { TelegramMark, WhatsappMark } from "./icons/chat-group-icons";

const headerChatBtnClass =
  "h-9 rounded-lg border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 shadow-none hover:bg-gray-50";

export function CommunityChatLinkButtons() {
  const whatsappUrl = getWhatsappGroupUrl();
  const telegramUrl = getTelegramGroupUrl();

  return (
    <>
      <Button variant="outline" size="sm" className={headerChatBtnClass} asChild>
        <a
          href={whatsappUrl ?? "#"}
          onClick={(e) => {
            if (!whatsappUrl) e.preventDefault();
          }}
          {...(whatsappUrl
            ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
            : { title: "Set VITE_WHATSAPP_GROUP_URL in .env.local (restart dev server)." })}
        >
          <WhatsappMark className="h-4 w-4 shrink-0 text-gray-900" />
          WhatsApp Group
        </a>
      </Button>
      <Button variant="outline" size="sm" className={headerChatBtnClass} asChild>
        <a
          href={telegramUrl ?? "#"}
          onClick={(e) => {
            if (!telegramUrl) e.preventDefault();
          }}
          {...(telegramUrl
            ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
            : { title: "Set VITE_TELEGRAM_GROUP_URL in .env.local (restart dev server)." })}
        >
          <TelegramMark className="h-4 w-4 shrink-0 text-gray-900" />
          Telegram Group
        </a>
      </Button>
    </>
  );
}
