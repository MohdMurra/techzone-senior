import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { BlogModeration } from "@/components/moderator/BlogModeration";
import { BuildsModeration } from "@/components/moderator/BuildsModeration";
import { CommentsModeration } from "@/components/moderator/CommentsModeration";
import { OrdersView } from "@/components/moderator/OrdersView";

export default function Moderator() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const { data: isModerator, isLoading } = useQuery({
    queryKey: ['moderator-check', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'moderator')
        .maybeSingle();
      return !!data;
    },
    enabled: !!session?.user?.id
  });

  if (!session) {
    return <Navigate to="/auth" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container py-8">Loading...</div>
      </div>
    );
  }

  if (isModerator === false) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container py-8 flex-1">
        <h1 className="text-4xl font-bold mb-2">Moderator Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage content, community builds, and customer support</p>

        <Tabs defaultValue="blogs" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="blogs">Blog Posts</TabsTrigger>
            <TabsTrigger value="builds">User Builds</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="blogs">
            <BlogModeration />
          </TabsContent>

          <TabsContent value="builds">
            <BuildsModeration />
          </TabsContent>

          <TabsContent value="comments">
            <CommentsModeration />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
