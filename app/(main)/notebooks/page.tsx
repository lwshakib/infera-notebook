"use client";
import { ModeToggle } from "@/components/mode-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserButton } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { LayoutGrid, List, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Notebook {
  id: string;
  title: string;
  sources: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function page() {
  const router = useRouter();
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [notebooks, setNoteBooks] = useState<Notebook[]>([]);
  const [layout, setLayout] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleOpenEdit = (index: number) => {
    setEditIndex(index);
    setEditTitle(notebooks[index]?.title);
  };

  const handleCloseEdit = () => {
    setEditIndex(null);
    setEditTitle("");
  };

  const handleRename = async (notebookId: string) => {
    try {
      const response = await fetch("/api/notebooks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: notebookId,
          title: editTitle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update notebook");
      }

      const updatedNotebook = await response.json();
      const updatedNotebooks = notebooks.map((notebook) =>
        notebook?.id === notebookId ? updatedNotebook : notebook
      );
      setNoteBooks(updatedNotebooks);
      handleCloseEdit();
      toast.success("Notebook title updated successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update notebook");
      }
    }
  };

  const handleOpenDelete = (index: number) => setDeleteIndex(index);
  const handleCloseDelete = () => setDeleteIndex(null);

  const handleDelete = async () => {
    try {
      const notebookToDelete = notebooks[deleteIndex!];
      const response = await fetch(`/api/notebooks?id=${notebookToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete notebook");
      }

      const updatedNotebooks = notebooks.filter(
        (_, index) => index !== deleteIndex
      );
      setNoteBooks(updatedNotebooks);
      handleCloseDelete();
      toast.success("Notebook deleted successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete notebook");
      }
    }
  };

  const getNotebooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notebooks");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch notebooks");
      }

      const data = await response.json();
      setNoteBooks(data);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to fetch notebooks");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getNotebooks();
  }, []);

  const handleCreateNoteBook = async () => {
    try {
      setCreating(true);
      const response = await fetch("/api/notebooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create notebook");
      }

      const newNotebook = await response.json();
      router.push(`/notebooks/` + newNotebook.id);
      setNoteBooks([newNotebook, ...notebooks]);
      toast.success("New notebook created successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create notebook");
      }
    } finally {
      setCreating(false);
    }
  };

  // Skeleton components for better loading states
  const GridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="h-40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <div className="rounded-md border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Sources</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header Section */}
      <header className="w-full h-auto mt-4 mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
        >
          <>
            <img src="/logo.svg" alt="Infera Notebook" width={30} height={30} />
            <span className="font-medium text-black dark:text-white">
              Infera Notebook
            </span>
          </>
        </Link>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <div className="h-6 w-px bg-border/50" />
          <UserButton />
        </div>
      </header>

      <div className="flex items-center justify-between mb-6">
        <Button
          className="flex items-center gap-2"
          type="button"
          onClick={handleCreateNoteBook}
          disabled={creating}
        >
          <Plus className="w-4 h-4" />
          {creating ? "Creating..." : "Create Notebook"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLayout(layout === "grid" ? "table" : "grid")}
          aria-label="Toggle layout"
        >
          {layout === "grid" ? (
            <List className="w-5 h-5" />
          ) : (
            <LayoutGrid className="w-5 h-5" />
          )}
        </Button>
      </div>

      {loading ? (
        layout === "grid" ? (
          <GridSkeleton />
        ) : (
          <TableSkeleton />
        )
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notebooks.map((notebook, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle
                  className="text-lg hover:underline cursor-pointer"
                  onClick={() => router.push(`/notebooks/${notebook?.id}`)}
                >
                  {notebook.title}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleOpenEdit(index)}>
                      Edit title
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenDelete(index)}>
                      Delete notebook
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {notebook.sources} sources
                </p>
                <p className="text-xs text-gray-400">
                  Created : {formatDistanceToNow(new Date(notebook.createdAt))}{" "}
                  ago
                </p>
                <p className="text-xs text-gray-400">
                  Updated : {formatDistanceToNow(new Date(notebook.updatedAt))}{" "}
                  ago
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notebooks.map((notebook, index) => (
                <TableRow key={index}>
                  <TableCell
                    className="cursor-pointer hover:underline"
                    onClick={() => router.push(`/notebooks/${notebook.id}`)}
                  >
                    {notebook.title}
                  </TableCell>
                  <TableCell>{notebook.sources}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(notebook.createdAt))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleOpenEdit(index)}>
                          Edit title
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDelete(index)}
                        >
                          Delete notebook
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Title Dialog and Delete AlertDialog */}
      {notebooks.map((notebook, index) => (
        <div key={index}>
          {/* Edit Title Dialog */}
          <Dialog
            open={editIndex === index}
            onOpenChange={(open) => !open && handleCloseEdit()}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit notebook title</DialogTitle>
              </DialogHeader>
              <input
                className="border rounded px-3 py-2 w-full mb-4"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleCloseEdit}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={() => handleRename(notebook?.id)}
                >
                  Rename
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Delete Notebook AlertDialog */}
          <AlertDialog
            open={deleteIndex === index}
            onOpenChange={(open) => !open && handleCloseDelete()}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to delete this notebook?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleCloseDelete}
                  >
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
