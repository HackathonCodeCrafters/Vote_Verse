import { Badge, Tooltip } from "@chakra-ui/react";

type Props = { executable?: boolean };

export default function ExecuteBadge({ executable }: Props) {
  if (!executable) return null;

  return (
    <Tooltip.Root openDelay={200} closeDelay={100}>
      <Tooltip.Trigger>
        <Badge colorPalette="purple" variant="solid" cursor="help">
          Executable
        </Badge>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>
          Proposal memiliki aksi yang bisa dieksekusi
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}
