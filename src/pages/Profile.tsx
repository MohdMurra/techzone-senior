import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id
  });

  const { data: builds } = useQuery({
    queryKey: ['user-builds', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data } = await supabase
        .from('builds')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!session?.user?.id
  });

  const deleteBuildMutation = useMutation({
    mutationFn: async (buildId: string) => {
      const { error } = await supabase
        .from('builds')
        .delete()
        .eq('id', buildId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-builds'] });
      toast({ title: "Build deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete build", variant: "destructive" });
    }
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
  };

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <p className="text-muted-foreground">{profile?.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <p className="text-muted-foreground capitalize">{profile?.role || 'customer'}</p>
              </div>
              <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Builds ({builds?.length || 0})</CardTitle>
              <CardDescription>PC builds you've saved</CardDescription>
            </CardHeader>
            <CardContent>
              {builds && builds.length > 0 ? (
                <div className="space-y-4">
                  {builds.map((build) => (
                    <div key={build.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{build.name}</h3>
                          {build.description && (
                            <p className="text-sm text-muted-foreground">{build.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/builder?load=${build.id}`}>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Load
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBuildMutation.mutate(build.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Price:</span>{' '}
                          <span className="font-semibold">
                            ${build.total_price ? Number(build.total_price).toFixed(2) : '0.00'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Visibility:</span>{' '}
                          <span className="font-semibold">{build.is_public ? 'Public' : 'Private'}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Created: {new Date(build.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't saved any builds yet</p>
                  <Link to="/builder">
                    <Button>Start Building</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}