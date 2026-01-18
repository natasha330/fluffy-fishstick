import { useState, useEffect } from "react";
import { ChevronRight, Clock, Zap } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/ui/skeleton";

interface Deal {
  id: string;
  title: string;
  image: string | null;
  price: number | null;
  original_price: number | null;
  discount: number | null;
  moq: number | null;
  supplier: string | null;
  is_verified: boolean | null;
  is_flash_deal: boolean | null;
}

export const TopDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const { content } = useSiteContent();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    const { data } = await supabase
      .from('deals')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(content.topDeals?.itemCount || 8);

    if (data) {
      setDeals(data);
    }
    setLoading(false);
  };

  if (!content.topDeals?.enabled) return null;

  if (loading) {
    return (
      <section className="py-6 gradient-deals">
        <div className="section-header px-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 gradient-deals">
      <div className="section-header px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary fill-primary" />
            <h2 className="section-title">{content.topDeals?.title || 'Top Deals'}</h2>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>Ends in 12:45:32</span>
          </div>
        </div>
        <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground px-4 mb-4">Score the lowest prices on Alibaba.com</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4">
        {deals.slice(0, content.topDeals?.itemCount || 8).map((deal) => (
          <ProductCard
            key={deal.id}
            dealId={deal.id}
            image={deal.image || ''}
            title={deal.title}
            price={deal.price?.toString() || '0'}
            originalPrice={deal.original_price?.toString()}
            discount={deal.discount || undefined}
            moq={deal.moq || undefined}
            supplier={deal.supplier || undefined}
            isVerified={deal.is_verified || false}
            isFlashDeal={deal.is_flash_deal || false}
          />
        ))}
      </div>
    </section>
  );
};
