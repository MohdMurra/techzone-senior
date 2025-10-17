import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export const OrderManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Fetch user emails separately
      const ordersWithEmails = await Promise.all((data || []).map(async (order) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', order.user_id)
          .single();
        return { ...order, userEmail: profile?.email };
      }));
      
      return ordersWithEmails;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'paid' }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: "Order status updated" });
    }
  });

  return (
    <div className="space-y-4 mt-6">
      <div className="border rounded-lg overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left">Order ID</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="p-4">{order.id.slice(0, 8)}</td>
                <td className="p-4">{order.userEmail}</td>
                <td className="p-4">${Number(order.total).toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <Select
                    value={order.status}
                    onValueChange={(status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'paid') => updateStatusMutation.mutate({ id: order.id, status })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
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
