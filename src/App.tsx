import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useToast } from "@/components/ui/use-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NotificationBanner } from "@/components/NotificationBanner";
import { registerServiceWorker } from "@/lib/serviceWorker";
import { useMeditationScheduler } from "@/hooks/useMeditationScheduler";

const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Alter = lazy(() => import("./pages/Alter"));
const MeditationChallenge = lazy(() => import("./pages/MeditationChallenge"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/Auth"));
const Referral = lazy(() => import("./pages/Referral"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Journal = lazy(() => import("./pages/journal"));
const Pokemon = lazy(() => import("./pages/Pokemon"));
const MoodCalendar = lazy(() => import("./pages/MoodCalendar"));

const App = () => {
  const { toast } = useToast();

  // Initialize meditation scheduler and service worker
  useMeditationScheduler();

  // Register service worker on app load
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        console.error("Global query error:", error);
        toast({
          title: "Error",
          description: "Something went wrong with a data request.",
          variant: "destructive",
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <div className="min-h-screen bg-white">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />
                <Route path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/aichat"
                  element={
                    <ProtectedRoute>
                      <AIChat />
                    </ProtectedRoute>
                  }
                />
                <Route path="/alter"
                  element={
                    <ProtectedRoute>
                      <Alter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meditation-challenge"
                  element={
                    <ProtectedRoute>
                      <MeditationChallenge />
                    </ProtectedRoute>
                  }
                />
                <Route path="/referral"
                  element={
                    <ProtectedRoute>
                      <Referral />
                    </ProtectedRoute>
                  }
                />
                <Route path="/check-in"
                  element={
                    <ProtectedRoute>
                      <CheckIn />
                    </ProtectedRoute>
                  }
                />
                <Route path="/journal"
                  element={
                    <ProtectedRoute>
                      <Journal />
                    </ProtectedRoute>
                  }
                />
                <Route path="/pokemon"
                  element={
                    <ProtectedRoute>
                      <Pokemon />
                    </ProtectedRoute>
                  }
                />
                <Route path="/mood-calendar"
                  element={
                    <ProtectedRoute>
                      <MoodCalendar />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <NotificationBanner />
              </Suspense>
            </div>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
