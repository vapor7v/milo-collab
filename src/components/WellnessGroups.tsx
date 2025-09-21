import { useState } from 'react';
import { useSquadSupport } from '@/hooks/useWellnessGroups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Heart,
  MessageCircle,
  Shield,
  UserPlus,
  LogOut,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export const WellnessGroups = () => {
  const {
    currentSquad,
    availableSquads,
    squadActivities,
    loading,
    createSquad,
    joinSquad,
    leaveSquad,
    submitPromptResponse
  } = useSquadSupport();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [squadDescription, setSquadDescription] = useState('');
  const [responseText, setResponseText] = useState('');

  const handleCreateSquad = async () => {
    if (!squadName.trim() || !squadDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const success = await createSquad(squadName, squadDescription);
    if (success) {
      toast.success('Squad created successfully!');
      setShowCreateDialog(false);
      setSquadName('');
      setSquadDescription('');
    } else {
      toast.error('Failed to create squad');
    }
  };

  const handleJoinSquad = async (squadId: string) => {
    const success = await joinSquad(squadId);
    if (success) {
      toast.success('Joined squad!');
    } else {
      toast.error('Failed to join squad');
    }
  };

  const handleLeaveSquad = async () => {
    const success = await leaveSquad();
    if (success) {
      toast.success('Left squad');
    } else {
      toast.error('Failed to leave squad');
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    const success = await submitPromptResponse(responseText);
    if (success) {
      toast.success('Response submitted anonymously!');
      setShowResponseDialog(false);
      setResponseText('');
    } else {
      toast.error('Failed to submit response');
    }
  };



  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Users className="h-6 w-6" />
          </div>
          <span>Squad Support</span>
          <Heart className="h-5 w-5 animate-pulse" />
        </CardTitle>
        <p className="text-indigo-100 text-sm">
          Small, anonymous groups supporting each other daily 🤝✨
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Current Squad Section */}
        {currentSquad ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{currentSquad.name}</h3>
                    <p className="text-sm text-gray-600">{currentSquad.members.length}/{currentSquad.maxMembers} members</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLeaveSquad}
                    className="bg-white/80 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Leave
                  </Button>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{currentSquad.description}</p>

              {/* Squad Chat */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Squad Chat
                  </h4>
                  <Badge variant="secondary">
                    {currentSquad.dailyPrompt?.responses?.length || 0} messages
                  </Badge>
                </div>
                <p className="text-blue-800 text-sm mb-4">
                  Share your thoughts, experiences, and support each other. All messages are anonymous and moderated for safety.
                </p>

                <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Message to Squad</DialogTitle>
                      <p className="text-sm text-gray-600">Share your thoughts anonymously with the group.</p>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="What's on your mind? Share your experiences or offer support..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={4}
                      />
                      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        <Shield className="h-4 w-4" />
                        <span>Strict safety check: Contact info, social media, and harmful content will be blocked</span>
                      </div>
                      <Button onClick={handleSubmitResponse} className="w-full" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Anonymously'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Squad Messages */}
              {currentSquad.dailyPrompt && currentSquad.dailyPrompt.responses.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Squad Messages (Anonymous)
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentSquad.dailyPrompt.responses
                      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
                      .slice(0, 20)
                      .map((response, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs">👤</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {response.timestamp.toDate().toLocaleDateString()} at {response.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-gray-900 text-sm">{response.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Squad Members */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Squad Members:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentSquad.members.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">👤</div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Anonymous Member</span>
                        <div className="text-sm text-gray-600">
                          Joined {member.joinedAt.toDate().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No Squad - Show Create/Join Options */
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-sm text-center">
              <Users className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Join a Support Squad</h3>
              <p className="text-gray-600 mb-6">
                Connect with peers in small, anonymous groups. Share daily and realize you're not alone. 🤝
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Squad
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Support Squad</DialogTitle>
                      <p className="text-sm text-gray-600">Create your own private support squad for you and your peers.</p>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Squad Name</label>
                        <Input
                          placeholder="e.g., Morning Mindfulness Squad"
                          value={squadName}
                          onChange={(e) => setSquadName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <Textarea
                          placeholder="Brief description of your squad's focus..."
                          value={squadDescription}
                          onChange={(e) => setSquadDescription(e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleCreateSquad} className="w-full" disabled={loading || !squadName.trim() || !squadDescription.trim()}>
                        {loading ? 'Creating...' : 'Create Squad'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {availableSquads.length > 0 && (
                  <Button
                    variant="outline"
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => {
                      // Scroll to available squads section
                      const element = document.getElementById('available-squads');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Squad ({availableSquads.length} available)
                  </Button>
                )}
              </div>
            </div>

            {/* Available Squads */}
            {availableSquads.length > 0 && (
              <div id="available-squads" className="space-y-3">
                <h4 className="font-semibold text-gray-900">Available Squads:</h4>
                {availableSquads.map((squad) => (
                  <div key={squad.id} className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{squad.name}</h5>
                        <p className="text-sm text-gray-600 mb-2">{squad.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{squad.members.length}/{squad.maxMembers} members</span>
                          <span>Daily prompts</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoinSquad(squad.id)}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Squad Activities */}
        {squadActivities.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Recent Squad Activity
            </h4>
            <div className="space-y-2">
              {squadActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="text-lg">🤝</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};