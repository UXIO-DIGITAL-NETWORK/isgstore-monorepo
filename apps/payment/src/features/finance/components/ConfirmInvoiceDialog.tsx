import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ServiceInvoice } from "@/types/service.type";

import { useConfirmServiceInvoice } from "../hooks/useFinance";

interface ConfirmInvoiceDialogProps {
  invoice: ServiceInvoice;
  /** What the client will be missing, phrased as they will see it. */
  missing: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Opened only when preparation is incomplete — it warns, it does not block.
 * Some services genuinely need no installation, so the operator keeps the call.
 *
 * Controlled rather than trigger-owned: the page decides whether pressing
 * Konfirmasi needs a warning at all.
 */
export function ConfirmInvoiceDialog({ invoice, missing, open, onOpenChange }: ConfirmInvoiceDialogProps) {
  const { t } = useTranslation("finance");
  const { mutate: confirm, isPending } = useConfirmServiceInvoice();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("confirmInvoice.title")}</DialogTitle>
          <DialogDescription>
            {t("confirmInvoice.description")}
          </DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-3">
          <Box
            as="ul"
            className="flex flex-col gap-1"
          >
            {missing.map((item) => (
              <Box
                as="li"
                key={item}
              >
                <Text
                  as="span"
                  variant="small"
                >
                  • {item}
                </Text>
              </Box>
            ))}
          </Box>

          <Text
            variant="small"
            className="text-muted-foreground"
          >
            {t("confirmInvoice.optional")}
          </Text>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("confirmInvoice.cancel")}
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => confirm(invoice.id, { onSuccess: () => onOpenChange(false) })}
            >
              {isPending ? t("confirmInvoice.confirming") : t("confirmInvoice.confirm")}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
