// ExecuteDialog.tsx
import React from "react";
import { Dialog, Button } from "@chakra-ui/react";

export default function ExecuteDialog({
  canExecute,
  onExecute,
}: {
  canExecute: boolean;
  onExecute: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      await onExecute();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={!canExecute}>
        Execute Proposal
      </Button>

      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>Konfirmasi Eksekusi</Dialog.Header>
            <Dialog.Body>
              Aksi ini akan menjalankan action on-chain. Lanjutkan?
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button
                colorPalette="purple"
                onClick={handleExecute}
                disabled={loading}
              >
                {loading ? "Executing..." : "Eksekusi"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
