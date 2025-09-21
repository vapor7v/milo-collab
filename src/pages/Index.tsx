import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Container } from '@/components/Layout';
import { WellnessButton } from '@/components/WellnessButton';
import { Card } from '@/components/ui/card';
import { ArrowRight, MessageSquare, PieChart, ShieldCheck } from 'lucide-react';

const HowItWorksStep = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="text-center px-4">
    <div className="inline-block bg-primary/10 p-4 rounded-full mb-4 text-primary">{icon}</div>
    <h3 className="font-bold text-lg text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const Benefit = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary">{icon}</div>
    <div>
      <h3 className="font-bold text-lg text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default function Index() {
  const navigate = useNavigate();

  return (
    <Layout>
      <header className="absolute top-0 left-0 right-0 p-4 bg-transparent z-10">
        <Container className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Milo</h1>
          <WellnessButton variant="ghost" onClick={() => navigate('/auth')}>Log In</WellnessButton>
        </Container>
      </header>

      {/* Hero Section */}
      <Container className="text-center py-24 lg:py-32 mt-12 animate-fade-in">
        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-4 text-primary">Your Mental Wellness Journey Starts Here</h1>
        <p className="max-w-2xl mx-auto text-lg lg:text-xl text-muted-foreground mb-10">
          Milo is a safe and supportive space for you to understand your feelings, build healthy habits, and get the support you need, whenever you need it.
        </p>
        <WellnessButton size="xl" className="px-8 py-7 text-lg group" onClick={() => navigate('/auth')}>Start Your Journey for Free <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" /></WellnessButton>
      </Container>

      {/* How It Works Section */}
      <Container className="py-16 lg:py-24 bg-muted/50 rounded-2xl">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">How Milo Works</h2>
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <HowItWorksStep icon={<PieChart className="w-8 h-8" />} title="1. Quick Assessment" description="Take a brief, confidential assessment to get a snapshot of your current mental wellness." />
          <HowItWorksStep icon={<MessageSquare className="w-8 h-8" />} title="2. AI-Powered Chat" description="Chat with Milo, your AI companion, for personalized insights, coping strategies, and a listening ear." />
          <HowItWorksStep icon={<ShieldCheck className="w-8 h-8" />} title="3. Personalized Plan" description="Receive a custom plan with evidence-based activities and resources to help you thrive." />
        </div>
      </Container>

      {/* Why Milo? Section */}
      <Container className="py-16 lg:py-24">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">Why Milo?</h2>
            <Benefit icon={<ShieldCheck className="w-6 h-6" />} title="Safe & Confidential" description="Your privacy is our top priority. Chat freely in an encrypted, judgment-free space." />
            <Benefit icon={<PieChart className="w-6 h-6" />} title="Personalized for You" description="Milo learns about your needs and provides tailored support and resources just for you." />
            <Benefit icon={<MessageSquare className="w-6 h-6" />} title="Available 24/7" description="Milo is always here to listen and help, any time of day or night." />
          </div>
          <Card className="bg-primary/10 border-0 rounded-2xl p-8 lg:p-10 text-center shadow-lg transform hover:scale-105 transition-transform">
            <h3 className="text-2xl font-bold text-foreground mb-4">Ready to feel better?</h3>
            <p className="text-muted-foreground mb-6">Take the first step towards a healthier, happier you. Milo is here to help you on your journey.</p>
            <WellnessButton size="lg" onClick={() => navigate('/auth')}>Get Started Now</WellnessButton>
          </Card>
        </div>
      </Container>

      {/* Footer */}
      <footer className="py-10 border-t">
          <Container className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Milo. All rights reserved.</p>
              <div className="flex gap-4 mt-4 md:mt-0">
                  <a href="#" className="hover:text-primary">Privacy Policy</a>
                  <a href="#" className="hover:text-primary">Terms of Service</a>
              </div>
          </Container>
      </footer>
    </Layout>
  );
}
