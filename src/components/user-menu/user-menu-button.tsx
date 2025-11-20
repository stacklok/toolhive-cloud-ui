import type { ComponentPropsWithoutRef } from "react";
import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronIndicator } from "@/components/ui/chevron-indicator";
import { UserAvatar } from "./user-avatar";

interface UserMenuButtonProps extends ComponentPropsWithoutRef<"button"> {
  userName: string;
  isOpen: boolean;
}

export const UserMenuButton = forwardRef<
  HTMLButtonElement,
  UserMenuButtonProps
>(({ userName, isOpen, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      className="flex items-center gap-2"
      {...props}
    >
      <UserAvatar userName={userName} />
      <span className="text-sm font-medium leading-5 text-secondary-foreground">
        {userName}
      </span>
      <ChevronIndicator isOpen={isOpen} />
    </Button>
  );
});

UserMenuButton.displayName = "UserMenuButton";
