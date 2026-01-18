import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Share2, 
  ShoppingCart,
  Star,
  TrendingUp,
  Globe,
  MessageCircle
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProductData {
  id: string;
  title: string;
  image: string | null;
  price: string;
  country?: string;
  country_flag?: string;
  specialty?: string;
  supplier?: string;
  moq?: number;
  discount?: number;
  original_price?: string;
  is_verified?: boolean;
  type: 'industry_hub' | 'deal' | 'featured';
}

interface RecommendedProduct {
  id: string;
  title: string;
  image: string | null;
  price: string;
  country?: string;
  country_flag?: string;
  type: 'industry_hub' | 'deal' | 'featured';
}

export default function ProductInsights() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<ProductData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Generate multiple images for the carousel (simulated from the single image)
  const productImages = product?.image 
    ? [
        product.image,
        product.image.replace('w=200', 'w=400'),
        product.image.replace('fit=crop', 'fit=cover'),
      ]
    : ['/placeholder.svg'];

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id, type]);

  const fetchProduct = async () => {
    setLoading(true);
    
    // Determine product type from URL
    const productType = type || 'industry_hub';
    
    if (productType === 'deal') {
      // Fetch from deals table
      const { data: dealData } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (dealData) {
        setProduct({
          id: dealData.id,
          title: dealData.title,
          image: dealData.image,
          price: dealData.price?.toString() || '0',
          supplier: dealData.supplier || undefined,
          moq: dealData.moq || undefined,
          discount: dealData.discount || undefined,
          original_price: dealData.original_price?.toString(),
          is_verified: dealData.is_verified || false,
          type: 'deal'
        });

        // Fetch related deals
        const { data: relatedDeals } = await supabase
          .from('deals')
          .select('id, title, image, price')
          .eq('is_active', true)
          .neq('id', id)
          .limit(6);

        if (relatedDeals) {
          setRelatedProducts(relatedDeals.map(d => ({
            ...d,
            price: d.price?.toString() || '0',
            type: 'deal' as const
          })));
        }
      }
    } else if (productType === 'featured') {
      // Fetch from featured_items table
      const { data: featuredData } = await supabase
        .from('featured_items')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (featuredData) {
        const metadata = featuredData.metadata as { priceRange?: string; supplier?: string; moq?: string } || {};
        setProduct({
          id: featuredData.id,
          title: featuredData.title,
          image: featuredData.image,
          price: metadata.priceRange || 'Contact for price',
          supplier: metadata.supplier,
          type: 'featured'
        });

        // Fetch related featured items
        const { data: relatedFeatured } = await supabase
          .from('featured_items')
          .select('id, title, image, metadata')
          .eq('is_active', true)
          .neq('id', id)
          .limit(6);

        if (relatedFeatured) {
          setRelatedProducts(relatedFeatured.map(f => ({
            id: f.id,
            title: f.title,
            image: f.image,
            price: (f.metadata as { priceRange?: string })?.priceRange || 'Contact',
            type: 'featured' as const
          })));
        }
      }
    } else {
      // Default: Fetch from industry_hub_products
      const { data: productData } = await supabase
        .from('industry_hub_products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (productData) {
        setProduct({
          ...productData,
          type: 'industry_hub'
        });

        // Fetch products from the same country
        const { data: countryProducts } = await supabase
          .from('industry_hub_products')
          .select('id, title, image, price, country, country_flag')
          .eq('country', productData.country)
          .eq('is_active', true)
          .neq('id', id)
          .limit(6);

        if (countryProducts) {
          setRelatedProducts(countryProducts.map(p => ({ ...p, type: 'industry_hub' as const })));
        }
      }
    }

    // Fetch mixed recommendations from all sources
    const [{ data: hubProducts }, { data: dealProducts }] = await Promise.all([
      supabase.from('industry_hub_products').select('id, title, image, price, country, country_flag').eq('is_active', true).limit(4),
      supabase.from('deals').select('id, title, image, price').eq('is_active', true).limit(4)
    ]);

    const mixedRecs: RecommendedProduct[] = [
      ...(hubProducts || []).map(p => ({ ...p, type: 'industry_hub' as const })),
      ...(dealProducts || []).map(d => ({ ...d, price: d.price?.toString() || '0', type: 'deal' as const }))
    ].filter(p => p.id !== id).slice(0, 8);

    setRecommendations(mixedRecs);
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (product) {
      addItem({
        product_id: product.id,
        title: product.title,
        price: parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0,
        image: product.image || '/placeholder.svg',
        quantity: product.moq || 1,
        moq: product.moq || 1,
        unit: 'piece',
        seller_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
        seller_name: product.supplier || 'Alibaba Supplier',
      });
      toast.success('Added to cart!');
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product?.title,
        text: `Check out this product: ${product?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getProductLink = (item: RecommendedProduct) => {
    if (item.type === 'deal') return `/product-insights/deal/${item.id}`;
    if (item.type === 'featured') return `/product-insights/featured/${item.id}`;
    return `/product-insights/${item.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="aspect-square rounded-lg mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground">Product not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Back Navigation */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {/* Product Image Carousel */}
        <div className="relative mb-6">
          <Carousel className="w-full">
            <CarouselContent>
              {productImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={`${product.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>

          {/* Image Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {productImages.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'bg-primary w-6'
                    : 'bg-muted-foreground/30'
                }`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Ready to Ship Badge */}
        <Badge variant="secondary" className="mb-3">Ready to ship</Badge>

        {/* Lower Price Badge */}
        {product.discount && product.discount > 0 && (
          <Badge className="mb-3 ml-2 bg-destructive text-destructive-foreground">
            Lower priced than similar
          </Badge>
        )}

        {/* Product Info */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {product.country && product.country_flag && (
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {product.country_flag} {product.country}
                  </Badge>
                )}
                {product.specialty && <Badge variant="secondary">{product.specialty}</Badge>}
                {product.is_verified && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                    ✓ Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground">
              ${product.price.replace(/[^0-9.]/g, '') || product.price}
            </div>
            {product.original_price && (
              <div className="text-sm text-muted-foreground line-through">
                ${product.original_price}
              </div>
            )}
            {product.moq && (
              <div className="text-sm text-muted-foreground">
                {product.moq} {product.moq === 1 ? 'piece' : 'pieces'}
              </div>
            )}
          </div>

          {/* Simulated Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              4.8 (2.3k reviews)
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              5k+ sold
            </span>
          </div>

          {product.supplier && (
            <div className="text-sm text-muted-foreground">
              Supplier: <span className="font-medium text-foreground">{product.supplier}</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Product details</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="border-border">
              <CardContent className="p-4 space-y-1">
                <p className="text-sm font-medium">Minimum order</p>
                <p className="text-sm text-muted-foreground">
                  {product.moq ? `${product.moq} pcs` : 'Contact supplier'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 space-y-1">
                <p className="text-sm font-medium">Fulfillment</p>
                <p className="text-sm text-muted-foreground">Ready to ship • Sample available • Customizable</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 space-y-1">
                <p className="text-sm font-medium">Trade assurance</p>
                <p className="text-sm text-muted-foreground">Secure payment (demo) • Order protection</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 space-y-1">
                <p className="text-sm font-medium">Support</p>
                <p className="text-sm text-muted-foreground">Chat with supplier • Request quotation</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {product.country_flag && <span className="text-2xl">{product.country_flag}</span>}
                {product.country ? `More from ${product.country}` : 'Related Products'}
              </h2>
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  to={getProductLink(item)}
                  className="group"
                >
                  <Card className="overflow-hidden border-border hover:border-primary/50 transition-colors">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-sm font-medium line-clamp-1 mb-1">{item.title}</h3>
                      <p className="text-primary font-semibold">${item.price}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Products */}
        {recommendations.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recommended for You
              </h2>
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommendations.map((item) => (
                <Link
                  key={item.id}
                  to={getProductLink(item)}
                  className="group"
                >
                  <Card className="overflow-hidden border-border hover:border-primary/50 transition-colors">
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {item.country_flag && (
                        <span className="absolute top-2 left-2 text-lg">
                          {item.country_flag}
                        </span>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-sm font-medium line-clamp-1 mb-1">{item.title}</h3>
                      <p className="text-primary font-semibold text-sm">${item.price}</p>
                      {item.country && <p className="text-xs text-muted-foreground">{item.country}</p>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recently Viewed</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {[...relatedProducts, ...recommendations].slice(0, 6).map((item) => (
              <Link
                key={item.id}
                to={getProductLink(item)}
                className="shrink-0 w-28"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                  <img
                    src={item.image || '/placeholder.svg'}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs font-medium line-clamp-1">{item.title}</p>
                <p className="text-xs text-primary font-semibold">${item.price}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      
      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex items-center gap-3 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          className="shrink-0"
          onClick={() => navigate('/messages')}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to cart
        </Button>
        <Button 
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={handleBuyNow}
        >
          Start order
        </Button>
      </div>
    </div>
  );
}