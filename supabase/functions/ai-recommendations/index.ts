import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentProduct, cartItems, browsingHistory, allProducts } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context for AI
    interface ProductInfo {
      id: string;
      name: string;
      category: string;
      price: number;
    }

    const cartCategories = cartItems?.map((item: { category: string }) => item.category) || [];
    const recentlyViewedItems = browsingHistory?.slice(0, 5).map((item: { name: string; category: string }) => ({
      name: item.name,
      category: item.category
    })) || [];
    const availableProductsList: ProductInfo[] = allProducts?.map((p: ProductInfo) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price
    })) || [];

    const currentProductInfo = currentProduct ? `Currently viewing: ${currentProduct.name} (${currentProduct.category})` : '';
    const cartInfo = cartCategories.length > 0 ? `Cart categories: ${cartCategories.join(', ')}` : '';
    const recentlyViewedInfo = recentlyViewedItems.length > 0 ? `Recently viewed: ${recentlyViewedItems.map((p: { name: string }) => p.name).join(', ')}` : '';
    const productsListStr = availableProductsList.map((p: ProductInfo) => `- ${p.id}: ${p.name} (${p.category}) - $${p.price}`).join('\n');

    const prompt = `You are a PC hardware recommendation expert. Based on the user's context, recommend 4-6 products that would complement their current selection or interests.

Context:
${currentProductInfo}
${cartInfo}
${recentlyViewedInfo}

Available products:
${productsListStr}

Return ONLY a JSON array of product IDs that you recommend, like: ["id1", "id2", "id3"]
Consider compatibility, complementary products, and user preferences. For example:
- If viewing a CPU, recommend compatible motherboards and coolers
- If cart has GPU, recommend PSU with enough wattage
- Suggest peripherals if main components are covered`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful PC hardware expert. Always respond with valid JSON arrays only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const recommendedIds = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    console.log('AI recommendations:', recommendedIds);

    return new Response(JSON.stringify({ recommendedIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
