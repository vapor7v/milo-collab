import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { WellnessButton } from "@/components/WellnessButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        const checkUserStatus = async () => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().onboardingComplete) {
                        navigate('/dashboard');
                    } else {
                        navigate('/onboarding');
                    }
                } catch (error) {
                    console.error('Error checking user status:', error);
                    // Default to onboarding if we can't check
                    navigate('/onboarding');
                }
            }
        };

        checkUserStatus();
    }, [user, navigate]);

    if (authLoading || user) {
        return <LoadingSpinner fullScreen />;
    }

    const handleGoogleSignIn = async () => {
        setError('');
        setFormLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // The useAuth hook will handle navigation
        } catch (err: any) {
            setError("Google Sign-In failed. Please try again.");
            console.error("Google Sign-In failed:", err);
            setFormLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFormLoading(true);
        
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setFormLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // The useAuth hook will handle navigation
        } catch (err: any) {
            let friendlyError = "An error occurred. Please try again.";
            if (err.code === 'auth/email-already-in-use') {
                friendlyError = "This email is already in use. Please sign in or use a different email.";
            } else if (err.code === 'auth/wrong-password') {
                friendlyError = "Incorrect password. Please try again.";
            } else if (err.code === 'auth/user-not-found') {
                friendlyError = "No account found with this email. Please sign up.";
            }
            setError(friendlyError);
            setFormLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 animate-fade-in">
            <div className="hidden lg:flex flex-col items-center justify-center bg-primary/90 text-primary-foreground p-10">
                <div className="text-center">
                    <ShieldCheck className="w-20 h-20 mx-auto mb-6" />
                    <h1 className="text-4xl font-black tracking-tight">Welcome to Milo</h1>
                    <p className="max-w-md mt-4 text-lg text-primary-foreground/80">
                        A safe, supportive space to prioritize your mental wellness.
                        Let's start this journey together.
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    <Card className="border-0 shadow-none">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-bold tracking-tight">
                                {isSignUp ? 'Create an Account' : 'Sign In to Your Account'}
                            </CardTitle>
                            <CardDescription>
                                to continue your wellness journey.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {error && <p className="text-destructive text-sm font-medium text-center bg-destructive/10 p-3 rounded-md">{error}</p>}
                            <form onSubmit={handleEmailAuth} className="space-y-4">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="mt-1"
                                        disabled={formLoading}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="mt-1"
                                        disabled={formLoading}
                                    />
                                </div>
                                <WellnessButton type="submit" className="w-full" disabled={formLoading}>
                                    {formLoading ? <LoadingSpinner size="sm" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
                                </WellnessButton>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <WellnessButton variant="outline" onClick={handleGoogleSignIn} className="w-full" disabled={formLoading}>
                                {formLoading ? <LoadingSpinner size="sm" /> : (
                                    <>
                                        {/* You'd typically use an SVG or an Icon library here */}
                                        <span className="mr-2">G</span> Google
                                    </>
                                )}
                            </WellnessButton>

                            <p className="mt-4 text-center text-sm text-muted-foreground">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                                <button
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setError('');
                                    }}
                                    className="font-medium text-primary hover:underline"
                                    disabled={formLoading}
                                >
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </button>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
