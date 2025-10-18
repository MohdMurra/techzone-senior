import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Heart, ExternalLink } from "lucide-react";

export default function Builds() {
  const { data: publicBuilds } = useQuery({
    queryKey: ['public-builds'],
    queryFn: async () => {
      const { data } = await supabase
        .from('builds')
        .select('*')
        .eq('is_public', true)
        .order('likes_count', { ascending: false });
      return data || [];
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Builds</h1>
          <p className="text-muted-foreground">
            Explore PC builds created by our community
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicBuilds && publicBuilds.length > 0 ? (
            publicBuilds.map((build) => (
              <Card key={build.id}>
                <CardHeader>
                  <CardTitle>{build.name}</CardTitle>
                  {build.description && (
                    <CardDescription>{build.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">
                        ${build.total_price ? Number(build.total_price).toFixed(2) : '0.00'}
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        <span>{build.likes_count || 0}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(build.created_at).toLocaleDateString()}
                    </div>

                    <Link to={`/builder?load=${build.id}`}>
                      <Button className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Build
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No public builds yet</p>
              <Link to="/builder">
                <Button>Create Your First Build</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}