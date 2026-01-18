import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Lock, Shield } from 'lucide-react';

const cardSchema = z.object({
  cardholderName: z.string().min(3, 'Cardholder name is required'),
  cardNumber: z.string()
    .min(16, 'Card number must be 16 digits')
    .max(19, 'Invalid card number')
    .regex(/^[\d\s]+$/, 'Invalid card number'),
  expiryMonth: z.string()
    .min(1, 'Required')
    .max(2, 'Invalid')
    .regex(/^(0[1-9]|1[0-2])$/, 'Use 01-12'),
  expiryYear: z.string()
    .length(2, 'Use YY format')
    .regex(/^\d{2}$/, 'Invalid year'),
  cvv: z.string()
    .min(3, 'CVV must be 3-4 digits')
    .max(4, 'CVV must be 3-4 digits')
    .regex(/^\d+$/, 'CVV must be numeric'),
});

export type CardFormData = z.infer<typeof cardSchema>;

interface PaymentDetailsFormProps {
  amount: number;
  currency?: string;
  onSubmit: (data: CardFormData) => void;
  onBack: () => void;
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

function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
}

export default function PaymentDetailsForm({
  amount,
  currency = 'USD',
  onSubmit,
  onBack,
  isSubmitting = false
}: PaymentDetailsFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
  });

  const cardNumber = watch('cardNumber') || '';
  const cardBrand = detectCardBrand(cardNumber);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setValue('cardNumber', formatted);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Secure payment processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Amount to Pay</div>
          <div className="text-3xl font-bold">{currency} {amount.toFixed(2)}</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              placeholder="JOHN DOE"
              {...register('cardholderName')}
              className="uppercase"
            />
            {errors.cardholderName && (
              <p className="text-sm text-destructive">{errors.cardholderName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                {...register('cardNumber')}
                onChange={handleCardNumberChange}
                className="pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                {cardBrand}
              </span>
            </div>
            {errors.cardNumber && (
              <p className="text-sm text-destructive">{errors.cardNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month</Label>
              <Input
                id="expiryMonth"
                placeholder="MM"
                maxLength={2}
                {...register('expiryMonth')}
              />
              {errors.expiryMonth && (
                <p className="text-sm text-destructive">{errors.expiryMonth.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year</Label>
              <Input
                id="expiryYear"
                placeholder="YY"
                maxLength={2}
                {...register('expiryYear')}
              />
              {errors.expiryYear && (
                <p className="text-sm text-destructive">{errors.expiryYear.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                type="password"
                maxLength={4}
                {...register('cvv')}
              />
              {errors.cvv && (
                <p className="text-sm text-destructive">{errors.cvv.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <Shield className="h-4 w-4" />
            <span>Your payment information is secure</span>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Continue to Verification'}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={onBack}>
              Back to Shipping
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
