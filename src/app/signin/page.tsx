import Image from "next/image";
import { OIDC_PROVIDER_ID } from "@/lib/auth/constants";
import { SignInButton } from "./signin-button";

export default function SignInPage() {
  return (
    <div className="relative flex h-screen w-full bg-nav-background md:bg-transparent">
      {/* Background pattern — visible on mobile full-screen, on desktop only left panel */}
      <Image
        src="/bg-pattern-light.png"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none select-none object-fill dark:hidden md:hidden"
      />
      <Image
        src="/bg-pattern-dark.png"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none select-none hidden object-fill dark:block md:!hidden"
      />

      {/* Left panel — desktop only */}
      <div className="relative hidden md:flex w-1/2 bg-nav-background items-start p-10 overflow-hidden border-r border-border">
        <Image
          src="/bg-pattern-light.png"
          alt=""
          fill
          sizes="50vw"
          className="pointer-events-none select-none object-fill dark:hidden"
        />
        <Image
          src="/bg-pattern-dark.png"
          alt=""
          fill
          sizes="50vw"
          className="pointer-events-none select-none hidden object-fill dark:block"
        />
        <Image
          src="/toolhive-logo.svg"
          alt="ToolHive"
          width={251}
          height={53}
          className="relative z-10"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Sign-in form — mobile: over teal bg, desktop: white panel */}
      <div className="relative z-10 flex w-full md:w-1/2 flex-col items-center justify-center p-8 md:bg-background">
        {/* Mobile logo */}
        <Image
          src="/toolhive-logo.svg"
          alt="ToolHive"
          width={251}
          height={53}
          className="absolute top-10 left-10 md:hidden"
          loading="eager"
          fetchPriority="high"
        />

        <div className="flex flex-col items-center space-y-6 w-full max-w-[350px]">
          <div className="flex flex-col items-center space-y-2 text-center">
            <h2 className="font-serif text-5xl font-light tracking-tight text-white md:text-foreground">
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
