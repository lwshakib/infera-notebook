"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ChatUI from "../_components/chat-ui";
import Header from "../_components/header";
import NotesUI from "../_components/notes-ui";
import SourceUI from "../_components/source-ui";

interface Notebook {
  id: string;
  clerkId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const fetchNotebookDetails = async (id: string): Promise<Notebook> => {
  const response = await fetch(`/api/notebooks/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notebook details");
  }
  return response.json();
};

export default function page() {
  const [isMobile, setIsMobile] = useState(false);
  const params = useParams<any>();

  const {
    data: notebook,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notebook", params?.id],
    queryFn: () => fetchNotebookDetails(params?.id),
    enabled: !!params?.id,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1200);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <Header
          notebookTitle={notebook?.title || "Untitled Notebook"}
          notebookId={params?.id || ""}
        />
        <div className="flex-1 overflow-y-auto pt-4 px-2 sm:pt-8 sm:px-10">
          <Tabs defaultValue="chat" className="w-full h-full">
            <TabsList className="w-full grid grid-cols-3 mb-2">
              <TabsTrigger value="source">Sources</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="source">
              <SourceUI notebookId={params?.id} />
            </TabsContent>
            <TabsContent value="chat">
              <ChatUI />
            </TabsContent>
            <TabsContent value="notes">
              <NotesUI notebookId={params?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        notebookTitle={notebook?.title || "Untitled Notebook"}
        notebookId={params?.id || ""}
      />
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full rounded-lg"
        >
          <ResizablePanel defaultSize={20} minSize={20}>
            <SourceUI notebookId={params?.id} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={40}>
            <ChatUI />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20} minSize={20}>
            <NotesUI notebookId={params?.id} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
