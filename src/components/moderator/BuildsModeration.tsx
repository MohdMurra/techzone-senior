import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export function BuildsModeration() {
  const { data: builds, isLoading } = useQuery({
    queryKey: ['moderator-builds'],
    queryFn: async () => {
      const { data: buildsData, error } = await supabase
        .from('builds')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(buildsData?.map(b => b.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      // Combine builds with profiles
      return buildsData?.map(build => ({
        ...build,
        profile: profiles?.find(p => p.id === build.user_id)
      })) || [];
    }
  });

  if (isLoading) return <div>Loading builds...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Builds Management</h2>
        <p className="text-muted-foreground">{builds?.length || 0} total builds</p>
      </div>

      {builds?.map((build) => (
        <Card key={build.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{build.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={build.is_public ? "default" : "secondary"}>
                    {build.is_public ? "Public" : "Private"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {build.likes_count || 0} likes
                  </span>
                </div>
              </div>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {build.description || "No description provided"}
            </p>
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                By {build.profile?.full_name || build.profile?.email || "Unknown"}
              </div>
              <div className="text-muted-foreground">
                {new Date(build.created_at).toLocaleDateString()}
              </div>
            </div>
            {build.total_price && (
              <div className="mt-4 text-lg font-semibold">
                Total: ${build.total_price}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {!builds || builds.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No builds found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
