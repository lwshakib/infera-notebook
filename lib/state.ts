import { create } from "zustand";

interface ChatMessage {
  id: string;
  sender: "USER" | "ASSISTANT";
  message: string;
  createdAt: string;
}

interface Note {
  id: string;
  title?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
}

interface NotebookStore {
  notebookDetails: any;
  sources: any[];
  notes: Note[];
  chatMessages: ChatMessage[];
  selectedSources: any[];
  setSelectSource: (selectSource: any) => void;
  selectSources: (sourceIds: string[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  addUserMessage: (message: string) => void;
  addAssistantMessage: (message: string) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addProcessingNote: (note: Note) => void;
  removeProcessingNote: (noteId: string) => void;
  setNotes: (notes: Note[]) => void;
}

export const useNotebookStore = create<NotebookStore>((set) => ({
  notebookDetails: null,
  sources: [],
  notes: [],
  chatMessages: [],
  selectedSources: [],
  setSelectSource: (selectSource: any) =>
    set((state) => ({
      selectedSources: [...state.selectedSources, selectSource],
    })),
  selectSources: (sourceIds: string[]) =>
    set((state) => ({
      selectedSources: sourceIds,
    })),
  addChatMessage: (message: ChatMessage) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  addUserMessage: (message: string) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: Date.now().toString(),
          sender: "USER",
          message,
          createdAt: new Date().toISOString(),
        },
      ],
    })),
  addAssistantMessage: (message: string) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: Date.now().toString(),
          sender: "ASSISTANT",
          message,
          createdAt: new Date().toISOString(),
        },
      ],
    })),
  setChatMessages: (messages: ChatMessage[]) =>
    set(() => ({ chatMessages: messages })),
  addProcessingNote: (note: Note) =>
    set((state) => ({
      notes: [note, ...state.notes],
    })),
  removeProcessingNote: (noteId: string) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteId),
    })),
  setNotes: (notes: Note[]) => set(() => ({ notes })),
}));
