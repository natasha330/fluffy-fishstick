import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  MapPin, 
  CreditCard, 
  Shield, 
  Package, 
  Edit2 
} from 'lucide-react';
import { ShippingFormData } from './ShippingAddressForm';
import { CardFormData } from './PaymentDetailsForm';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  seller_name?: string;
}

interface OrderReviewProps {
  items: OrderItem[];
  shippingData: ShippingFormData;
  cardData: CardFormData;
  totalAmount: number;
  currency?: string;
  onConfirm: () => void;
  onEditShipping: () => void;
  onEditPayment: () => void;
  isSubmitting?: boolean;
}

function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  return 'Card';
}

export default function OrderReview({
  items,
  shippingData,
  cardData,
  totalAmount,
  currency = 'USD',
  onConfirm,
  onEditShipping,
  onEditPayment,
  isSubmitting = false
}: OrderReviewProps) {
  const cardLastFour = cardData.cardNumber.replace(/\s/g, '').slice(-4);
  const cardBrand = detectCardBrand(cardData.cardNumber);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <img 
                src={item.image || '/placeholder.svg'} 
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h4 className="font-medium line-clamp-1">{item.title}</h4>
                {item.seller_name && (
                  <p className="text-sm text-muted-foreground">{item.seller_name}</p>
                )}
                <p className="text-sm">
                  {currency} {item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="text-right font-semibold">
                {currency} {(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{currency} {totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onEditShipping}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{shippingData.fullName}</p>
            <p>{shippingData.streetAddress}</p>
            <p>{shippingData.city}, {shippingData.stateProvince} {shippingData.postalCode}</p>
            <p>{shippingData.country}</p>
            <Separator className="my-2" />
            <p>📞 {shippingData.phoneNumber}</p>
            <p>✉️ {shippingData.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onEditPayment}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">{cardBrand} ****{cardLastFour}</p>
                <p className="text-sm text-muted-foreground">
                  Expires {cardData.expiryMonth}/{cardData.expiryYear}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              OTP Verified
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
        <Shield className="h-5 w-5 text-primary" />
        <span>
          Your order is protected by our secure checkout. This is a prototype - no real payment will be processed.
        </span>
      </div>

      <Button 
        className="w-full" 
        size="lg" 
        onClick={onConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Processing Order...' : `Place Order - ${currency} ${totalAmount.toFixed(2)}`}
      </Button>
    </div>
  );
}
