import { useCompare } from "@/contexts/CompareContext";
import { Button } from "@/components/ui/button";
import { X, GitCompare, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CompareDrawer() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">
              Compare ({compareItems.length}/4)
            </span>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto">
            {compareItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 min-w-fit"
              >
                <img
                  src={item.image_url || '/placeholder.svg'}
                  alt={item.name}
                  className="w-8 h-8 object-cover rounded"
                />
                <span className="text-xs font-medium truncate max-w-[100px]">
                  {item.name}
                </span>
                <button
                  onClick={() => removeFromCompare(item.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompare}
              className="text-muted-foreground"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/compare')}
              disabled={compareItems.length < 2}
            >
              Compare Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
