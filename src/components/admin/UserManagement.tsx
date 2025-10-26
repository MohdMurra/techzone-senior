import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";

export const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        toast({ 
          title: "Error loading users", 
          description: error.message, 
          variant: "destructive" 
        });
        return [];
      }
      
      return data || [];
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: 'admin' | 'moderator' | 'customer' }) => {
      // First, remove existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Then, add new role if not customer (customer is default, no entry needed)
      if (role !== 'customer') {
        const { error } = await supabase.from('user_roles').insert([{ user_id: userId, role }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "User role updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "User deleted successfully", description: "The user can no longer log in." });
      setDeletingUserId(null);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete user", 
        description: error.message, 
        variant: "destructive" 
      });
      setDeletingUserId(null);
    }
  });

  const getCurrentUserRole = (user: any) => {
    return Array.isArray(user.user_roles) && user.user_roles[0]?.role || 'customer';
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        <div className="text-center py-8">Loading users...</div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="space-y-4 mt-6">
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No users found. Users will appear here when they sign up.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="border rounded-lg overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left">User ID</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const currentRole = getCurrentUserRole(user);
              return (
                <tr key={user.id} className="border-b hover:bg-muted/30">
                  <td className="p-4 font-mono text-sm">{user.id.slice(0, 8)}...</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{user.full_name || '-'}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentRole === 'admin' ? 'bg-primary/10 text-primary' :
                      currentRole === 'moderator' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {currentRole}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Select
                        value={currentRole}
                        onValueChange={(role: 'admin' | 'moderator' | 'customer') => 
                          updateRoleMutation.mutate({ userId: user.id, role })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            disabled={deleteUserMutation.isPending && deletingUserId === user.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{user.email}</strong>? 
                              This action cannot be undone. The user will be permanently removed and 
                              will not be able to log in until they register again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setDeletingUserId(user.id);
                                deleteUserMutation.mutate(user.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
