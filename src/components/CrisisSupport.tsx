import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Phone, MapPin, Video, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

interface TherapistRecommendation {
  name: string;
  type: 'walk-in' | 'video';
  address?: string;
  phone?: string;
  distance?: string;
  specialty?: string;
  availability?: string;
}

interface AssessmentResult {
  severityLevel: number;
  diagnosis: string;
  psychiatristRecommendations?: TherapistRecommendation[];
}

interface CrisisSupportProps {
  assessmentResult?: AssessmentResult;
}

export default function CrisisSupport({ assessmentResult }: CrisisSupportProps) {
  const { user } = useAuth();
  const [userAssessment, setUserAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserAssessment = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserAssessment(userData.mentalHealthAssessment);
        }
      } catch (error) {
        console.error('Error loading user assessment:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!assessmentResult) {
      loadUserAssessment();
    } else {
      setUserAssessment(assessmentResult);
      setLoading(false);
    }
  }, [user, assessmentResult]);

  if (loading) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 bg-red-200 rounded"></div>
            <div className="h-4 bg-red-200 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentAssessment = assessmentResult || userAssessment;

  // Only show if severity level is 3 or higher
  if (!currentAssessment || currentAssessment.severityLevel < 3) {
    return null;
  }

  const getSeverityColor = (level: number) => {
    if (level >= 5) return 'text-red-700 bg-red-100 border-red-300';
    if (level >= 4) return 'text-orange-700 bg-orange-100 border-orange-300';
    return 'text-yellow-700 bg-yellow-100 border-yellow-300';
  };

  const getSeverityLabel = (level: number) => {
    if (level >= 5) return 'Critical - Immediate Action Required';
    if (level >= 4) return 'High Risk - Professional Help Needed';
    return 'Moderate Risk - Professional Consultation Recommended';
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          Mental Health Support Resources
          <Badge className={`ml-auto ${getSeverityColor(currentAssessment.severityLevel)}`}>
            Level {currentAssessment.severityLevel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assessment Summary */}
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">Assessment Summary</h4>
          <p className="text-gray-700 text-sm mb-2">{currentAssessment.diagnosis}</p>
          <p className="text-sm font-medium text-red-700">{getSeverityLabel(currentAssessment.severityLevel)}</p>
        </div>

        {/* Emergency Contacts */}
        <div>
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Emergency Contacts
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              <Phone className="w-4 h-4 mr-2" />
              Emergency: 911
            </Button>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              <Phone className="w-4 h-4 mr-2" />
              Crisis Hotline: 988
            </Button>
          </div>
        </div>

        {/* Therapist Recommendations */}
        {currentAssessment.psychiatristRecommendations && currentAssessment.psychiatristRecommendations.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-800 mb-3">Recommended Mental Health Professionals</h4>
            <div className="space-y-3">
              {currentAssessment.psychiatristRecommendations.map((therapist: TherapistRecommendation, index: number) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-gray-900">{therapist.name}</h5>
                        <Badge variant="outline" className="text-xs">
                          {therapist.type === 'walk-in' ? '🏥 Walk-in Clinic' : '💻 Video Consultation'}
                        </Badge>
                      </div>

                      {therapist.specialty && (
                        <p className="text-sm text-gray-600 mb-1">Specialty: {therapist.specialty}</p>
                      )}

                      {therapist.address && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <MapPin className="w-3 h-3" />
                          {therapist.address}
                        </div>
                      )}

                      {therapist.distance && (
                        <p className="text-sm text-green-600">{therapist.distance} away</p>
                      )}

                      {therapist.availability && (
                        <p className="text-sm text-blue-600">Available: {therapist.availability}</p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {therapist.phone && (
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                      )}
                      {therapist.type === 'video' && (
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          <Video className="w-3 h-3 mr-1" />
                          Book
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Resources */}
        <div>
          <h4 className="font-semibold text-red-800 mb-3">Additional Resources</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 justify-start">
              <ExternalLink className="w-4 h-4 mr-2" />
              Mental Health America
            </Button>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 justify-start">
              <ExternalLink className="w-4 h-4 mr-2" />
              NAMI Helpline
            </Button>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 justify-start">
              <ExternalLink className="w-4 h-4 mr-2" />
              Psychology Today
            </Button>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 justify-start">
              <ExternalLink className="w-4 h-4 mr-2" />
              Crisis Text Line
            </Button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h5 className="font-semibold text-red-800 mb-1">Important Notice</h5>
              <p className="text-sm text-red-700">
                If you're experiencing a mental health crisis or having thoughts of self-harm,
                please contact emergency services immediately or call the National Suicide Prevention Lifeline at 988.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}