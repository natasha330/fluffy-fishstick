import { useState, useEffect } from "react";
import { ChevronRight, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface IndustryHubProduct {
  id: string;
  country: string;
  country_flag: string;
  specialty: string;
  title: string;
  image: string | null;
  price: string;
  product_id: string | null;
}

interface CountryHub {
  country: string;
  flag: string;
  specialty: string;
  products: {
    id: string;
    image: string;
    title: string;
    price: string;
    product_id: string | null;
  }[];
}

export const GlobalIndustryHubs = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryHubs, setCountryHubs] = useState<CountryHub[]>([]);
  const [loading, setLoading] = useState(true);
  const { content } = useSiteContent();

  useEffect(() => {
    fetchIndustryHubProducts();
  }, []);

  const fetchIndustryHubProducts = async () => {
    const { data, error } = await supabase
      .from('industry_hub_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (data && !error) {
      // Group products by country
      const grouped = data.reduce((acc: Record<string, CountryHub>, product: IndustryHubProduct) => {
        if (!acc[product.country]) {
          acc[product.country] = {
            country: product.country,
            flag: product.country_flag,
            specialty: product.specialty,
            products: []
          };
        }
        acc[product.country].products.push({
          id: product.id,
          image: product.image || '/placeholder.svg',
          title: product.title,
          price: product.price,
          product_id: product.product_id
        });
        return acc;
      }, {});
      
      setCountryHubs(Object.values(grouped));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-8 bg-gradient-to-b from-muted/30 to-background">
        <div className="px-4">
          <div className="section-header mb-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="shrink-0 w-20 h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (countryHubs.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-gradient-to-b from-muted/30 to-background">
      <div className="px-4">
        <div className="section-header mb-6">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="section-title">Global Industry Hubs</h2>
          </div>
          <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            Explore all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Country Flags Scroll */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
          {countryHubs.map((hub) => (
            <button
              key={hub.country}
              onClick={() => setSelectedCountry(selectedCountry === hub.country ? null : hub.country)}
              className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 min-w-[80px] ${
                selectedCountry === hub.country
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-card hover:bg-muted border border-border hover:border-primary/50'
              }`}
            >
              <span className="text-3xl">{hub.flag}</span>
              <span className="text-xs font-medium text-center line-clamp-1">{hub.country}</span>
            </button>
          ))}
        </div>

        {/* Selected Country Products */}
        {selectedCountry && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {countryHubs
              .filter((hub) => hub.country === selectedCountry)
              .map((hub) => (
                <div key={hub.country} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{hub.flag}</span>
                    <div>
                      <h3 className="font-bold text-lg">{hub.country}</h3>
                      <p className="text-sm text-muted-foreground">{hub.specialty}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {hub.products.map((product) => (
                      <Link 
                        key={product.id} 
                        to={`/product-insights/${product.id}`}
                        className="group cursor-pointer"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <p className="text-xs font-medium line-clamp-1">{product.title}</p>
                        <p className="text-xs text-primary font-semibold">{product.price}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* All Countries Preview */}
        {!selectedCountry && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {countryHubs.slice(0, 4).map((hub) => (
              <button
                key={hub.country}
                onClick={() => setSelectedCountry(hub.country)}
                className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{hub.flag}</span>
                  <div>
                    <h4 className="font-semibold text-sm">{hub.country}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{hub.specialty}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {hub.products.slice(0, 3).map((product, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded overflow-hidden"
                    >
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
