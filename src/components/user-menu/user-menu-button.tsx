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
      className="cursor-pointer flex items-center gap-2 h-[46px] hover:text-white focus:text-white focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
      {...props}
    >
      <UserAvatar userName={userName} />
      <span className="hidden text-sm font-medium leading-5 md:inline">
        {userName}
      </span>
      <ChevronIndicator isOpen={isOpen} className="hidden md:block" />
    </Button>
  );
});

UserMenuButton.displayName = "UserMenuButton";
