import Image from "next/image";
import { OIDC_PROVIDER_ID } from "@/lib/auth/constants";
import { SignInButton } from "./signin-button";

export default function SignInPage() {
  return (
    <div className="relative flex h-screen w-full bg-[#265763] dark:bg-[#102930] md:bg-transparent md:dark:bg-transparent">
      {/* Background pattern — visible on mobile full-screen, on desktop only left panel */}
      <Image
        src="/bg-pattern-light.png"
        alt=""
        fill
        className="object-fill dark:hidden md:hidden"
        priority
      />
      <Image
        src="/bg-pattern-dark.png"
        alt=""
        fill
        className="hidden object-fill dark:block md:!hidden"
        priority
      />

      {/* Left panel — desktop only */}
      <div className="relative hidden md:flex w-1/2 bg-[#265763] dark:bg-[#102930] items-start p-10 overflow-hidden border-r border-border">
        <Image
          src="/bg-pattern-light.png"
          alt=""
          fill
          className="object-fill dark:hidden"
          priority
        />
        <Image
          src="/bg-pattern-dark.png"
          alt=""
          fill
          className="hidden object-fill dark:block"
          priority
        />
        <Image
          src="/toolhive-logo.png"
          alt="ToolHive"
          width={183}
          height={38}
          className="relative z-10"
          priority
        />
      </div>

      {/* Sign-in form — mobile: over teal bg, desktop: white panel */}
      <div className="relative z-10 flex w-full md:w-1/2 flex-col items-center justify-center p-8 md:bg-background">
        {/* Mobile logo */}
        <Image
          src="/toolhive-logo.png"
          alt="ToolHive"
          width={183}
          height={38}
          className="absolute top-10 left-10 md:hidden"
          priority
        />

        <div className="flex flex-col items-center space-y-6 w-full max-w-[350px]">
          <div className="flex flex-col items-center space-y-2 text-center">
            <h2 className="text-page-title text-white md:text-foreground">
              Sign in
            </h2>
            <p className="text-sm text-white/70 md:text-muted-foreground">
              Sign in using your company credentials
            </p>
          </div>

          <SignInButton providerId={OIDC_PROVIDER_ID} />
        </div>
      </div>
    </div>
  );
}
