import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { 
  Heart, 
  MessageCircle, 
  Shield, 
  Star, 
  Truck, 
  Building2,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  CreditCard,
  Plus,
  Minus
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  moq: number;
  unit: string;
  images: string[] | null;
  verified: boolean;
  specifications: Json | null;
  seller_id: string;
  category_id: string | null;
}

interface Supplier {
  company_info: string | null;
  year_established: number | null;
  employees: string | null;
  main_markets: string[] | null;
  verified: boolean;
  response_rate: number;
}

interface Profile {
  full_name: string | null;
  company_name: string | null;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (product && user) {
      checkFavorite();
    }
  }, [product, user]);

  useEffect(() => {
    if (product) {
      setQuantity(product.moq || 1);
      // Add to browsing history
      const historyItem = {
        id: product.id,
        slug: product.slug || slug || '',
        title: product.title,
        image: product.images?.[0] || '/placeholder.svg',
        price_min: product.price_min || 0,
        price_max: product.price_max || 0,
      };
      
      const stored = localStorage.getItem('browsingHistory');
      const history = stored ? JSON.parse(stored) : [];
      const filtered = history.filter((h: any) => h.id !== product.id);
      const newHistory = [{ ...historyItem, viewed_at: Date.now() }, ...filtered].slice(0, 20);
      localStorage.setItem('browsingHistory', JSON.stringify(newHistory));
    }
  }, [product, slug]);

  const fetchProduct = async () => {
    const { data: productData, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !productData) {
      navigate('/404');
      return;
    }

    setProduct(productData);

    // Fetch supplier info
    const { data: supplierData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', productData.seller_id)
      .single();
    
    if (supplierData) setSupplier(supplierData);

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('user_id', productData.seller_id)
      .single();
    
    if (profileData) setProfile(profileData);
    
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      product_id: product.id,
      title: product.title,
      image: product.images?.[0] || '/placeholder.svg',
      price: product.price_min || product.price_max || 0,
      quantity,
      moq: product.moq || 1,
      unit: product.unit || 'piece',
      seller_id: product.seller_id,
      seller_name: profile?.company_name || profile?.full_name || 'Seller',
    });
    
    toast({ title: 'Added to inquiry basket' });
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent(`/product/${slug}`));
      return;
    }
    
    if (!product) return;
    navigate(`/checkout?product=${product.id}&qty=${quantity}`);
  };

  const checkFavorite = async () => {
    if (!user || !product) return;
    
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .single();
    
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!product) return;

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);
      
      setIsFavorite(false);
      toast({ title: 'Removed from favorites' });
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: product.id });
      
      setIsFavorite(true);
      toast({ title: 'Added to favorites' });
    }
  };

  const startConversation = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!product) return;

    // Check existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', product.seller_id)
      .eq('product_id', product.id)
      .single();

    if (existing) {
      navigate(`/messages/${existing.id}`);
      return;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        buyer_id: user.id,
        seller_id: product.seller_id,
        product_id: product.id
      })
      .select()
      .single();

    if (newConv) {
      navigate(`/messages/${newConv.id}`);
    } else {
      toast({ 
        title: 'Error', 
        description: 'Could not start conversation',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images?.length ? product.images : ['/placeholder.svg'];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Images */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={images[currentImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={() => setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                      i === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <h1 className="text-2xl font-bold">{product.title}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
                
                {product.verified && (
                  <Badge className="mt-2 bg-amber-100 text-amber-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Product
                  </Badge>
                )}
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div className="text-3xl font-bold text-primary">
                  {product.price_min && product.price_max
                    ? `$${product.price_min.toFixed(2)} - $${product.price_max.toFixed(2)}`
                    : 'Contact for price'
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Min. Order: {product.moq} {product.unit}(s)
                </div>
                
                {/* Quantity Selector */}
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                      disabled={quantity <= (product.moq || 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(product.moq || 1, parseInt(e.target.value) || 1))}
                      className="w-24 text-center"
                      min={product.moq || 1}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleBuyNow}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy Now
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleAddToCart}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Inquiry
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="description">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="specs">Specifications</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {product.description || 'No description available.'}
                  </p>
                </TabsContent>
                <TabsContent value="specs" className="mt-4">
                  {product.specifications && typeof product.specifications === 'object' && !Array.isArray(product.specifications) ? (
                    <div className="border rounded-lg divide-y">
                      {Object.entries(product.specifications as Record<string, unknown>).map(([key, value]) => (
                        <div key={key} className="flex">
                          <div className="w-1/3 p-3 bg-muted font-medium">{key}</div>
                          <div className="w-2/3 p-3">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No specifications available.</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Right: Supplier info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {profile?.company_name || 'Supplier'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier?.verified && (
                  <Badge className="bg-amber-100 text-amber-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Supplier
                  </Badge>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {supplier?.year_established && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Est. {supplier.year_established}</span>
                    </div>
                  )}
                  {supplier?.employees && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.employees}</span>
                    </div>
                  )}
                  {supplier?.response_rate !== undefined && (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.response_rate}% response</span>
                    </div>
                  )}
                </div>
                
                {supplier?.main_markets && supplier.main_markets.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Main Markets</p>
                    <div className="flex flex-wrap gap-1">
                      {supplier.main_markets.map((market, i) => (
                        <Badge key={i} variant="outline">{market}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={startConversation}
                    disabled={user?.id === product.seller_id}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Supplier
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (!user) {
                        navigate('/auth');
                      } else {
                        navigate('/rfq/new', { state: { productId: product.id } });
                      }
                    }}
                  >
                    Send Inquiry
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>Shipping available worldwide</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
