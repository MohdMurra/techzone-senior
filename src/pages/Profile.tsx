import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, Package, Edit } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", email: "" });

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

  const { data: orders } = useQuery({
    queryKey: ['user-orders', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!session?.user?.id
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string }) => {
      if (!session?.user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.fullName })
        .eq('id', session.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: "Profile updated successfully" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ fullName: editForm.fullName });
  };

  const deleteBuildMutation = useMutation({
    mutationFn: async (buildId: string) => {
      if (!session?.user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from('builds')
        .delete()
        .eq('id', buildId)
        .eq('user_id', session.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-builds'] });
      toast({ title: "Build deleted successfully" });
    },
    onError: (error) => {
      console.error('Delete error:', error);
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
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="builds">My Builds</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Your account details</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setEditForm({ fullName: profile?.full_name || "", email: profile?.email || "" });
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={editForm.email} disabled />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                      </div>
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
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
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Builds Tab */}
            <TabsContent value="builds">

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
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <CardTitle>Order History</CardTitle>
                  </div>
                  <CardDescription>Track your orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Items:</span>
                              <span className="text-sm">{Array.isArray(order.items) ? order.items.length : 0}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>${Number(order.total).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No orders yet</p>
                      <Link to="/products">
                        <Button>Start Shopping</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}