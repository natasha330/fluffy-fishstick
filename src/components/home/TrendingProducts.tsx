import { useState, useEffect } from "react";
import { ChevronRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingMetadata {
  priceRange?: string;
  moq?: string;
  supplier?: string;
  verified?: boolean;
}

interface TrendingItem {
  id: string;
  title: string;
  image: string | null;
  metadata: TrendingMetadata;
}

export const TrendingProducts = () => {
  const [products, setProducts] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { content } = useSiteContent();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('featured_items')
      .select('*')
      .eq('section', 'trending')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(content.trendingProducts?.itemCount || 8);

    if (data) {
      setProducts(data.map(item => ({
        ...item,
        metadata: (item.metadata as TrendingMetadata) || {}
      })));
    }
    setLoading(false);
  };

  if (!content.trendingProducts?.enabled) return null;

  if (loading) {
    return (
      <section className="py-6 px-4">
        <div className="section-header">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 px-4">
      <div className="section-header">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="section-title">{content.trendingProducts?.title || 'Trending Now'}</h2>
        </div>
        <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/product-insights/featured/${product.id}`}
            className="product-card group"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.image || ''}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                {product.title}
              </h3>
              <p className="text-primary font-semibold text-sm mb-1">
                {product.metadata?.priceRange || 'Contact for price'}
              </p>
              <p className="text-xs text-muted-foreground">
                MOQ: {product.metadata?.moq || 'N/A'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-muted-foreground truncate">
                  {product.metadata?.supplier || 'Unknown'}
                </span>
                {product.metadata?.verified && (
                  <span className="shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-[8px]">✓</span>
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
