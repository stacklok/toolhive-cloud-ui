import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerAboutTab } from "./server-about-tab";

interface ServersDetailTabsProps {
  description?: string;
  serverUrl?: string;
  repositoryUrl?: string;
}

export function ServersDetailTabs({
  description,
  serverUrl,
  repositoryUrl,
}: ServersDetailTabsProps) {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList>
        <TabsTrigger
          value="about"
          className="border-none data-[state=active]:bg-accent
                data-[state=active]:text-accent-foreground w-full cursor-pointer
                justify-start py-2 data-[state=active]:shadow-none"
        >
          About
        </TabsTrigger>

        <TabsTrigger
          value="tools"
          disabled // Disabled. No API support yet
          className="border-none data-[state=active]:bg-accent
                data-[state=active]:text-accent-foreground w-full cursor-pointer
                justify-start py-2 data-[state=active]:shadow-none"
        >
          Tools
        </TabsTrigger>
      </TabsList>

      <TabsContent value="about" className="flex-1 space-y-6 mt-5">
        <ServerAboutTab
          description={description}
          serverUrl={serverUrl}
          repositoryUrl={repositoryUrl}
        />
      </TabsContent>

      <TabsContent value="tools" className="flex-1" />
    </Tabs>
  );
}
