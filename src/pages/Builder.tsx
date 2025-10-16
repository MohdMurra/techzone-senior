import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Plus, Trash2, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BuildComponent {
  category: string;
  productId: string | null;
  product: any | null;
}

interface CompatibilityIssue {
  type: 'error' | 'warning';
  message: string;
  affectedComponents: string[];
}

const componentCategories = [
  { key: 'cpu', label: 'Processor (CPU)', required: true },
  { key: 'motherboard', label: 'Motherboard', required: true },
  { key: 'gpu', label: 'Graphics Card (GPU)', required: false },
  { key: 'ram', label: 'Memory (RAM)', required: true },
  { key: 'storage', label: 'Storage', required: true },
  { key: 'psu', label: 'Power Supply (PSU)', required: true },
  { key: 'case', label: 'Case', required: true },
  { key: 'cooler', label: 'CPU Cooler', required: false },
];

export default function Builder() {
  const { toast } = useToast();
  const [buildName, setBuildName] = useState("My Custom Build");
  const [components, setComponents] = useState<BuildComponent[]>(
    componentCategories.map(cat => ({
      category: cat.key,
      productId: null,
      product: null
    }))
  );

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const { data: availableProducts } = useQuery({
    queryKey: ['builder-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('category', componentCategories.map(c => c.key) as any);
      return data || [];
    }
  });

  const getProductsForCategory = (category: string) => {
    return availableProducts?.filter(p => p.category === category) || [];
  };

  const selectComponent = async (category: string, productId: string) => {
    const product = availableProducts?.find(p => p.id === productId);
    setComponents(prev =>
      prev.map(c =>
        c.category === category
          ? { ...c, productId, product }
          : c
      )
    );
  };

  const removeComponent = (category: string) => {
    setComponents(prev =>
      prev.map(c =>
        c.category === category
          ? { ...c, productId: null, product: null }
          : c
      )
    );
  };

  const checkCompatibility = (): CompatibilityIssue[] => {
    const issues: CompatibilityIssue[] = [];
    const cpu = components.find(c => c.category === 'cpu')?.product;
    const motherboard = components.find(c => c.category === 'motherboard')?.product;
    const ram = components.find(c => c.category === 'ram')?.product;
    const gpu = components.find(c => c.category === 'gpu')?.product;
    const psu = components.find(c => c.category === 'psu')?.product;
    const pcCase = components.find(c => c.category === 'case')?.product;
    const cooler = components.find(c => c.category === 'cooler')?.product;

    // CPU and Motherboard socket compatibility
    if (cpu && motherboard) {
      const cpuSocket = cpu.specs?.socket;
      const mbSocket = motherboard.specs?.socket;
      if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
        issues.push({
          type: 'error',
          message: `CPU socket (${cpuSocket}) does not match motherboard socket (${mbSocket})`,
          affectedComponents: ['cpu', 'motherboard']
        });
      }
    }

    // RAM type compatibility
    if (ram && motherboard) {
      const ramType = ram.specs?.type;
      const mbRamType = motherboard.specs?.ram_type;
      if (ramType && mbRamType && ramType !== mbRamType) {
        issues.push({
          type: 'error',
          message: `RAM type (${ramType}) does not match motherboard support (${mbRamType})`,
          affectedComponents: ['ram', 'motherboard']
        });
      }
    }

    // PSU wattage check
    if (psu && (cpu || gpu)) {
      const psuWattage = psu.specs?.wattage || 0;
      const cpuTdp = cpu?.specs?.tdp || 0;
      const gpuTdp = gpu?.specs?.tdp || 0;
      const totalTdp = cpuTdp + gpuTdp;
      const recommendedWattage = totalTdp * 1.5; // 50% headroom

      if (psuWattage < recommendedWattage) {
        issues.push({
          type: 'warning',
          message: `PSU wattage (${psuWattage}W) may be insufficient. Recommended: ${Math.ceil(recommendedWattage)}W`,
          affectedComponents: ['psu']
        });
      }
    }

    // GPU clearance in case
    if (gpu && pcCase) {
      const gpuLength = gpu.specs?.length ? parseInt(gpu.specs.length) : 0;
      const caseClearance = pcCase.specs?.gpu_clearance ? parseInt(pcCase.specs.gpu_clearance) : 0;
      if (gpuLength > 0 && caseClearance > 0 && gpuLength > caseClearance) {
        issues.push({
          type: 'error',
          message: `GPU (${gpuLength}mm) exceeds case clearance (${caseClearance}mm)`,
          affectedComponents: ['gpu', 'case']
        });
      }
    }

    // Cooler height vs case clearance
    if (cooler && pcCase) {
      const coolerHeight = cooler.specs?.height ? parseInt(cooler.specs.height) : 0;
      const caseHeight = pcCase.specs?.cpu_cooler_height ? parseInt(pcCase.specs.cpu_cooler_height) : 0;
      if (coolerHeight > 0 && caseHeight > 0 && coolerHeight > caseHeight) {
        issues.push({
          type: 'error',
          message: `CPU cooler (${coolerHeight}mm) exceeds case clearance (${caseHeight}mm)`,
          affectedComponents: ['cooler', 'case']
        });
      }
    }

    return issues;
  };

  const getTotalPrice = () => {
    return components.reduce((sum, c) => {
      if (c.product) {
        const price = c.product.sale_price || c.product.price;
        return sum + Number(price);
      }
      return sum;
    }, 0);
  };

  const saveBuild = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your build",
        variant: "destructive"
      });
      return;
    }

    const componentsData = components.reduce((acc, c) => {
      if (c.productId && c.product) {
        acc[c.category] = {
          id: c.productId,
          name: c.product.name,
          price: c.product.sale_price || c.product.price
        };
      }
      return acc;
    }, {} as any);

    const { error } = await supabase
      .from('builds')
      .insert({
        user_id: session.user.id,
        name: buildName,
        components: componentsData,
        total_price: getTotalPrice(),
        is_public: false
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save build",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Build saved!",
        description: "Your build has been saved to your profile"
      });
    }
  };

  const compatibilityIssues = checkCompatibility();
  const hasErrors = compatibilityIssues.some(i => i.type === 'error');
  const totalPrice = getTotalPrice();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">PC Builder</h1>
          <p className="text-muted-foreground">
            Build your custom PC with intelligent compatibility checking
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Component Selection */}
          <div className="lg:col-span-2 space-y-4">
            {componentCategories.map((category) => {
              const component = components.find(c => c.category === category.key);
              const hasIssue = compatibilityIssues.some(i =>
                i.affectedComponents.includes(category.key)
              );

              return (
                <Card key={category.key} className={hasIssue ? 'border-destructive' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {category.label}
                          {category.required && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                        </CardTitle>
                        {component?.product && (
                          <CardDescription className="mt-1">
                            {component.product.name} - ${Number(component.product.sale_price || component.product.price).toFixed(2)}
                          </CardDescription>
                        )}
                      </div>
                      {component?.productId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeComponent(category.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!component?.productId ? (
                      <Select
                        onValueChange={(value) => selectComponent(category.key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${category.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {getProductsForCategory(category.key).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ${Number(product.sale_price || product.price).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <img
                            src={component.product.image_url || '/placeholder.svg'}
                            alt={component.product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{component.product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${Number(component.product.sale_price || component.product.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Build Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Build Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Build Name</label>
                    <input
                      type="text"
                      value={buildName}
                      onChange={(e) => setBuildName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Total Price:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {components.filter(c => c.productId).length} / {componentCategories.length} components selected
                    </div>
                  </div>

                  {compatibilityIssues.length > 0 && (
                    <div className="space-y-2">
                      {compatibilityIssues.map((issue, idx) => (
                        <Alert key={idx} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                          {issue.type === 'error' ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          <AlertDescription className="text-xs">
                            {issue.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {compatibilityIssues.length === 0 && components.some(c => c.productId) && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-xs">
                        All components are compatible!
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2 pt-4">
                    <Button
                      className="w-full"
                      onClick={saveBuild}
                      disabled={!session}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Build
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={hasErrors || totalPrice === 0}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add All to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
