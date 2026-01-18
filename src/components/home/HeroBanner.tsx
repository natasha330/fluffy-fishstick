import { Search, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
interface Category {
  id: string;
  name: string;
  slug: string;
}

export const HeroBanner = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();
  const { content } = useSiteContent();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .is('parent_id', null)
        .limit(6);
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (!content.heroBanner?.enabled) return null;

  return (
    <section className="relative bg-gradient-to-br from-primary/90 via-primary to-orange-600 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {content.heroBanner?.backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${content.heroBanner.backgroundImage})` }}
        />
      )}

      <div className="relative container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Logo" className="h-10 md:h-14 w-auto brightness-0 invert" />
          </div>
          {/* Headline */}
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight px-2">
            {content.heroBanner?.title || 'The leading B2B ecommerce platform for global trade'}
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-white/90 px-4">
            {content.heroBanner?.subtitle || 'Connect with verified suppliers, discover millions of products'}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto px-2">
            <div className="flex bg-white rounded-lg shadow-2xl overflow-hidden">
              <select className="hidden md:block px-4 py-4 text-foreground bg-muted border-r text-sm font-medium min-w-[150px]">
                <option>All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder={content.heroBanner?.searchPlaceholder || "Search for products, suppliers, or categories..."}
                  className="w-full border-0 py-6 px-4 text-foreground text-base focus-visible:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground px-3">
                <Camera className="h-5 w-5" />
              </Button>
              <Button type="submit" className="rounded-none px-8 text-base font-semibold">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {/* Popular Searches */}
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="text-white/70">Popular:</span>
            {["LED Lights", "Power Tools", "Office Chairs", "Phone Cases", "Solar Panels"].map((term) => (
              <button
                key={term}
                onClick={() => navigate(`/products?search=${encodeURIComponent(term)}`)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { value: "200M+", label: "Products" },
            { value: "200K+", label: "Suppliers" },
            { value: "5.8K+", label: "Product Categories" },
            { value: "200+", label: "Countries" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
