import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Container } from '@/components/Layout';
import { WellnessButton } from '@/components/WellnessButton';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';

const therapists = [
  {
    name: 'Dr. Sarah Johnson, PhD',
    specialty: 'Cognitive Behavioral Therapy (CBT)',
    phone: '123-456-7890',
    email: 's.johnson@therapy.com',
    avatar: 'SJ'
  },
  {
    name: 'Dr. Michael Chen, PsyD',
    specialty: 'Anxiety & Stress Management',
    phone: '123-456-7891',
    email: 'm.chen@therapy.com',
    avatar: 'MC'
  },
    {
    name: 'Dr. Emily Rodriguez, LMFT',
    specialty: 'Couples & Family Therapy',
    phone: '123-456-7892',
    email: 'e.rodriguez@therapy.com',
    avatar: 'ER'
  },
  {
    name: 'Dr. David Lee, LPC',
    specialty: 'Depression & Mood Disorders',
    phone: '123-456-7893',
    email: 'd.lee@therapy.com',
    avatar: 'DL'
  }
];

export default function Referral() {
  const navigate = useNavigate();

  return (
    <Layout background="gradient">
      <Container className="max-w-4xl">
          <header className="flex items-center py-4">
             <WellnessButton onClick={() => navigate('/dashboard')} variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
             </WellnessButton>
             <h1 className="text-2xl font-bold text-primary ml-4">Find Professional Help</h1>
          </header>

        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Local Therapists</CardTitle>
                <CardDescription>Here are some professionals in your area who can provide support.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Mock Google Maps Embed */}
                <div className="w-full h-64 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
                    <p className="text-muted-foreground">Mock Google Maps View</p>
                </div>

                <ScrollArea className="h-96 pr-4">
                    <div className="space-y-4">
                        {therapists.map((therapist, index) => (
                            <Card key={index} className="p-4 flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-primary text-white">{therapist.avatar}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h4 className="font-semibold">{therapist.name}</h4>
                                    <p className="text-sm text-muted-foreground">{therapist.specialty}</p>
                                    <div className="flex gap-4 mt-2">
                                        <a href={`tel:${therapist.phone}`} className="text-sm text-primary hover:underline">Call</a>
                                        <a href={`mailto:${therapist.email}`} className="text-sm text-primary hover:underline">Email</a>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </Container>
    </Layout>
  );
}
