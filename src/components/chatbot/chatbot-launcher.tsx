"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BotAvatar } from "@/components/chatbot/bot-avatar";
import { useRoleStore } from "@/stores/role-store";
import { getCurrentMockUser } from "@/lib/mock-api";
import { answerSiteQuestion } from "@/lib/chatbot/site-assistant";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

const SUGGESTED_QUESTIONS = [
  "How many open requests?",
  "What's our revenue?",
  "How do I raise a request?",
  "What's our SLA compliance?",
];

const GREETING_MESSAGE_ID = "greeting";

function greetingText(): string {
  return (
    "Hi, I'm the Site Assistant. Ask me about your requests, revenue, dealers, equipment, " +
    "or how things work - or try one of these:"
  );
}

/** Three animated "thinking" dots shown while `answerSiteQuestion` resolves. Falls back to a static (non-animated) hint under reduced motion. */
function TypingIndicator() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        Thinking…
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2.5" aria-label="Site Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-line rounded-lg rounded-br-sm bg-accent px-3 py-2 text-sm text-accent-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <BotAvatar size={24} className="mt-0.5 shrink-0" />
      <div className="max-w-[85%] whitespace-pre-line rounded-lg rounded-bl-sm bg-muted px-3 py-2 text-sm text-foreground">
        {message.text}
      </div>
    </div>
  );
}

function ChatPanelBody({
  user,
  isUserLoading,
}: {
  user: User | undefined;
  isUserLoading: boolean;
}) {
  const role = useRoleStore((state) => state.role);
  const prefersReducedMotion = useReducedMotion();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const nextId = React.useRef(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: GREETING_MESSAGE_ID, role: "bot", text: greetingText() }]);
    }
    // Seed once, on first mount of the (already-open) panel - not on every
    // messages change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [messages, isPending, prefersReducedMotion]);

  const sendMessage = React.useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed || !user || isPending) return;

      nextId.current += 1;
      const userMessage: ChatMessage = { id: `u-${nextId.current}`, role: "user", text: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsPending(true);

      const answer = await answerSiteQuestion(trimmed, { role, user });

      nextId.current += 1;
      setMessages((prev) => [...prev, { id: `b-${nextId.current}`, role: "bot", text: answer.text }]);
      setIsPending(false);
    },
    [role, user, isPending]
  );

  const showSuggestions = messages.length === 1 && messages[0]?.id === GREETING_MESSAGE_ID;
  const inputDisabled = !user || isPending;

  return (
    <>
      <SheetHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <BotAvatar size={36} />
          <div className="flex flex-col gap-0.5">
            <SheetTitle>Site Assistant</SheetTitle>
            <SheetDescription>
              Ask about your requests, revenue, dealers, or how things work - no AI API key needed,
              answers come straight from your live data.
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div
        ref={scrollRef}
        aria-live="polite"
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pl-8">
            {SUGGESTED_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void sendMessage(question)}
                disabled={inputDisabled}
                className={cn(
                  "rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground",
                  "transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                )}
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {isPending && <TypingIndicator />}
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t border-border px-6 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input);
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isUserLoading ? "Loading your account…" : "Ask a question…"}
          disabled={inputDisabled}
          aria-label="Message the Site Assistant"
        />
        <Button type="submit" size="icon" disabled={inputDisabled || !input.trim()} aria-label="Send message">
          <PaperPlaneTilt className="size-4" aria-hidden="true" />
        </Button>
      </form>
      {!user && !isUserLoading && (
        <p className="shrink-0 px-6 pb-4 text-xs text-muted-foreground">
          Couldn&apos;t load your account - try reopening the assistant in a moment.
        </p>
      )}
    </>
  );
}

/**
 * Floating "Site Assistant" launcher, mounted once in AppShell so it's
 * visible on every authenticated page. Follows sheet.tsx's documented
 * "side=right on desktop, side=bottom on mobile" pairing: two `SheetContent`
 * instances share one controlled `open` state, toggled by media query via
 * Tailwind's `sm:` breakpoint rather than duplicated open state.
 */
export function ChatbotLauncher() {
  const [open, setOpen] = React.useState(false);
  const role = useRoleStore((state) => state.role);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <span className="absolute right-0.5 top-0.5 flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-success ring-2 ring-background" />
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open site assistant"
          aria-expanded={open}
          className={cn(
            "flex size-14 items-center justify-center rounded-full bg-surface-raised shadow-lg ring-1 ring-border",
            "transition-transform hover:scale-105 hover:shadow-xl",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <BotAvatar size={40} />
        </button>
      </div>

      {/* One Sheet root, two SheetContent variants sharing its open state -
          the "side=right on desktop, side=bottom on mobile" pairing
          documented in src/components/ui/sheet.tsx. */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex h-[85vh] w-full flex-col gap-0 p-0 sm:hidden">
          <ChatPanelBody user={user} isUserLoading={isUserLoading} />
        </SheetContent>
        <SheetContent side="right" className="hidden h-full w-full max-w-sm flex-col gap-0 p-0 sm:flex">
          <ChatPanelBody user={user} isUserLoading={isUserLoading} />
        </SheetContent>
      </Sheet>
    </>
  );
}
