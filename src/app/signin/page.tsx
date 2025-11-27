import { ToolHiveIcon } from "@/components/icons";
import { OIDC_PROVIDER_ID } from "@/lib/auth/constants";
import { SignInButton } from "./signin-button";

export default function SignInPage() {
  return (
    <div className="flex h-screen w-full">
      <div className="hidden md:flex w-1/2 bg-muted/80 border-r border-border items-start p-10">
        <div className="flex items-center gap-4">
          <ToolHiveIcon className="size-8 shrink-0" />
          <h1 className="text-4xl font-bold tracking-tight">ToolHive</h1>
        </div>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-6 w-full max-w-[350px]">
          <div className="flex flex-col items-center space-y-2 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Sign in using your company credentials
            </p>
          </div>

          <SignInButton providerId={OIDC_PROVIDER_ID} />
        </div>
      </div>
    </div>
  );
}
