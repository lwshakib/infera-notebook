import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@clerk/nextjs";

interface HeaderProps {
  notebookTitle?: string;
  notebookId?: string;
}

const Header = ({
  notebookTitle = "Untitled Notebook",
  notebookId = "",
}: HeaderProps) => {
  return (
    <div className="mx-4">
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">{notebookTitle}</h1>
          <span className="text-sm text-muted-foreground">
            ID: {notebookId}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <ModeToggle />
          <UserButton />
        </div>
      </div>
    </div>
  );
};

export default Header;
