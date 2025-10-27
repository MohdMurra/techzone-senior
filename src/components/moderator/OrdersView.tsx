import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OrdersView() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['moderator-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Orders (Read-Only)</h2>
        <p className="text-muted-foreground">{orders?.length || 0} total orders</p>
      </div>

      {orders?.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">Order #{order.id.slice(0, 8)}</CardTitle>
                <Badge variant={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${order.total}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Customer:</span>{" "}
                {order.profiles?.full_name || order.profiles?.email || "Unknown"}
              </div>
              <div>
                <span className="font-medium">Shipping Address:</span>{" "}
                {typeof order.shipping_address === 'object' && order.shipping_address !== null ? (
                  <span>
                    {(order.shipping_address as any).street}, {(order.shipping_address as any).city}, {(order.shipping_address as any).state} {(order.shipping_address as any).zip}
                  </span>
                ) : (
                  "N/A"
                )}
              </div>
              <div>
                <span className="font-medium">Items:</span> {Array.isArray(order.items) ? order.items.length : 0} item(s)
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {!orders || orders.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No orders found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
