import { useState, useEffect } from "react";
import { ChevronRight, BadgeCheck, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/ui/skeleton";

interface SupplierMetadata {
  category?: string;
  years?: number;
  location?: string;
  verified?: boolean;
  responseRate?: string;
}

interface FeaturedSupplier {
  id: string;
  title: string;
  image: string | null;
  metadata: SupplierMetadata;
}

export const FeaturedSuppliers = () => {
  const [suppliers, setSuppliers] = useState<FeaturedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { content } = useSiteContent();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('featured_items')
      .select('*')
      .eq('section', 'suppliers')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(content.featuredSuppliers?.itemCount || 6);

    if (data) {
      setSuppliers(data.map(item => ({
        ...item,
        metadata: (item.metadata as SupplierMetadata) || {}
      })));
    }
    setLoading(false);
  };

  if (!content.featuredSuppliers?.enabled) return null;

  if (loading) {
    return (
      <section className="py-6 bg-muted/50">
        <div className="section-header px-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-72 shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-muted/50">
      <div className="section-header px-4">
        <h2 className="section-title">{content.featuredSuppliers?.title || 'Featured Suppliers'}</h2>
        <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="shrink-0 w-72 bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer"
          >
            <div className="h-32 overflow-hidden">
              <img
                src={supplier.image || ''}
                alt={supplier.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-foreground line-clamp-1">{supplier.title}</h3>
                {supplier.metadata?.verified && (
                  <span className="verified-badge shrink-0">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{supplier.metadata?.category || 'General'}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {supplier.metadata?.years || 0} yrs
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {supplier.metadata?.location || 'Unknown'}
                </span>
                <span className="text-primary font-medium">{supplier.metadata?.responseRate || 'N/A'} response</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
