"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/lib/actions/chat";
import { saveInsight } from "@/lib/actions/saved";

type Citation = { documentId: string; documentTitle: string; pageNumber: number };
type Message = { id: string; role: "user" | "assistant"; content: string; citations: Citation[] };

export function ChatThread({ conversationId, initialMessages }: { conversationId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const save = (message: Message) => {
    setSavedIds((prev) => new Set(prev).add(message.id));
    startTransition(async () => {
      await saveInsight("ai_response", message.content, conversationId);
    });
  };

  const send = () => {
    const question = input.trim();
    if (!question) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: question, citations: [] }]);

    startTransition(async () => {
      try {
        const result = await sendMessage(conversationId, question);
        setMessages((prev) => [
          ...prev,
          { id: result.messageId, role: "assistant", content: result.answer, citations: result.citations },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="mt-6 flex flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto">
        {messages.length === 0 && (
          <p className="font-sans text-sm text-ink-faint dark:text-paper/40">
            Ask anything about the selected papers — comparisons, methodology, results, whatever you need.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-2xl rounded border border-hairline bg-paper-raised px-4 py-2.5 font-sans text-sm text-ink dark:border-hairline-dark dark:bg-paper-dark-raised dark:text-paper"
                  : "max-w-2xl"
              }
            >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink dark:text-paper/90">
                  {m.content}
                </p>
              ) : (
                <ReactMarkdown
                    components={{
                      p: (props) => <p className="mb-3 font-sans text-sm leading-relaxed text-ink dark:text-paper/90" {...props} />,
                      h1: (props) => <h3 className="mb-2 mt-4 font-display text-base font-medium" {...props} />,
                      h2: (props) => <h3 className="mb-2 mt-4 font-display text-base font-medium" {...props} />,
                      h3: (props) => <h4 className="mb-2 mt-3 font-display text-sm font-medium" {...props} />,
                      strong: (props) => <strong className="font-semibold text-ink dark:text-paper" {...props} />,
                      em: (props) => <em className="italic" {...props} />,
                      ul: (props) => <ul className="mb-3 ml-4 list-disc space-y-1 font-sans text-sm text-ink dark:text-paper/90" {...props} />,
                      ol: (props) => <ol className="mb-3 ml-4 list-decimal space-y-1 font-sans text-sm text-ink dark:text-paper/90" {...props} />,
                      li: (props) => <li className="leading-relaxed" {...props} />,
                      hr: () => <hr className="my-4 border-hairline dark:border-hairline-dark" />,
                      code: (props) => (
                        <code className="rounded-sm bg-ink/5 px-1 py-0.5 font-mono text-xs dark:bg-paper/10" {...props} />
                      ),
                    }}
                >
                  {m.content}
                </ReactMarkdown>
              )}
              {m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.citations.map((c) => (
                    <Link
                      key={`${c.documentId}-${c.pageNumber}`}
                      href={`/document/${c.documentId}?page=${c.pageNumber}`}
                      className="rounded-sm border border-teal/30 bg-teal/5 px-1.5 py-0.5 font-mono text-[11px] text-teal hover:bg-teal/10 dark:text-teal-muted"
                      title={c.documentTitle}
                    >
                      {c.documentTitle.length > 24 ? c.documentTitle.slice(0, 24) + "…" : c.documentTitle}, p.{c.pageNumber}
                    </Link>
                  ))}
                </div>
              )}
              {m.role === "assistant" && !m.id.startsWith("local-") && (
                <button
                  onClick={() => save(m)}
                  disabled={savedIds.has(m.id)}
                  className="mt-2 font-mono text-[11px] text-brass hover:underline disabled:no-underline disabled:opacity-60"
                >
                  {savedIds.has(m.id) ? "Saved" : "Save this answer"}
                </button>
              )}
            </div>
          </div>
        ))}
        {isPending && <p className="font-mono text-xs text-ink-faint dark:text-paper/40">Thinking…</p>}
        {error && <p className="font-sans text-xs text-red-700 dark:text-red-400">{error}</p>}
      </div>

      <div className="sticky bottom-0 mt-6 flex gap-2 border-t border-hairline bg-paper pt-4 dark:border-hairline-dark dark:bg-paper-dark">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask about these papers…"
          disabled={isPending}
        />
        <Button onClick={send} disabled={isPending || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
