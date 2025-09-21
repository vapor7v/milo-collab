import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getGenerativeAIService } from '@/integrations/firebase/client';
import { toast } from 'sonner';

interface AssessmentResult {
  severityLevel: number;
  diagnosis: string;
  recommendations: string[];
  needsProfessionalHelp: boolean;
  psychiatristRecommendations?: PsychiatristRecommendation[];
}

interface FallbackAssessmentResult {
  severityLevel: number;
  diagnosis: string;
  recommendations: string[];
  needsProfessionalHelp: boolean;
}

interface PsychiatristRecommendation {
  name: string;
  type: 'walk-in' | 'video';
  address?: string;
  phone?: string;
  distance?: string;
}

interface MentalHealthAssessmentProps {
  onComplete: (result: AssessmentResult) => void;
  userLocation?: { lat: number; lng: number };
  relativeContact?: string;
}

// Mock SMS service - in production, integrate with Twilio or similar
const sendEmergencySMS = async (phoneNumber: string, severityLevel: number, diagnosis: string) => {
  try {
    // In a real app, this would call an SMS service API
    const message = `URGENT: Your loved one has shown signs of mental health concerns (Level ${severityLevel}). Assessment indicates: ${diagnosis}. Please contact them immediately and encourage professional help. Milo Wellness App.`;

    console.log(`Sending emergency SMS to ${phoneNumber}:`, message);

    // Mock API call - replace with actual SMS service
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phoneNumber,
        message: message,
        priority: 'urgent'
      })
    });

    if (!response.ok) {
      throw new Error('SMS sending failed');
    }

    console.log('Emergency SMS sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send emergency SMS:', error);
    // In production, you might want to retry or use a fallback
    return false;
  }
};

const ASSESSMENT_QUESTIONS = [
  {
    id: 'stress_level',
    question: 'How would you rate your current stress level?',
    type: 'scale',
    scale: ['Very Low', 'Low', 'Moderate', 'High', 'Very High']
  },
  {
    id: 'sleep_quality',
    question: 'How would you describe your sleep quality?',
    type: 'scale',
    scale: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor']
  },
  {
    id: 'sleep_duration',
    question: 'How many hours of sleep do you get per night?',
    type: 'select',
    options: ['Less than 5 hours', '5-6 hours', '6-7 hours', '7-8 hours', '8-9 hours', 'More than 9 hours']
  },
  {
    id: 'anxiety_frequency',
    question: 'How often do you experience anxiety or worry?',
    type: 'scale',
    scale: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost Always']
  },
  {
    id: 'mood_swings',
    question: 'How often do you experience significant mood swings?',
    type: 'scale',
    scale: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost Always']
  },
  {
    id: 'social_support',
    question: 'How satisfied are you with your social support network?',
    type: 'scale',
    scale: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
  },
  {
    id: 'concentration',
    question: 'How would you rate your ability to concentrate?',
    type: 'scale',
    scale: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor']
  },
  {
    id: 'energy_level',
    question: 'How would you describe your energy levels?',
    type: 'scale',
    scale: ['Very High', 'High', 'Moderate', 'Low', 'Very Low']
  },
  {
    id: 'exercise_frequency',
    question: 'How often do you engage in physical exercise?',
    type: 'select',
    options: ['Daily', '4-5 times per week', '2-3 times per week', 'Once per week', 'Rarely/Never']
  },
  {
    id: 'work_life_balance',
    question: 'How satisfied are you with your work-life balance?',
    type: 'scale',
    scale: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
  },
  {
    id: 'financial_stress',
    question: 'How much stress do you experience related to finances?',
    type: 'scale',
    scale: ['None', 'Low', 'Moderate', 'High', 'Very High']
  },
  {
    id: 'coping_mechanisms',
    question: 'How effective are your current coping strategies?',
    type: 'scale',
    scale: ['Very Effective', 'Effective', 'Somewhat Effective', 'Ineffective', 'Very Ineffective']
  },
  {
    id: 'past_therapy',
    question: 'Have you ever sought professional mental health support?',
    type: 'select',
    options: ['Yes, currently', 'Yes, in the past', 'Considering it', 'No, but open to it', 'No, not interested']
  },
  {
    id: 'family_history',
    question: 'Is there a family history of mental health conditions?',
    type: 'select',
    options: ['Yes', 'No', 'Unsure', 'Prefer not to say']
  },
  {
    id: 'motivation_level',
    question: 'How motivated are you to improve your mental wellness?',
    type: 'scale',
    scale: ['Very Motivated', 'Motivated', 'Somewhat Motivated', 'Low Motivation', 'No Motivation']
  }
];

