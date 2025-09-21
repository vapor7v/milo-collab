import { useState } from 'react';
import { useSOSSystem } from '@/hooks/useSOSSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Phone,
  Heart,
  AlertTriangle,
  CheckCircle,
  Settings,
  Clock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export const AdaptiveSOS = () => {
  const {
    emergencyContacts,
    safetyPlan,
    sosSettings,
    currentSOSEvent,
    sosHistory,
    addEmergencyContact,
    updateSafetyPlan,
    assessAndTriggerSOS,
    resolveSOSEvent,
    updateSOSSettings
  } = useSOSSystem();

  const [showAddContact, setShowAddContact] = useState(false);
  const [showSafetyPlan, setShowSafetyPlan] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');
  const [triggers, setTriggers] = useState('');
  const [copingStrategies, setCopingStrategies] = useState('');
  const [therapist, setTherapist] = useState('');
  const [hotline, setHotline] = useState('');

  const handleAddContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      toast.error('Please fill in name and phone number');
      return;
    }

    const success = await addEmergencyContact(
      contactName,
      contactPhone,
      contactRelationship,
      emergencyContacts.length === 0 // First contact is primary
    );

    if (success) {
      toast.success('Emergency contact added');
      setShowAddContact(false);
      setContactName('');
      setContactPhone('');
      setContactRelationship('');
    } else {
      toast.error('Failed to add contact');
    }
  };

  const handleUpdateSafetyPlan = async () => {
    const triggerList = triggers.split('\n').filter(t => t.trim());
    const strategyList = copingStrategies.split('\n').filter(s => s.trim());

    const success = await updateSafetyPlan(
      triggerList,
      strategyList,
      {
        therapist: therapist || undefined,
        hotline: hotline || undefined
      }
    );

    if (success) {
      toast.success('Safety plan updated');
      setShowSafetyPlan(false);
    } else {
      toast.error('Failed to update safety plan');
    }
  };

  const handleTestSOS = async () => {
    const event = await assessAndTriggerSOS('Test trigger - feeling overwhelmed');
    if (event) {
      toast.success(`SOS activated at level ${event.level} (${event.riskAssessment} risk)`);
    }
  };

  const handleResolveSOS = async () => {
    const success = await resolveSOSEvent('User resolved the situation');
    if (success) {
      toast.success('SOS event resolved');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 1: return '💙';
      case 2: return '💛';
      case 3: return '🧡';
      case 4: return '❤️';
      case 5: return '💔';
      default: return '🤔';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border-2 border-red-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Shield className="h-6 w-6" />
          </div>
          <span>Adaptive SOS System</span>
          <Heart className="h-5 w-5 animate-pulse" />
        </CardTitle>
        <p className="text-red-100 text-sm">
          Smart emergency response with graduated care 🛡️✨
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Current SOS Status */}
        {currentSOSEvent && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">Active SOS Event - Level {currentSOSEvent.level}</span>
                  <div className="text-sm mt-1">
                    Trigger: {currentSOSEvent.trigger}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getRiskColor(currentSOSEvent.riskAssessment)}>
                      {currentSOSEvent.riskAssessment.toUpperCase()} RISK
                    </Badge>
                    <span className="text-xs text-red-600">
                      {getLevelIcon(currentSOSEvent.level)} Escalation Level {currentSOSEvent.level}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleResolveSOS}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white/80 hover:bg-white">
                <Phone className="h-4 w-4 mr-1" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Emergency Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Contact name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <Input
                  placeholder="Phone number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
                <Input
                  placeholder="Relationship (e.g., Family, Friend)"
                  value={contactRelationship}
                  onChange={(e) => setContactRelationship(e.target.value)}
                />
                <Button onClick={handleAddContact} className="w-full">
                  Add Contact
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSafetyPlan} onOpenChange={setShowSafetyPlan}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white/80 hover:bg-white">
                <Shield className="h-4 w-4 mr-1" />
                Safety Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Safety Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">My Triggers</label>
                  <Textarea
                    placeholder="List situations that trigger distress (one per line)"
                    value={triggers}
                    onChange={(e) => setTriggers(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Coping Strategies</label>
                  <Textarea
                    placeholder="List coping strategies that help (one per line)"
                    value={copingStrategies}
                    onChange={(e) => setCopingStrategies(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Therapist contact"
                    value={therapist}
                    onChange={(e) => setTherapist(e.target.value)}
                  />
                  <Input
                    placeholder="Crisis hotline"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                  />
                </div>
                <Button onClick={handleUpdateSafetyPlan} className="w-full">
                  Save Safety Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white/80 hover:bg-white">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>SOS Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Auto-escalation</span>
                  <input
                    type="checkbox"
                    checked={sosSettings.autoEscalationEnabled}
                    onChange={(e) => updateSOSSettings({ autoEscalationEnabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Silent mode</span>
                  <input
                    type="checkbox"
                    checked={sosSettings.silentMode}
                    onChange={(e) => updateSOSSettings({ silentMode: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Location sharing</span>
                  <input
                    type="checkbox"
                    checked={sosSettings.locationSharing}
                    onChange={(e) => updateSOSSettings({ locationSharing: e.target.checked })}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleTestSOS}
            variant="outline"
            className="bg-white/80 hover:bg-white text-orange-600"
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Test SOS
          </Button>
        </div>

        {/* Emergency Contacts */}
        {emergencyContacts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              Emergency Contacts
            </h4>
            <div className="space-y-2">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.relationship}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.isPrimary && (
                      <Badge variant="secondary">Primary</Badge>
                    )}
                    <span className="text-sm text-gray-600">{contact.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Plan Summary */}
        {safetyPlan && (
          <div className="bg-white/70 rounded-lg p-4 border border-red-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Safety Plan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">My Triggers:</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  {safetyPlan.triggers.map((trigger, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      {trigger}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Coping Strategies:</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  {safetyPlan.copingStrategies.map((strategy, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      {strategy}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SOS History */}
        {sosHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              Recent SOS Events
            </h4>
            <div className="space-y-2">
              {sosHistory.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getLevelIcon(event.level)}</span>
                    <div>
                      <div className="font-medium text-gray-900">Level {event.level} Event</div>
                      <div className="text-sm text-gray-600">{event.trigger}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRiskColor(event.riskAssessment)}>
                      {event.riskAssessment}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {event.timestamp.toDate().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Escalation Levels Info */}
        <div className="bg-white/70 rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-gray-900 mb-3">Escalation Levels</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span>💙</span>
              <span><strong>Level 1:</strong> Gentle check-in message</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💛</span>
              <span><strong>Level 2:</strong> Coping strategy reminders</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🧡</span>
              <span><strong>Level 3:</strong> Trusted contact notification</span>
            </div>
            <div className="flex items-center gap-2">
              <span>❤️</span>
              <span><strong>Level 4:</strong> Emergency alert to contacts</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💔</span>
              <span><strong>Level 5:</strong> Full emergency protocol</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Your safety is our priority. We respect your autonomy while keeping you safe 💙
          </p>
        </div>
      </CardContent>
    </Card>
  );
};