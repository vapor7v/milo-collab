import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Container } from '@/components/Layout';
import { WellnessButton } from '@/components/WellnessButton';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const CHECK_IN_TIME = 300; // 5 minutes in seconds

export default function CheckIn() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(CHECK_IN_TIME);

  useEffect(() => {
    if (timeLeft === 0) {
      // In a real app, this would trigger a notification to the trusted contact
      toast.error('Check-in time expired. A notification has been sent to your trusted contact.');
      navigate('/dashboard');
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const handleCheckIn = () => {
    toast.success('Thank you for checking in. We are glad you are safe.');
    navigate('/dashboard');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout background="gradient">
      <Container className="flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-0 rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Safety Check-in</CardTitle>
            <CardDescription>We just want to make sure you're doing okay. Please check in.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-mono text-primary mb-6">{formatTime(timeLeft)}</div>
            <WellnessButton onClick={handleCheckIn} size="lg" className="w-full">
              I am safe
            </WellnessButton>
            <p className="text-xs text-muted-foreground mt-4">If you don't check in before the timer runs out, we will notify your trusted contact as a precaution.</p>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
}