export default function MentalHealthAssessment({ onComplete, userLocation, relativeContact }: MentalHealthAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const currentQuestion = ASSESSMENT_QUESTIONS[currentStep];
  const isLastQuestion = currentStep === ASSESSMENT_QUESTIONS.length - 1;

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      toast.error('Please select an answer');
      return;
    }

    if (isLastQuestion) {
      performAssessment();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const performAssessment = async () => {
    setAnalyzing(true);
    try {
      const ai = getGenerativeAIService();
      let assessmentData;

      if (ai) {
        try {
          const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

          const assessmentSummary = Object.entries(answers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

          const prompt = `
            You are a psychiatrist conducting a preliminary mental health assessment.
            Based on the following responses, provide a professional assessment:

            ASSESSMENT RESPONSES:
            ${assessmentSummary}

            TASK:
            1. Determine severity level (1-5) where:
               - 1 = No significant concerns
               - 2 = Mild symptoms
               - 3 = Moderate symptoms requiring attention
               - 4 = Significant symptoms, professional help recommended
               - 5 = Severe symptoms, immediate professional intervention needed

            2. Provide a brief diagnosis/summary
            3. List specific recommendations
            4. Determine if professional psychiatric help is needed (severity 4+)

            FORMAT YOUR RESPONSE AS JSON:
            {
              "severityLevel": number (1-5),
              "diagnosis": "brief professional summary",
              "recommendations": ["recommendation1", "recommendation2", ...],
              "needsProfessionalHelp": boolean
            }
          `;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          assessmentData = JSON.parse(response.text().trim());
        } catch (aiError) {
          console.warn('AI assessment failed, using fallback:', aiError);
          // Fallback assessment based on answers
          assessmentData = generateFallbackAssessment(answers);
        }
      } else {
        console.warn('AI service not available, using fallback assessment');
        assessmentData = generateFallbackAssessment(answers);
      }

      let psychiatristRecommendations: PsychiatristRecommendation[] = [];

      if (assessmentData.needsProfessionalHelp && userLocation) {
        // Generate mock psychiatrist recommendations (in real app, use actual API)
        psychiatristRecommendations = [
          {
            name: 'Dr. Priya Sharma',
            type: 'walk-in',
            address: '123 MG Road, Bangalore',
            phone: '+91-9876543210',
            distance: '2.3 km'
          },
          {
            name: 'Dr. Rajesh Kumar',
            type: 'video',
            phone: '+91-9876543211'
          },
          {
            name: 'MindCare Clinic',
            type: 'walk-in',
            address: '456 Brigade Road, Bangalore',
            phone: '+91-9876543212',
            distance: '3.1 km'
          }
        ];
      }

      const finalResult: AssessmentResult = {
        ...assessmentData,
        psychiatristRecommendations
      };

      // Send SMS alert if severity level is 3 or higher
      if (assessmentData.severityLevel >= 3 && relativeContact) {
        await sendEmergencySMS(relativeContact, assessmentData.severityLevel, assessmentData.diagnosis);
      }

      setAssessmentResult(finalResult);
      onComplete(finalResult);

    } catch (error) {
      console.error('Assessment failed:', error);
      toast.error('Assessment failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Fallback assessment function when AI is not available
  const generateFallbackAssessment = (answers: Record<string, string>): FallbackAssessmentResult => {
    let severityLevel = 1;
    let diagnosis = "Your responses indicate generally good mental wellness.";
    const recommendations = [
      "Continue maintaining healthy daily habits",
      "Consider regular exercise and balanced nutrition",
      "Practice stress management techniques when needed"
    ];
    let needsProfessionalHelp = false;

    // Comprehensive scoring based on remaining answers
    const stressLevel = answers.stress_level;
    const anxietyFrequency = answers.anxiety_frequency;
    const sleepQuality = answers.sleep_quality;
    const sleepDuration = answers.sleep_duration;
    const concentration = answers.concentration;
    const energyLevel = answers.energy_level;
    const socialSupport = answers.social_support;
    const workLifeBalance = answers.work_life_balance;
    const financialStress = answers.financial_stress;
    const copingMechanisms = answers.coping_mechanisms;
    const pastTherapy = answers.past_therapy;
    const familyHistory = answers.family_history;
    const motivationLevel = answers.motivation_level;
    const exerciseFrequency = answers.exercise_frequency;

    // Mental health indicators
    if (stressLevel === 'High' || stressLevel === 'Very High') severityLevel = Math.max(severityLevel, 3);
    if (anxietyFrequency === 'Often' || anxietyFrequency === 'Almost Always') severityLevel = Math.max(severityLevel, 3);
    if (sleepQuality === 'Poor' || sleepQuality === 'Very Poor') severityLevel = Math.max(severityLevel, 2);
    if (sleepDuration === 'Less than 5 hours') severityLevel = Math.max(severityLevel, 2);
    if (concentration === 'Poor' || concentration === 'Very Poor') severityLevel = Math.max(severityLevel, 2);
    if (energyLevel === 'Very Low' || energyLevel === 'Low') severityLevel = Math.max(severityLevel, 2);

    // Social and environmental factors
    if (socialSupport === 'Dissatisfied' || socialSupport === 'Very Dissatisfied') severityLevel = Math.max(severityLevel, 2);
    if (workLifeBalance === 'Dissatisfied' || workLifeBalance === 'Very Dissatisfied') severityLevel = Math.max(severityLevel, 2);
    if (financialStress === 'High' || financialStress === 'Very High') severityLevel = Math.max(severityLevel, 2);

    // Coping and history factors
    if (copingMechanisms === 'Ineffective' || copingMechanisms === 'Very Ineffective') severityLevel = Math.max(severityLevel, 2);
    if (pastTherapy === 'Yes, currently') severityLevel = Math.max(severityLevel, 2); // May indicate ongoing issues
    if (familyHistory === 'Yes') severityLevel = Math.max(severityLevel, 2);

    // Positive factors that can reduce severity
    if (motivationLevel === 'Very Motivated' || motivationLevel === 'Motivated') {
      severityLevel = Math.max(1, severityLevel - 1);
    }

    // Lifestyle factors
    if (exerciseFrequency === 'Rarely/Never') severityLevel = Math.max(severityLevel, 2);

    // Generate diagnosis and recommendations based on severity
    if (severityLevel >= 4) {
      needsProfessionalHelp = true;
      diagnosis = "Your responses suggest you may benefit from professional mental health support.";
      recommendations.push("Consider consulting a mental health professional");
      recommendations.push("Reach out to trusted friends or family for support");
    } else if (severityLevel >= 3) {
      diagnosis = "Your responses indicate some areas that may need attention.";
      recommendations.push("Monitor your symptoms and consider professional consultation if they persist");
      recommendations.push("Consider speaking with a counselor or therapist");
    } else if (severityLevel >= 2) {
      diagnosis = "Your responses show some areas for potential improvement.";
      recommendations.push("Consider incorporating more wellness practices into your routine");
      recommendations.push("Track your mood and energy patterns");
    }

    // Add specific recommendations based on answers
    if (exerciseFrequency === 'Rarely/Never') {
      recommendations.push("Try to incorporate regular physical activity into your routine");
    }
    if (sleepDuration === 'Less than 5 hours' || sleepQuality === 'Poor' || sleepQuality === 'Very Poor') {
      recommendations.push("Focus on improving sleep hygiene and duration");
    }
    if (socialSupport === 'Dissatisfied' || socialSupport === 'Very Dissatisfied') {
      recommendations.push("Consider building stronger social connections");
    }
    if (workLifeBalance === 'Dissatisfied' || workLifeBalance === 'Very Dissatisfied') {
      recommendations.push("Work on establishing better boundaries between work and personal time");
    }

    return {
      severityLevel,
      diagnosis,
      recommendations,
      needsProfessionalHelp
    };
  };

  if (analyzing) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Analyzing Your Responses</h3>
          <p className="text-gray-600">Our AI is performing a professional assessment...</p>
        </CardContent>
      </Card>
    );
  }

  if (assessmentResult) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Assessment Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${
              assessmentResult.severityLevel >= 4 ? 'text-red-600' :
              assessmentResult.severityLevel >= 3 ? 'text-orange-600' :
              'text-green-600'
            }`}>
              Level {assessmentResult.severityLevel}
            </div>
            <p className="text-gray-600">Severity Level</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Assessment Summary</h4>
            <p className="text-gray-700">{assessmentResult.diagnosis}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {assessmentResult.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Mental Health Assessment</CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Question {currentStep + 1} of {ASSESSMENT_QUESTIONS.length}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / ASSESSMENT_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>

          {currentQuestion.type === 'select' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={answers[currentQuestion.id] === option ? "default" : "outline"}
                  onClick={() => handleAnswer(option)}
                  className="w-full justify-start"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'scale' && currentQuestion.scale && (
            <div className="space-y-3">
              {currentQuestion.scale.map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant={answers[currentQuestion.id] === level ? "default" : "outline"}
                  onClick={() => handleAnswer(level)}
                  className="w-full justify-start"
                >
                  {level}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button type="button" variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            className="flex-1"
            disabled={!answers[currentQuestion.id]}
          >
            {isLastQuestion ? 'Complete Assessment' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}