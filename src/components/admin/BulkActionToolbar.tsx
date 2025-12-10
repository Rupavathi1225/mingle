import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Copy, Check, X, Trash2 } from "lucide-react";

interface BulkActionToolbarProps {
  totalCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onExportAll: () => void;
  onExportSelected: () => void;
  onCopy: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}

const BulkActionToolbar = ({
  totalCount,
  selectedCount,
  isAllSelected,
  onSelectAll,
  onExportAll,
  onExportSelected,
  onCopy,
  onActivate,
  onDeactivate,
  onDelete,
}: BulkActionToolbarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border mb-4">
      <div className="flex items-center gap-2 mr-4">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
          id="select-all"
        />
        <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
          {selectedCount} of {totalCount} selected
        </label>
      </div>

      <Button variant="outline" size="sm" onClick={onExportAll}>
        <Download className="h-4 w-4 mr-1" />
        Export All CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onExportSelected}
        disabled={selectedCount === 0}
      >
        <Download className="h-4 w-4 mr-1" />
        Export Selected ({selectedCount})
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onCopy}
        disabled={selectedCount === 0}
      >
        <Copy className="h-4 w-4 mr-1" />
        Copy
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onActivate}
        disabled={selectedCount === 0}
        className="text-green-600 hover:text-green-700"
      >
        <Check className="h-4 w-4 mr-1" />
        Activate
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onDeactivate}
        disabled={selectedCount === 0}
        className="text-yellow-600 hover:text-yellow-700"
      >
        <X className="h-4 w-4 mr-1" />
        Deactivate
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={selectedCount === 0}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete ({selectedCount})
      </Button>
    </div>
  );
};

export default BulkActionToolbar;
