import * as TabsPrimitive from "@radix-ui/react-tabs";
export const Tabs = TabsPrimitive.Root;
export const TabsList = ({ className = "", ...props }: TabsPrimitive.TabsListProps) => <TabsPrimitive.List className={`tabs-list ${className}`} {...props} />;
export const TabsTrigger = ({ className = "", ...props }: TabsPrimitive.TabsTriggerProps) => <TabsPrimitive.Trigger className={`tabs-trigger ${className}`} {...props} />;
export const TabsContent = TabsPrimitive.Content;
