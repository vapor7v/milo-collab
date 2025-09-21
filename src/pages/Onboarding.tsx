import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/integrations/firebase/client'; // Corrected import
import { Layout, Container } from '@/components/Layout';
import { WellnessButton } from '@/components/WellnessButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { User } from 'firebase/auth';
import MentalHealthAssessment from '@/components/MentalHealthAssessment';

export default function Onboarding() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState<'relative' | 'basic' | 'assessment'>('relative');

    // Form state
    const [relativeContact, setRelativeContact] = useState('');
    const [name, setName] = useState('');
    const [workStart, setWorkStart] = useState('09:00');
    const [workEnd, setWorkEnd] = useState('17:00');
    const [wellnessGoals, setWellnessGoals] = useState('');
    const [assessmentResult, setAssessmentResult] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            console.log('Onboarding: Auth state changed, user:', currentUser?.uid);
            if (currentUser) {
                setUser(currentUser);
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    console.log('Onboarding: User doc exists:', userDoc.exists());
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log('Onboarding: User data:', userData);
                        console.log('Onboarding: onboardingComplete:', userData?.onboardingComplete);
                        if (userData?.onboardingComplete) {
                            console.log('Onboarding: User has completed onboarding, navigating to dashboard');
                            navigate('/dashboard');
                            return;
                        }
                    }
                    console.log('Onboarding: User needs onboarding, showing form');
                    setLoading(false);
                } catch (err) {
                    console.error("Status check failed:", err);
                    setError("Couldn't verify your status. Please proceed.");
                    setLoading(false);
                }
            } else {
                console.log('Onboarding: No user, navigating to home');
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [navigate]);


    const handleRelativeContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!relativeContact) {
            setError('Please enter your relative\'s contact number.');
            return;
        }

        // Move to basic info step
        setCurrentStep('basic');
    };

    const handleBasicInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !wellnessGoals) {
            setError('Please fill out all fields.');
            return;
        }

        // Move to assessment step
        setCurrentStep('assessment');
    };

    const handleAssessmentComplete = async (result: any) => {
        setAssessmentResult(result);
        setLoading(true);

        try {
            await setDoc(doc(db, "users", user!.uid), {
                name,
                relativeContact,
                workHours: { start: workStart, end: workEnd },
                wellnessGoals,
                email: user!.email,
                mentalHealthAssessment: result,
                onboardingComplete: true
            }, { merge: true });

            navigate('/dashboard');
        } catch (err) {
            console.error("Onboarding failed:", err);
            setError('Failed to save your information. Please try again.');
            setLoading(false);
        }
    };

    if (loading && !error) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (currentStep === 'assessment') {
        return (
            <Layout>
                <Container className="max-w-4xl pt-8">
                    <MentalHealthAssessment
                        onComplete={handleAssessmentComplete}
                        relativeContact={relativeContact}
                    />
                </Container>
            </Layout>
        );
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 'relative':
                return (
                    <Card className="shadow-lg border-0 rounded-xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-bold">Welcome to Milo</CardTitle>
                            <CardDescription>Let's get you set up with some basic information.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-7">
                            <form onSubmit={handleRelativeContactSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="relative">Trusted Contact Number</Label>
                                    <Input
                                        id="relative"
                                        type="tel"
                                        value={relativeContact}
                                        onChange={(e) => setRelativeContact(e.target.value)}
                                        placeholder="Enter a trusted contact's phone number"
                                        required
                                    />
                                    <p className="text-sm text-gray-600">
                                        We'll use this to help support your wellness journey.
                                    </p>
                                </div>

                                {error && <p className="text-sm text-center text-red-500">{error}</p>}

                                <WellnessButton type="submit" className="w-full">
                                    Next
                                </WellnessButton>
                            </form>
                        </CardContent>
                    </Card>
                );

            case 'basic':
                return (
                    <Card className="shadow-lg border-0 rounded-xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-bold">Tell Us About Yourself</CardTitle>
                            <CardDescription>Help us personalize your wellness journey.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-7">
                            <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">What is your name?</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>What are your typical work hours?</Label>
                                    <div className="flex items-center gap-3">
                                        <Input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} required />
                                        <span className="text-muted-foreground">to</span>
                                        <Input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="goals">What are your wellness goals?</Label>
                                    <Input id="goals" value={wellnessGoals} onChange={(e) => setWellnessGoals(e.target.value)} placeholder="e.g., Manage stress, sleep better" required />
                                </div>

                                {error && <p className="text-sm text-center text-red-500">{error}</p>}

                                <div className="flex gap-3">
                                    <WellnessButton
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep('relative')}
                                        className="flex-1"
                                    >
                                        Back
                                    </WellnessButton>
                                    <WellnessButton type="submit" className="flex-1">
                                        Continue to Assessment
                                    </WellnessButton>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <Layout>
            <Container className="max-w-xl pt-12">
                {renderStepContent()}
            </Container>
        </Layout>
    );
}
