import { useState } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RecapDialog } from "./RecapDialog";

/** Opens the daily/monthly recap report (product_requirements.md §4.3). */
export function RecapButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        onClick={() => setOpen(true)}
      >
        <FileText />
        Recap
      </Button>
      <RecapDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
