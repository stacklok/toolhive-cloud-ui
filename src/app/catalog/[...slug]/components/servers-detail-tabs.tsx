import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerDetailContent } from "./server-detail-content";

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
        {/* Disabled. Currently the api is not supporting it */}
        <TabsTrigger
          value="tools"
          disabled
          className="border-none data-[state=active]:bg-accent
                data-[state=active]:text-accent-foreground w-full cursor-pointer
                justify-start py-2 data-[state=active]:shadow-none"
        >
          Tools
        </TabsTrigger>
      </TabsList>

      <TabsContent value="about" className="flex-1 space-y-6 mt-5">
        <ServerDetailContent
          description={description}
          serverUrl={serverUrl}
          repositoryUrl={repositoryUrl}
        />
      </TabsContent>

      <TabsContent value="tools" className="flex-1" />
    </Tabs>
  );
}
