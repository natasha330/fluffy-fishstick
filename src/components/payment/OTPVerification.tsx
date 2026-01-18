import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Shield, RefreshCw } from 'lucide-react';

interface OTPVerificationProps {
  onVerified: () => void;
  onResend: () => void;
  processing?: boolean;
  codeLength?: number;
}

export default function OTPVerification({ 
  onVerified, 
  onResend, 
  processing = false,
  codeLength = 6 
}: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(new Array(codeLength).fill(''));
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, codeLength);
    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length !== codeLength) {
      setError('Please enter all digits');
      return;
    }
    
    // Demo mode - accept any 6-digit code
    // In production, verify against backend
    if (code.length === codeLength) {
      onVerified();
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };

  const handleResend = () => {
    setResendTimer(30);
    setOtp(new Array(codeLength).fill(''));
    setError('');
    onResend();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>OTP Verification</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to your registered phone number
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-bold"
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-2">Demo Mode: Enter any 6 digits to continue</p>
          {resendTimer > 0 ? (
            <p>Resend code in <span className="font-medium">{resendTimer}s</span></p>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResend}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Resend Code
            </Button>
          )}
        </div>

        <Button 
          className="w-full" 
          onClick={handleVerify}
          disabled={processing || otp.some(d => !d)}
        >
          {processing ? 'Verifying...' : 'Verify & Complete Payment'}
        </Button>
      </CardContent>
    </Card>
  );
}
