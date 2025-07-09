"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotebookStore } from "@/lib/state";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Source {
  id: string;
  sourceTitle: string;
  type: string;
  url?: string;
  status?: string; // <-- added status property
  createdAt: Date;
}

interface DiscoveredSource {
  id: string;
  title: string;
  url: string;
  description: string;
}

interface SourceUIProps {
  notebookId?: string;
}

export function SourceUI({ notebookId }: SourceUIProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [discoverModalOpen, setDiscoverModalOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [copiedText, setCopiedText] = useState("");
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [discoverInterest, setDiscoverInterest] = useState("");
  const [discoveredSources, setDiscoveredSources] = useState<
    DiscoveredSource[]
  >([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  // Change selectedDiscoveredSources to number[]
  const [selectedDiscoveredSources, setSelectedDiscoveredSources] = useState<
    number[]
  >([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const isProgrammaticChange = useRef(false);

  const { selectedSources, selectSources } = useNotebookStore();

  const { isPending, error, data, refetch, isRefetching } = useQuery({
    queryKey: ["sources", notebookId],
    queryFn: async () => {
      if (!notebookId) return { sources: [] };

      const response = await fetch(`/api/notebooks/${notebookId}/sources`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error("Failed to load sources");
    },
    enabled: !!notebookId,
  });

  useEffect(() => {
    if (data?.sources) {
      setSources(data.sources);
    }
  }, [data]);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    if (!notebookId) {
      toast.error("No notebook selected");
      return;
    }

    setIsFileUploading(true);
    setModalOpen(false);

    // Create temporary sources with "UPLOADING" status
    const tempSources: Source[] = files.map((file, index) => ({
      id: `temp-upload-${Date.now()}-${index}`,
      sourceTitle: file.name,
      type: "file",
      status: "UPLOADING",
      createdAt: new Date(),
    }));

    setSources((prev) => [...prev, ...tempSources]);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("notebookId", notebookId);

      const response = await fetch("/api/file-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload files");
      }

      const result = await response.json();

      if (result.success) {
        // Remove temp sources and add the real ones with processing status
        setSources((prev) => {
          const withoutTemp = prev.filter(
            (s) => !s.id.startsWith("temp-upload-")
          );
          const processingSources = result.sources.map((source: any) => ({
            ...source,
            status: "PROCESSING",
          }));
          return [...withoutTemp, ...processingSources];
        });

        setFiles([]);
        toast.success(result.message);
        setIsFileUploading(false);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      // Update temp sources to failed status
      setSources((prev) =>
        prev.map((s) =>
          s.id.startsWith("temp-upload-") ? { ...s, status: "FAILED" } : s
        )
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to upload files"
      );
      setIsFileUploading(false);
    }
  };

  const handleAddWebsite = async () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }
    if (!notebookId) {
      toast.error("No notebook selected");
      return;
    }

    setIsAddingSource(true);
    const sourceId = `website-${Date.now()}`;
    try {
      // Create source with processing status first
      const newSource: Source = {
        id: sourceId,
        sourceTitle: `Website: ${new URL(url).hostname}`,
        type: "website",
        url: url,
        status: "UPLOADING",
        createdAt: new Date(),
      };

      setSources((prev) => [...prev, newSource]);
      setUrl("");
      setModalOpen(false);

      const response = await fetch(
        `/api/notebooks/${notebookId}/sources/website`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteUrl: url }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add website");
      }
      const result = await response.json();
      if (result.success) {
        // Keep the source in processing status after API success
        // The backend will handle the actual processing
        setSources((prev) =>
          prev.map((s) =>
            s.id === sourceId ? { ...result.source, status: "PROCESSING" } : s
          )
        );
        toast.success(result.message);
      } else {
        throw new Error("Failed to add website");
      }
    } catch (error) {
      // Update the source status to failed
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, status: "FAILED" } : s))
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to add website"
      );
      // Don't close modal on error - let user try again
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleAddYouTube = async () => {
    if (!url.trim()) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }
    if (!notebookId) {
      toast.error("No notebook selected");
      return;
    }

    setIsAddingSource(true);
    const sourceId = `youtube-${Date.now()}`;
    try {
      // Create source with processing status first
      const newSource: Source = {
        id: sourceId,
        sourceTitle: `YouTube: ${url}`,
        type: "youtube",
        url: url,
        status: "UPLOADING",
        createdAt: new Date(),
      };

      setSources((prev) => [...prev, newSource]);
      setUrl("");
      setModalOpen(false);

      const response = await fetch(
        `/api/notebooks/${notebookId}/sources/youtube`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ youtubeUrl: url }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add YouTube video");
      }
      const result = await response.json();
      if (result.success) {
        // Keep the source in processing status after API success
        // The backend will handle the actual processing
        setSources((prev) =>
          prev.map((s) =>
            s.id === sourceId ? { ...result.source, status: "PROCESSING" } : s
          )
        );
        toast.success(result.message);
      } else {
        throw new Error("Failed to add YouTube video");
      }
    } catch (error) {
      // Update the source status to failed
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, status: "FAILED" } : s))
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to add YouTube video"
      );
      // Don't close modal on error - let user try again
    } finally {
      setIsAddingSource(false);
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const handleAddUrl = async () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    setModalOpen(false);

    if (isYouTubeUrl(url)) {
      await handleAddYouTube();
    } else {
      await handleAddWebsite();
    }
  };

  const handleAddCopiedText = async () => {
    if (!copiedText.trim()) {
      toast.error("Please enter some text");
      return;
    }
    if (!notebookId) {
      toast.error("No notebook selected");
      return;
    }

    setIsAddingSource(true);
    const sourceId = `text-${Date.now()}`;
    try {
      // Create source with processing status first
      const newSource: Source = {
        id: sourceId,
        sourceTitle: `Text: ${copiedText.substring(0, 50)}${copiedText.length > 50 ? "..." : ""}`,
        type: "text",
        status: "UPLOADING",
        createdAt: new Date(),
      };

      setSources((prev) => [...prev, newSource]);
      setCopiedText("");
      setModalOpen(false);

      const response = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: copiedText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add text");
      }

      const result = await response.json();
      if (result.success) {
        // Keep the source in processing status after API success
        // The backend will handle the actual processing
        setSources((prev) =>
          prev.map((s) =>
            s.id === sourceId ? { ...result.source, status: "PROCESSING" } : s
          )
        );
        toast.success(result.message);
      } else {
        throw new Error("Failed to add text");
      }
    } catch (error) {
      // Update the source status to failed
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, status: "FAILED" } : s))
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to add text"
      );
      // Don't close modal on error - let user try again
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!notebookId) {
      toast.error("No notebook selected");
      return;
    }

    try {
      const response = await fetch(
        `/api/notebooks/${notebookId}/sources?sourceId=${sourceId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete source");
      }

      setSources((prev) => prev.filter((source) => source.id !== sourceId));
      selectSources(selectedSources.filter((id) => id !== sourceId));
      toast.success("Source deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete source"
      );
    }
  };

  const handleEditSourceName = async (sourceId: string) => {
    if (!notebookId) {
      toast.error("No notebook selected");
      return;
    }

    const source = sources.find((s) => s.id === sourceId);
    if (source) {
      const newName = prompt("Enter new name:", source.sourceTitle);
      if (newName && newName.trim()) {
        try {
          const response = await fetch(`/api/notebooks/${notebookId}/sources`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sourceId: sourceId,
              sourceTitle: newName.trim(),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update source");
          }

          const result = await response.json();

          setSources((prev) =>
            prev.map((s) =>
              s.id === sourceId
                ? { ...s, sourceTitle: result.source.sourceTitle }
                : s
            )
          );
          toast.success("Source name updated");
        } catch (error) {
          console.error("Update error:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to update source"
          );
        }
      }
    }
  };

  const handleDiscoverSources = async () => {
    setDiscoverModalOpen(true);
    // Reset state when opening modal
    setDiscoveredSources([]);
    setIsDiscovering(false);
    setDiscoverInterest("");
  };

  const handleFeelingCurious = () => {
    const curiousPrompts = [
      "Artificial intelligence and machine learning",
      "Latest developments in renewable energy",
      "Space exploration and astronomy",
      "Productivity techniques and tools",
      "Blockchain and cryptocurrency",
      "Sustainable living and environmental conservation",
    ];

    const randomPrompt =
      curiousPrompts[Math.floor(Math.random() * curiousPrompts.length)];
    setDiscoverInterest(randomPrompt);
  };

  const handleSubmitDiscover = async () => {
    if (!discoverInterest.trim()) {
      toast.error("Please enter what you're interested in");
      return;
    }

    setIsDiscovering(true);
    setDiscoveredSources([]);
    // In handleSubmitDiscover, select all indices by default
    setSelectedDiscoveredSources(sources.map((_, idx) => idx));
    setIsSelectAllChecked(true);

    try {
      const response = await fetch(`/api/notebooks/${notebookId}/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest: discoverInterest }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to discover sources");
      }
      const result = await response.json();
      if (result.success) {
        const sources = result.sources || [];
        setDiscoveredSources(sources);
        // Auto-select all discovered sources by default
        setSelectedDiscoveredSources(
          sources.map((s: DiscoveredSource) => sources.indexOf(s))
        );
        setIsSelectAllChecked(true);
        toast.success(result.message);
      } else {
        throw new Error("Failed to discover sources");
      }
    } catch (error) {
      toast.error("Failed to discover sources");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddDiscoveredSource = async (
    discoveredSource: DiscoveredSource
  ) => {
    if (!notebookId) {
      toast.error("No notebook selected");
      return;
    }

    try {
      const response = await fetch(`/api/notebooks/${notebookId}/sources/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: discoveredSource.url,
          title: discoveredSource.title,
          description: discoveredSource.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add discovered source");
      }

      const result = await response.json();
      if (result.success) {
        // Add to sources list with processing status
        const newSource: Source = {
          id: result.source.id,
          sourceTitle: discoveredSource.title,
          type: "pdf", // Changed to pdf since these are PDF files
          url: discoveredSource.url,
          status: "PROCESSING",
          createdAt: new Date(),
        };

        setSources((prev) => [...prev, newSource]);
        toast.success("Source added successfully");
      } else {
        throw new Error("Failed to add discovered source");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add discovered source"
      );
    }
  };

  // In handleSelectDiscoveredSource, use index instead of id
  const handleSelectDiscoveredSource = (index: number, checked: boolean) => {
    console.log("Individual selection:", index, checked);
    console.log("Current selected sources:", selectedDiscoveredSources);
    console.log("Total sources:", discoveredSources.length);

    if (checked) {
      setSelectedDiscoveredSources((prev) => {
        const newSelection = [...prev, index];
        console.log("New selection after adding:", newSelection);
        console.log("New selection length:", newSelection.length);
        console.log("Total sources length:", discoveredSources.length);
        // Update "Select All" state based on whether all items are selected
        const shouldSelectAll =
          newSelection.length === discoveredSources.length;
        console.log("Should select all:", shouldSelectAll);
        isProgrammaticChange.current = true;
        setIsSelectAllChecked(shouldSelectAll);
        return newSelection;
      });
    } else {
      setSelectedDiscoveredSources((prev) => {
        const newSelection = prev.filter((i) => i !== index);
        console.log("New selection after removing:", newSelection);
        console.log("New selection length:", newSelection.length);
        console.log("Total sources length:", discoveredSources.length);
        // Update "Select All" state based on whether all items are selected
        const shouldSelectAll =
          newSelection.length === discoveredSources.length;
        console.log("Should select all:", shouldSelectAll);
        isProgrammaticChange.current = true;
        setIsSelectAllChecked(shouldSelectAll);
        return newSelection;
      });
    }
  };

  // In handleSelectAllDiscoveredSources, select all indices
  const handleSelectAllDiscoveredSources = (checked: boolean) => {
    console.log("Select all called with:", checked);
    console.log("Current selected sources:", selectedDiscoveredSources);
    console.log("Total sources:", discoveredSources.length);

    setIsSelectAllChecked(checked);
    if (checked) {
      const allIds = discoveredSources.map((_, idx) => idx);
      console.log("Selecting all sources:", allIds);
      setSelectedDiscoveredSources(allIds);
    } else {
      console.log("Deselecting all sources");
      setSelectedDiscoveredSources([]);
    }
  };

  const handleImportSelectedSources = async () => {
    if (selectedDiscoveredSources.length === 0) {
      toast.error("Please select at least one source to import");
      return;
    }

    if (!notebookId) {
      toast.error("No notebook selected");
      return;
    }

    setIsImporting(true);

    try {
      // Get the selected source objects
      const sourcesToImport = selectedDiscoveredSources.map(
        (idx) => discoveredSources[idx]
      );

      // Log the selected sources

      // Send all selected sources together as an array
      const response = await fetch(`/api/notebooks/${notebookId}/sources/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedDiscoverySources: sourcesToImport.map((source) => ({
            url: source.url,
            title: source.title,
            description: source.description,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import sources");
      }

      const result = await response.json();

      // Add all imported sources to the sources list with processing status
      const newSources: Source[] = sourcesToImport.map((source, index) => ({
        id: result.sources?.[index]?.id || `imported-${Date.now()}-${index}`,
        sourceTitle: source.title,
        type: "pdf", // Changed to pdf since these are PDF files
        url: source.url,
        status: "PROCESSING",
        createdAt: new Date(),
      }));

      setSources((prev) => [...prev, ...newSources]);

      // Clear state and close modal
      setDiscoverModalOpen(false);
      setDiscoveredSources([]);
      setDiscoverInterest("");
      setSelectedDiscoveredSources([]);
      setIsSelectAllChecked(false);

      toast.success(`Successfully imported ${newSources.length} sources`);
    } catch (error) {
      console.error("Import error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import sources"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectAllSources = (checked: boolean) => {
    if (checked) {
      selectSources(sources.map((s) => s.id));
    } else {
      selectSources([]);
    }
  };

  const handleSelectSource = (sourceId: string, checked: boolean) => {
    if (checked) {
      selectSources([...selectedSources, sourceId]);
    } else {
      selectSources(selectedSources.filter((id) => id !== sourceId));
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-medium text-sm text-foreground">
              Sources <span>({sources.length}/5)</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              You can only add 5 documents, To add more you need to go with
              Infera Notebook Pro
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="flex gap-2">
          {/* Refetch button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                variant="outline"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh sources</p>
            </TooltipContent>
          </Tooltip>
          {/* Discover button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                variant="outline"
                onClick={handleDiscoverSources}
              >
                <Search className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Discover sources</p>
            </TooltipContent>
          </Tooltip>
          {/* Dialog UI */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    className="rounded-md px-3 py-1.5 text-xs font-medium"
                    variant="secondary"
                  >
                    <Plus />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add sources</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Add Sources</DialogTitle>
                <DialogDescription>
                  Sources let Infera Notebook base its responses on the
                  information that matters most to you. (Examples: marketing
                  plans, course reading, research notes, meeting transcripts,
                  sales documents, etc.)
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="link">Link</TabsTrigger>
                  <TabsTrigger value="paste">Paste Text</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <div className="w-full max-w-4xl mx-auto min-h-48 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg p-6 flex flex-col gap-4 items-center justify-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Supported filetypes: PDF, .txt, Markdown, CSV, DOC, DOCX,
                      MP3 Audio
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          handleFileUpload(Array.from(files));
                        }
                      }}
                      disabled={isFileUploading}
                    />
                    {isFileUploading && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Uploading files...</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="link">
                  <div className="w-full max-w-2xl mx-auto min-h-32 bg-card border border-border rounded-lg p-6 flex flex-col gap-4 items-center justify-center">
                    <h2 className="text-base font-medium mb-2">Add a Link</h2>
                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex flex-col gap-2 w-full">
                        <Label htmlFor="url-input">URL</Label>
                        <div className="relative">
                          <input
                            id="url-input"
                            type="url"
                            className="w-full border rounded px-3 py-2 text-sm pr-20"
                            placeholder="https://example.com or https://youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={isAddingSource}
                          />
                          {url.trim() && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  isYouTubeUrl(url)
                                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                }`}
                              >
                                {isYouTubeUrl(url) ? "YouTube" : "Website"}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleAddUrl}
                          className="self-end mt-2"
                          disabled={isAddingSource || !url.trim()}
                        >
                          {isAddingSource ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            `Add ${isYouTubeUrl(url) ? "YouTube" : "Website"}`
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="paste">
                  <div className="w-full max-w-2xl mx-auto min-h-32 bg-card border border-border rounded-lg p-6 flex flex-col gap-4">
                    <h2 className="text-base font-medium mb-2">Paste Text</h2>
                    <Label htmlFor="copied-text">Copied Text</Label>
                    <ScrollArea className="h-[200px] w-full border rounded-md">
                      <Textarea
                        id="copied-text"
                        className="w-full border-0 resize-none min-h-[200px]"
                        placeholder="Paste your text here..."
                        value={copiedText}
                        onChange={(e) => setCopiedText(e.target.value)}
                        disabled={isAddingSource}
                      />
                    </ScrollArea>
                    <Button
                      variant="outline"
                      onClick={handleAddCopiedText}
                      className="self-end mt-2"
                      disabled={isAddingSource || !copiedText.trim()}
                    >
                      {isAddingSource ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Text"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex items-center px-4 py-2 border-b border-border">
        <input
          type="checkbox"
          className="mr-2"
          checked={
            selectedSources.length === sources.length && sources.length > 0
          }
          onChange={(e) => handleSelectAllSources(e.target.checked)}
        />
        <Label
          htmlFor="select-all-sources-lg"
          className="text-xs text-zinc-400 select-none cursor-pointer"
        >
          Select all sources
        </Label>
      </div>
      {/* Sources section takes remaining space */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full">
          <div className="px-2 py-2">
            {/* Loading state */}
            {isPending && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading sources...
                </span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex items-center justify-center py-8 text-red-600">
                <span className="text-sm">
                  Failed to load sources. Please try again.
                </span>
              </div>
            )}

            {/* File uploading UI placeholder */}
            {isFileUploading && (
              <div className="flex items-center bg-card rounded-md px-2 py-2 mb-2">
                <Button variant="ghost" size="icon" className="mr-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </Button>
                <span className="flex-1 text-sm text-foreground">
                  Uploading files...
                </span>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </Button>
              </div>
            )}
            {/* Sources list */}
            {!isPending &&
              !error &&
              sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center bg-card rounded-md px-2 py-2 mb-2"
                >
                  <Button variant="ghost" size="icon" className="mr-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <span className="flex-1 text-sm text-foreground">
                    {source.sourceTitle}
                  </span>
                  {source.status === "UPLOADING" ? (
                    <span className="ml-2 text-xs text-blue-600 font-semibold">
                      UPLOADING
                    </span>
                  ) : source.status === "PROCESSING" ? (
                    <span className="ml-2 text-xs text-yellow-600 font-semibold">
                      PROCESSING
                    </span>
                  ) : source.status === "FAILED" ? (
                    <span className="ml-2 text-xs text-red-600 font-semibold">
                      FAILED
                    </span>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        className="ml-2"
                        checked={selectedSources.includes(source.id)}
                        onChange={(e) =>
                          handleSelectSource(source.id, e.target.checked)
                        }
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="ml-2">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditSourceName(source.id)}
                          >
                            Edit Source Name
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteSource(source.id)}
                            className="text-destructive"
                          >
                            Delete Source
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            {!isPending &&
              !error &&
              sources.length === 0 &&
              !isFileUploading && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-sm">No sources added yet</p>
                  <p className="text-xs">
                    Add your first source to get started
                  </p>
                </div>
              )}
          </div>
        </ScrollArea>
      </div>

      {/* Discover Sources Dialog */}
      <Dialog
        open={discoverModalOpen}
        onOpenChange={(open) => {
          setDiscoverModalOpen(open);
          if (!open) {
            // Reset state when closing modal
            setDiscoveredSources([]);
            setIsDiscovering(false);
            setDiscoverInterest("");
            setSelectedDiscoveredSources([]);
            setIsSelectAllChecked(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Discover Sources</DialogTitle>
            <DialogDescription>
              Find and add relevant sources from your connected accounts and
              recent activity.
            </DialogDescription>
          </DialogHeader>

          {/* Search Interface - Only show when no sources are discovered */}
          {discoveredSources.length === 0 && (
            <div className="flex-1 space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <Label
                  htmlFor="discover-interest"
                  className="text-base font-medium"
                >
                  What are you interested in?
                </Label>
                <Textarea
                  id="discover-interest"
                  placeholder="Tell us what you're looking for... (e.g., machine learning, productivity tips, space exploration)"
                  value={discoverInterest}
                  onChange={(e) => setDiscoverInterest(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleFeelingCurious}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />I am feeling Curious
                </Button>
                <Button
                  onClick={handleSubmitDiscover}
                  disabled={!discoverInterest.trim() || isDiscovering}
                  className="flex-1"
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>

              {/* Discovered Sources Section */}
              {isDiscovering && (
                <div className="border-t pt-4 flex-1">
                  <h3 className="font-medium mb-3">Discovering sources...</h3>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 border rounded-lg"
                      >
                        <Skeleton className="h-4 w-4 rounded mt-1" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {!isDiscovering && discoverInterest && (
                <div className="border-t pt-4 flex-1">
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">
                      No sources found for your interest
                    </p>
                    <p className="text-xs">Try a different search term</p>
                  </div>
                </div>
              )}

              {/* External Services - Only show when no sources are discovered */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">
                  Or connect external services:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Recent Documents</h3>
                      <p className="text-sm text-muted-foreground">
                        From your recent activity
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Browse
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Google Drive</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect your Google Drive
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">OneDrive</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect your OneDrive
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discovered Sources Results - Show when sources are found */}
          {!isDiscovering && discoveredSources.length > 0 && (
            <div className="space-y-4">
              {/* Header with selection controls */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">
                    Discovered Sources ({discoveredSources.length})
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select sources to import into your notebook
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    key="select-all-checkbox"
                    type="checkbox"
                    checked={isSelectAllChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      console.log(
                        "Select All checkbox clicked:",
                        e.target.checked
                      );
                      if (!isProgrammaticChange.current) {
                        handleSelectAllDiscoveredSources(e.target.checked);
                      }
                      isProgrammaticChange.current = false;
                    }}
                    className="mr-2"
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              </div>

              {/* Sources List */}
              <div className="max-h-[300px] overflow-y-auto border rounded-lg p-4">
                <div className="space-y-3">
                  {discoveredSources.map((source, index) => (
                    <div
                      key={`${source.id}-${index}`}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDiscoveredSources.includes(index)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectDiscoveredSource(index, e.target.checked);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {source.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {source.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleImportSelectedSources}
                  disabled={
                    selectedDiscoveredSources.length === 0 || isImporting
                  }
                  className="flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Import Selected ({selectedDiscoveredSources.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SourceUI;
