"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ChatMessage from "./ChatMessage";
import SystemGreeting from "./SystemGreeting";
import TypingIndicator from "./TypingIndicator";
import LanguageSwitcher from "./LanguageSwitcher";
import VoiceInputButton from "./VoiceInputButton";
import { useLanguage } from "@/contexts/LanguageContext";

interface Message {
  id: string;
  role: "patient" | "ai" | "system";
  content: string;
}

interface ChatInterfaceProps {
  visitId: string;
  sessionToken: string;
  patientName: string;
  locationName: string;
  logoUrl?: string | null;
  onConversationComplete: () => void;
  onError: (error: string) => void;
  onLanguageChange?: (lang: string) => void;
  heightClass?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const MAX_CHARS = 5000;

export default function ChatInterface({
  visitId,
  sessionToken,
  patientName,
  locationName,
  logoUrl,
  onConversationComplete,
  onError,
  onLanguageChange,
  heightClass,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [language, setLanguage] = useState("en");
  const [languageLoading, setLanguageLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [translationUnavailable, setTranslationUnavailable] = useState(false);
  const [offline, setOffline] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const offlineSinceRef = useRef<number | null>(null);
  const { t } = useLanguage();

  // Connection loss detection
  useEffect(() => {
    function handleOffline() {
      setOffline(true);
      offlineSinceRef.current = Date.now();
    }
    function handleOnline() {
      setOffline(false);
      offlineSinceRef.current = null;
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  // Initialize conversation on mount
  useEffect(() => {
    if (initialized) return;

    (async () => {
      const supabase = createClient();

      // Call start_ai_conversation (idempotent)
      const { data: startData, error: startError } = await supabase.rpc(
        "start_ai_conversation",
        { p_visit_id: visitId, p_session_token: sessionToken }
      );

      if (startError || !startData?.success) {
        const errMsg = startData?.error || startError?.message || "Failed to start";
        if (errMsg === "no_credits") {
          onError("no_credits");
          return;
        }
        if (errMsg === "trial_screening_limit") {
          onError("no_credits");
          return;
        }
        if (errMsg === "subscription_inactive") {
          onError("subscription_inactive");
          return;
        }
        onError(errMsg);
        return;
      }

      setLanguage(startData.language || "en");
      if (startData.is_follow_up) setIsFollowUp(true);

      // Load existing messages via get_conversation (patient-facing)
      const { data: convData } = await supabase.rpc("get_conversation", {
        p_visit_id: visitId,
        p_session_token: sessionToken,
      });

      if (convData?.success && convData.messages) {
        const loadedMessages: Message[] = convData.messages.map(
          (m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role as Message["role"],
            content: m.role === "ai"
              ? m.content.replace("[CONVERSATION_COMPLETE]", "").trim()
              : m.content,
          })
        );
        setMessages(loadedMessages);
      }

      setInitialized(true);
    })();
  }, [visitId, sessionToken, initialized, onError]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isAiTyping || rateLimited) return;

    setInput("");
    setFailureCount(0);

    // Optimistic add
    const tempId = crypto.randomUUID();
    const patientMsg: Message = { id: tempId, role: "patient", content: text };
    setMessages((prev) => [...prev, patientMsg]);
    setIsAiTyping(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          visit_id: visitId,
          session_token: sessionToken,
          patient_message: text,
          language,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));

        if (errBody.error === "no_credits") {
          setIsAiTyping(false);
          onError("no_credits");
          return;
        }
        if (errBody.error === "message_limit_reached") {
          setIsAiTyping(false);
          setRateLimited(true);
          return;
        }

        throw new Error(errBody.error || "Request failed");
      }

      // Parse SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let aiMessageId = crypto.randomUUID();
      let aiText = "";
      let buffer = "";
      let conversationComplete = false;

      // Add empty AI message to progressively fill
      setMessages((prev) => [...prev, { id: aiMessageId, role: "ai", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          try {
            const event = JSON.parse(data);

            if (event.type === "delta" && event.text) {
              aiText += event.text;
              // Strip [CONVERSATION_COMPLETE] from rendered text
              const displayText = aiText.replace("[CONVERSATION_COMPLETE]", "").trim();
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: displayText } : m
                )
              );
            }

            if (event.type === "done") {
              // Finalize
              const finalText = aiText.replace("[CONVERSATION_COMPLETE]", "").trim();
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: finalText } : m
                )
              );
            }

            if (event.type === "translation_unavailable") {
              setTranslationUnavailable(true);
            }

            if (event.type === "conversation_complete") {
              conversationComplete = true;
            }

            if (event.type === "error") {
              throw new Error(event.message || "Stream error");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue; // Skip unparseable
            throw e;
          }
        }
      }

      setIsAiTyping(false);

      if (conversationComplete) {
        onConversationComplete();
      }
    } catch {
      setIsAiTyping(false);
      let shouldMoveToQueue = false;
      setFailureCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 3) shouldMoveToQueue = true;
        return newCount;
      });

      // Remove empty AI message placeholder
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.role === "ai" && !last.content
          ? prev.slice(0, -1)
          : prev;
      });

      if (shouldMoveToQueue) {
        // Move patient to doctor queue as fallback
        try {
          const supabase = createClient();
          await supabase.rpc("move_to_queue_on_error", {
            p_visit_id: visitId,
            p_session_token: sessionToken,
          });
        } catch {
          // RPC failed but we still need to show the error screen
        }
        onError("ai_error");
      }
    }
  }, [input, isAiTyping, rateLimited, visitId, sessionToken, language, onConversationComplete, onError]);

  async function handleLanguageChange(lang: string) {
    setLanguageLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("give_patient_consent", {
      p_session_token: sessionToken,
      p_language: lang,
    });
    setLanguageLoading(false);

    if (data?.success) {
      setLanguage(lang);
      onLanguageChange?.(lang);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Find the greeting message (first system message)
  const greetingMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  if (!initialized) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-hilt-blue" />
        <p className="text-sm text-slate">{t("chat.starting")}</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md flex flex-col ${heightClass ?? "h-[calc(100dvh-4rem)]"}`}>
      {/* Header with language switcher */}
      <div className="flex items-center justify-between py-2 px-1 shrink-0">
        <div className="flex items-center gap-2">
          {logoUrl && (
            <img src={logoUrl} alt="" className="h-7 w-7 rounded-md object-cover" />
          )}
          <h2 className="text-sm font-semibold text-ink">{locationName}</h2>
        </div>
        <LanguageSwitcher
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
          loading={languageLoading}
        />
      </div>

      {/* Connection loss banner */}
      {offline && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mx-1 mb-2 shrink-0">
          <p className="text-xs text-amber-700 font-medium">
            {offlineSinceRef.current && Date.now() - offlineSinceRef.current > 120000
              ? "Please check your internet connection."
              : "Connection lost. Reconnecting..."}
          </p>
        </div>
      )}

      {/* Follow-up indicator */}
      {isFollowUp && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 mx-1 mb-2 shrink-0">
          <p className="text-xs font-medium text-blue-800">{t("followUp.label")}</p>
          <p className="text-xs text-blue-600">{t("followUp.subtitle")}</p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 pb-2">
        {greetingMsg && (
          <SystemGreeting patientName={patientName} clinicName={locationName} />
        )}

        {chatMessages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
          />
        ))}

        {isAiTyping && !chatMessages.some((m) => m.role === "ai" && !m.content) && (
          <TypingIndicator />
        )}

        {translationUnavailable && (
          <div className="flex justify-center my-3">
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              {t("chat.translationUnavailable")}
            </p>
          </div>
        )}

        {rateLimited && (
          <div className="flex justify-center my-3">
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              {t("chat.messageLimit")}
            </p>
          </div>
        )}

        {failureCount >= 3 && (
          <div className="flex justify-center my-3">
            <div className="text-center">
              <p className="text-xs text-red-600 mb-2">
                {t("chat.connectionError")}
              </p>
              <button
                onClick={() => setFailureCount(0)}
                className="text-xs text-hilt-blue font-medium hover:underline"
              >
                {t("chat.retry")}
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-1 py-3">
        {failureCount > 0 && failureCount < 3 && (
          <p className="text-xs text-slate mb-2 text-center">
            {t("chat.retrying")}
          </p>
        )}
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")}
              rows={1}
              disabled={isAiTyping || rateLimited}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-base text-ink placeholder:text-ash focus:border-hilt-blue focus:bg-white focus:outline-none disabled:opacity-50"
            />
            {input.length > MAX_CHARS * 0.9 && (
              <span className="absolute right-2 bottom-1 text-xs text-ash">
                {input.length}/{MAX_CHARS}
              </span>
            )}
          </div>
          <VoiceInputButton
            onTranscription={(text) => setInput((prev) => prev ? prev + " " + text : text)}
            language={language}
            sessionToken={sessionToken}
            visitId={visitId}
            disabled={isAiTyping || rateLimited}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isAiTyping || rateLimited}
            className="shrink-0 rounded-xl bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-hilt-blue transition-colors"
          >
            {t("chat.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
