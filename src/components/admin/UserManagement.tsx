import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: 'admin' | 'moderator' | 'customer' }) => {
      // First, remove existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Then, add new role
      const { error } = await supabase.from('user_roles').insert([{ user_id: userId, role }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "User role updated" });
    }
  });

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
            {users?.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-4">{user.id.slice(0, 8)}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.full_name || '-'}</td>
                <td className="p-4">{Array.isArray(user.user_roles) && user.user_roles[0]?.role || 'customer'}</td>
                <td className="p-4">
                  <Select
                    value={Array.isArray(user.user_roles) && user.user_roles[0]?.role || 'customer'}
                    onValueChange={(role: 'admin' | 'moderator' | 'customer') => updateRoleMutation.mutate({ userId: user.id, role })}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
