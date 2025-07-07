import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotebookStore } from "@/lib/state";
import { useQueryClient } from "@tanstack/react-query";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ChatUI = () => {
  const params = useParams<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // NEW: for skeleton
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");
  const queryClient = useQueryClient();

  const {
    chatMessages,
    selectedSources,
    addUserMessage,
    addAssistantMessage,
    setChatMessages,
    addProcessingNote,
    removeProcessingNote,
  } = useNotebookStore();

  // Fetch chat history on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      setInitialLoading(true); // NEW
      try {
        const res = await fetch(`/api/notebooks/${params.id}/chat`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setChatMessages(
            data.messages.map((msg: any) => ({
              id: msg.id,
              sender: msg.sender === "user" ? "USER" : "ASSISTANT",
              message: msg.message,
              createdAt: msg.createdAt,
            }))
          );
        }
      } catch (e) {
        // ignore
      } finally {
        setInitialLoading(false); // NEW
      }
    };
    fetchChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, setChatMessages]);

  // Scroll to bottom when chatMessages or loading changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, loading]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  // Extracted message sending logic
  const sendMessage = async (message: string) => {
    if (message.trim() && !loading) {
      setInputText("");
      setError(null);
      setLoading(true);

      // Add user message to chat
      addUserMessage(message);

      try {
        const response = await fetch(`/api/notebooks/${params.id}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            selectedSources,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        // Add assistant response to chat
        addAssistantMessage(data.message);
      } catch (err) {
        console.error("Error sending message:", err);
        setError("Failed to send message. Please try again.");
        // Remove the user message if the request failed
        // You might want to implement a more sophisticated error handling here
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(inputText);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputText(textarea.value);

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate new height (line height is approximately 20px, max 5 lines = 100px)
    const newHeight = Math.min(textarea.scrollHeight, 100);
    textarea.style.height = `${newHeight}px`;
  };

  const handleSaveNote = async (note: string) => {
    // Create a temporary processing note
    const processingNoteId = `processing-${Date.now()}`;
    const processingNote = {
      id: processingNoteId,
      title: "Processing...",
      content: note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "PROCESSING",
    };

    // Add the processing note to the store
    addProcessingNote(processingNote);

    try {
      const res = await fetch(`/api/notebooks/${params.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      if (!res.ok) {
        throw new Error("Failed to save note");
      }

      const data = await res.json();
      console.log("Note saved:", data);

      // Invalidate and refetch notes to get the real note from the backend
      await queryClient.invalidateQueries({ queryKey: ["notes", params.id] });
    } catch (err) {
      console.error("Error saving note:", err);
      // Remove the processing note if the API request failed
      removeProcessingNote(processingNoteId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area - Takes remaining space */}
      <div className="flex-1 min-h-0 px-8 pt-8 pb-4">
        <ScrollArea className="h-full w-full">
          <div className="w-full flex flex-col gap-3 rounded-md p-4 chat-scrollbar">
            {initialLoading ? (
              // Skeleton for chat messages
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-start">
                  <Card className="max-w-[75%] bg-muted text-foreground mr-auto rounded-bl-md rounded-tr-md rounded-br-md p-0 shadow-sm border-none">
                    <CardContent className="flex items-center gap-2 p-3">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <div className="flex flex-col gap-2 w-40">
                        <Skeleton className="h-3 w-24 rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              <>
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "USER" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <Card
                      className={`max-w-[75%] flex flex-row items-start gap-2 p-0 shadow-sm border-none ${
                        msg.sender === "USER"
                          ? "bg-primary text-primary-foreground ml-auto rounded-br-md rounded-tl-md rounded-bl-md"
                          : "bg-muted text-foreground mr-auto rounded-bl-md rounded-tr-md rounded-br-md"
                      }`}
                    >
                      <div className="p-3 flex gap-2 items-start w-full">
                        {msg.sender === "ASSISTANT"}
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">
                              {msg.sender === "USER" ? "You" : "Assistant"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <span className="text-sm whitespace-pre-line">
                            {msg.message}
                          </span>
                        </div>
                        {msg.sender === "USER"}
                        {msg.sender === "ASSISTANT" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
                                type="button"
                                onClick={() => handleSaveNote(msg.message)}
                              >
                                <Bookmark className="w-4 h-4 " />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Save on Notes</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </Card>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <Card className="max-w-[75%] bg-muted text-foreground mr-auto rounded-bl-md rounded-tr-md rounded-br-md p-0 shadow-sm border-none">
                      <CardContent className="flex items-center gap-2 p-3">
                        <Skeleton className="w-4 h-4 rounded-full" />
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        <span className="text-sm">Assistant is typing...</span>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>
          {error && (
            <div className="w-full max-w-2xl mt-2 text-destructive text-sm text-center bg-destructive/10 rounded p-2">
              {error}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input and Questions Section - Fixed at bottom */}
      <div className="flex-shrink-0 px-8 pb-6">
        {selectedSources.length === 0 ? (
          <div className="flex items-center justify-center bg-card rounded-lg px-4 py-3 w-full border-none outline-none text-muted-foreground min-h-[56px] text-center">
            Select a source to continue
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex items-end bg-card rounded-lg px-4 py-3 w-full gap-2 border-none outline-none"
          >
            <div className="flex flex-col w-full">
              <Label htmlFor="chat-input" className="sr-only">
                Message
              </Label>
              <textarea
                id="chat-input"
                placeholder="Start typing..."
                className="bg-transparent border-none outline-none text-foreground placeholder-muted-foreground focus:ring-0 focus:outline-none w-full resize-none min-h-[40px]"
                value={inputText}
                onChange={handleTextareaChange}
                style={{ height: "40px" }}
                autoFocus
                disabled={loading || selectedSources.length === 0}
              />
            </div>
            <Button
              className="cursor-pointer bg-primary text-primary-foreground rounded p-2 disabled:opacity-50 border-none outline-none focus:outline-none"
              disabled={
                !inputText.trim() || loading || selectedSources.length === 0
              }
              type="submit"
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        )}

        {/* Suggested Questions */}
        <div className="relative mt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-full"
              onClick={scrollLeft}
              disabled={initialLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div
              className="flex flex-row flex-nowrap gap-2 overflow-x-auto py-1 flex-1"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              ref={scrollContainerRef}
            >
              {initialLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-8 w-40 rounded-lg flex-shrink-0"
                    />
                  ))
                : [
                    <button
                      key="q1"
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm border-none outline-none hover:bg-muted/80 transition-colors whitespace-nowrap flex-shrink-0"
                      type="button"
                      onClick={() =>
                        sendMessage("How is Node.js used for IoT?")
                      }
                      disabled={loading || selectedSources.length === 0}
                    >
                      How is Node.js used for IoT?
                    </button>,
                    <button
                      key="q2"
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm border-none outline-none hover:bg-muted/80 transition-colors whitespace-nowrap flex-shrink-0"
                      type="button"
                      onClick={() =>
                        sendMessage("What are Node.js's disadvantages?")
                      }
                      disabled={loading || selectedSources.length === 0}
                    >
                      What are Node.js's disadvantages?
                    </button>,
                    <button
                      key="q3"
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm border-none outline-none hover:bg-muted/80 transition-colors whitespace-nowrap flex-shrink-0"
                      type="button"
                      onClick={() =>
                        sendMessage("How does Node.js achieve scalability?")
                      }
                      disabled={loading || selectedSources.length === 0}
                    >
                      How does Node.js achieve scalability?
                    </button>,
                    <button
                      key="q4"
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm border-none outline-none hover:bg-muted/80 transition-colors whitespace-nowrap flex-shrink-0"
                      type="button"
                      onClick={() =>
                        sendMessage("How is Node.js used for IoT?")
                      }
                      disabled={loading || selectedSources.length === 0}
                    >
                      How is Node.js used for IoT?
                    </button>,
                    <button
                      key="q5"
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm border-none outline-none hover:bg-muted/80 transition-colors whitespace-nowrap flex-shrink-0"
                      type="button"
                      onClick={() =>
                        sendMessage("What are Node.js's disadvantages?")
                      }
                      disabled={loading || selectedSources.length === 0}
                    >
                      What are Node.js's disadvantages?
                    </button>,
                    <button
                      key="q6"
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm border-none outline-none hover:bg-muted/80 transition-colors whitespace-nowrap flex-shrink-0"
                      type="button"
                      onClick={() =>
                        sendMessage("How does Node.js achieve scalability?")
                      }
                      disabled={loading || selectedSources.length === 0}
                    >
                      How does Node.js achieve scalability?
                    </button>,
                    <button
                      key="q7"
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm border-none outline-none hover:bg-muted/80 transition-colors whitespace-nowrap flex-shrink-0"
                      type="button"
                      onClick={() =>
                        sendMessage("How is Node.js used for IoT?")
                      }
                      disabled={loading || selectedSources.length === 0}
                    >
                      How is Node.js used for IoT?
                    </button>,
                    <button
                      key="q8"
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm border-none outline-none hover:bg-muted/80 transition-colors whitespace-nowrap flex-shrink-0"
                      type="button"
                      onClick={() =>
                        sendMessage("What are Node.js's disadvantages?")
                      }
                      disabled={loading || selectedSources.length === 0}
                    >
                      What are Node.js's disadvantages?
                    </button>,
                    <button
                      key="q9"
                      className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm border-none outline-none hover:bg-muted/80 transition-colors whitespace-nowrap flex-shrink-0"
                      type="button"
                      onClick={() =>
                        sendMessage("How does Node.js achieve scalability?")
                      }
                      disabled={loading || selectedSources.length === 0}
                    >
                      How does Node.js achieve scalability?
                    </button>,
                  ]}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-full"
              onClick={scrollRight}
              disabled={initialLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
