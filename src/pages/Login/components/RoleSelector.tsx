import { Selector } from "@/components/common/Selector";
import type { SelectorOption } from "@/components/common/Selector";
import { Gamepad2, Server } from "lucide-react";

interface RoleSelectorProps {
  selected: "player" | "admin";
  onSelect: (role: "player" | "admin") => void;
  className: string;
}

const options: SelectorOption<"player" | "admin">[] = [
  { value: "player", label: "玩家", icon: <Gamepad2 className="w-4 h-4" /> },
  { value: "admin", label: "服主", icon: <Server className="w-4 h-4" />, activeClass: "text-purple-400" },
];

export function RoleSelector({ selected, onSelect, className }: RoleSelectorProps) {
  return (
    <Selector
      options={options}
      value={selected}
      onChange={onSelect}
      className={className}
    />
  );
}
