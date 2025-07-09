"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotebookStore } from "@/lib/state";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Clock,
  Clock3,
  FileText,
  Sparkles,
  Trash,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AudioPlayer } from "./audio-player";
import MindMap from "./mindmap";

export interface Note {
  id: string;
  title?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  status?: string; // <-- add status from backend
  type?: string; // <-- add type for mind map
}

interface NotesUIProps {
  notebookId?: string;
}

export const NotesUI = ({ notebookId }: NotesUIProps) => {
  const [openNote, setOpenNote] = useState<null | string>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogNoteId, setDeleteDialogNoteId] = useState<string | null>(
    null
  );
  const [creatingAudio, setCreatingAudio] = useState(false);
  const [showDummyProcessing, setShowDummyProcessing] = useState(false);
  const [creatingMindMap, setCreatingMindMap] = useState(false);
  const queryClient = useQueryClient();
  const {
    notes: storeNotes,
    setNotes,
    selectedSources,
    addProcessingNote,
    removeProcessingNote,
  } = useNotebookStore();

  // Fetch notebook details (including audioOverView)
  const { data: notebookData, isLoading: notebookLoading } = useQuery({
    queryKey: ["notebook", notebookId],
    queryFn: async () => {
      if (!notebookId) return null;
      const res = await fetch(`/api/notebooks/${notebookId}`);
      if (!res.ok) throw new Error("Failed to load notebook");
      return res.json();
    },
    enabled: !!notebookId,
    refetchInterval: 10000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["notes", notebookId],
    queryFn: async () => {
      if (!notebookId) return { notes: [] };
      const response = await fetch(`/api/notebooks/${notebookId}/notes`);
      if (!response.ok) throw new Error("Failed to load notes");
      return response.json();
    },
    enabled: !!notebookId,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Update store notes when data changes
  useEffect(() => {
    if (data?.notes) {
      setNotes(data.notes);
    }
  }, [data?.notes, setNotes]);

  // Combine store notes (which include processing notes) with fetched notes
  const notes: Note[] = storeNotes.length > 0 ? storeNotes : data?.notes || [];

  const handleDeleteNote = async (noteId: string) => {
    if (!notebookId) return;

    setIsDeleting(noteId);
    try {
      const response = await fetch(
        `/api/notebooks/${notebookId}/notes?noteId=${noteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      // Invalidate and refetch notes
      await queryClient.invalidateQueries({ queryKey: ["notes", notebookId] });
      setOpenNote(null);
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Handler for creating audio overview
  const handleCreateAudioOverview = async () => {
    if (!notebookId) return;
    setCreatingAudio(true);
    setShowDummyProcessing(true); // Show dummy processing immediately
    try {
      await fetch(`/api/notebooks/${notebookId}/audio-overview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedSources, notebookId }),
      });
      console.log("create audio");
    } catch (err) {
      // Optionally handle error
      console.error("Failed to create audio overview", err);
    } finally {
      setCreatingAudio(false);
    }
  };

  // Hide dummy processing when backend status updates
  useEffect(() => {
    if (
      notebookData?.audioOverview?.status === "PROCESSING" ||
      notebookData?.audioOverview?.status === "COMPLETED"
    ) {
      setShowDummyProcessing(false);
    }
  }, [notebookData?.audioOverview?.status]);

  // Use backend status if present, otherwise fallback to derived
  const getNoteStatus = (note: Note) => {
    if (note.status) return note.status.toUpperCase();
    if (!note.content || note.content.trim() === "") return "EMPTY";
    if (note.content.length < 50) return "DRAFT";
    return "COMPLETE";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EMPTY":
        return (
          <Badge variant="outline" className="text-xs">
            Empty
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="secondary" className="text-xs">
            Draft
          </Badge>
        );
      case "COMPLETE":
        return (
          <Badge variant="default" className="text-xs">
            Complete
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Processing
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCreateMindMap = async () => {
    if (!notebookId || selectedSources.length === 0) return;

    setCreatingMindMap(true);

    // Create a temporary processing note for mind map
    const processingNoteId = `processing-mindmap-${Date.now()}`;
    const processingNote = {
      id: processingNoteId,
      title: "Creating Mind Map...",
      content: `Creating a mind map from the following sources: ${selectedSources.map((source) => source.title || source.url).join(", ")}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "PROCESSING",
    };

    // Add the processing note to the store
    addProcessingNote(processingNote);

    try {
      await fetch(`/api/notebooks/${notebookId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: `Create a mind map from the following sources: ${selectedSources.map((source) => source.title || source.url).join(", ")}`,
          type: "MIND_MAP",
          selectedSources,
        }),
      });
      console.log("Mind map creation initiated");

      // Invalidate and refetch notes to get the real note from the backend
      await queryClient.invalidateQueries({ queryKey: ["notes", notebookId] });
    } catch (err) {
      console.error("Failed to create mind map", err);
      // Remove the processing note if the API request failed
      removeProcessingNote(processingNoteId);
    } finally {
      setCreatingMindMap(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Audio Overview Section */}
      <div className="mb-4">
        {notebookLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : notebookData?.audioOverview?.hasAudioOverview &&
          notebookData?.audioOverview?.status === "COMPLETED" ? (
          <AudioPlayer
            audioFiles={[
              {
                id: "audioPreview",
                name: notebookData.audioOverview?.audioTitle,
                file: notebookData.audioOverview?.audioUrl,
                type: "audio/mpeg",
              },
            ]}
          />
        ) : notebookData?.audioOverview?.status === "PROCESSING" ||
          showDummyProcessing ? (
          <div className="flex items-center justify-center gap-2 h-12 w-full px-6 py-3 bg-card border rounded-lg shadow-sm">
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span className="font-medium">Audio Processing</span>
          </div>
        ) : selectedSources.length > 0 ? (
          <Button onClick={handleCreateAudioOverview} disabled={creatingAudio}>
            {creatingAudio ? "Creating..." : "Create Audio Overview"}
          </Button>
        ) : (
          <div className="text-muted-foreground">
            Select source to create Audio Overview
          </div>
        )}
      </div>

      <div className="mb-4">
        <Button
          onClick={handleCreateMindMap}
          disabled={selectedSources.length === 0 || creatingMindMap}
        >
          {creatingMindMap ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Creating Mind Map...
            </>
          ) : (
            "Create A Mind Map"
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <ScrollArea className="h-full w-full">
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-lg px-4 py-3 shadow-sm border group flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="h-6 w-6 rounded" />
                    </div>
                  </div>
                ))}
              </>
            ) : error ? (
              <div className="text-destructive p-4 text-center">
                <Badge variant="destructive">Failed to load notes</Badge>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                  <span>No notes found</span>
                </div>
              </div>
            ) : (
              notes.map((note) => {
                const status = getNoteStatus(note);
                const isRecent =
                  new Date(note.createdAt) >
                  new Date(Date.now() - 24 * 60 * 60 * 1000);
                const isProcessing = status === "PROCESSING";

                return (
                  <div
                    className="bg-card rounded-lg px-4 py-3 shadow-sm border group hover:bg-muted/50 transition-all duration-200 hover:shadow-md"
                    key={note.id}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 min-w-0">
                          <span
                            className="font-medium text-foreground block break-words max-w-[70vw] sm:max-w-xs cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenNote(note.id);
                            }}
                          >
                            {note.title || "Untitled Note"}
                          </span>
                          {isRecent && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3" />
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(status)}
                          <div className="flex w-full justify-between items-center mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs flex items-center gap-1"
                            >
                              <Clock3 className="w-3 h-3" />
                              {formatDistanceToNow(new Date(note.createdAt), {
                                addSuffix: true,
                              })}
                            </Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialogNoteId(note.id);
                                  }}
                                  disabled={
                                    isDeleting === note.id || isProcessing
                                  }
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1"
                                >
                                  {isDeleting === note.id ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Note
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this note?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={() => setDeleteDialogNoteId(null)}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={async () => {
                                      setDeleteDialogNoteId(null);
                                      await handleDeleteNote(note.id);
                                    }}
                                    disabled={isDeleting === note.id}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Note Details Dialog */}
      <Dialog open={openNote !== null} onOpenChange={() => setOpenNote(null)}>
        {(() => {
          const note = notes.find((n) => n.id === openNote);
          if (!note) return null;

          const status = getNoteStatus(note);
          const isRecent =
            new Date(note.createdAt) >
            new Date(Date.now() - 24 * 60 * 60 * 1000);

          // Special modal for MIND_MAP
          if (note.type === "MIND_MAP") {
            return (
              <DialogContent
                style={{
                  width: "90vw",
                  height: "90vh",
                  maxWidth: "90vw",
                  maxHeight: "90vh",
                }}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span>{note.title || "Mind Map"}</span>
                    {isRecent && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="w-3 h-3" />
                        New
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(note.createdAt), {
                        addSuffix: true,
                      })}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleTimeString()}
                    </Badge>
                    {getStatusBadge(status)}
                  </DialogDescription>
                </DialogHeader>
                <div
                  className="mt-6 flex-1 overflow-auto"
                  style={{ height: "70vh" }}
                >
                  <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Mind Map Content:
                  </div>
                  <ScrollArea className="h-full max-h-[60vh]">
                    <div
                      className="text-foreground whitespace-pre-wrap bg-muted p-4 rounded-md border"
                      style={{ minHeight: "50vh" }}
                    >
                      {note && note.content && (
                        <MindMap
                          initialNodes={JSON.parse(note.content).initialNodes}
                          initialEdges={JSON.parse(note.content).initialEdges}
                        />
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            );
          }

          // Default dialog for other note types
          return (
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{note.title || "Untitled Note"}</span>
                  {isRecent && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3" />
                      New
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(note.createdAt), {
                      addSuffix: true,
                    })}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(note.createdAt).toLocaleTimeString()}
                  </Badge>
                  {getStatusBadge(status)}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 flex-1 overflow-hidden">
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Content:
                </div>
                <ScrollArea className="h-full max-h-[50vh]">
                  <div className="text-foreground whitespace-pre-wrap bg-muted p-4 rounded-md border">
                    <ReactMarkdown>
                      {note.content || "No content available"}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
};

export default NotesUI;
