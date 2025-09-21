import React, { useState, useEffect } from 'react';
import { Layout, Container } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Heart } from 'lucide-react';

interface MoodEntry {
  id: string;
  date: Date;
  mood: string;
  journalEntry?: string;
}

interface CalendarDay {
  date: Date;
  mood?: string;
  hasJournal: boolean;
}

export default function MoodCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Load mood and task data for the current month
  useEffect(() => {
    if (!user?.uid) return;

    const loadMoodData = async () => {
      setLoading(true);
      try {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Load all journal entries for the user (avoiding index requirement)
        const journalQuery = query(
          collection(db, 'journal_entries'),
          where('userId', '==', user.uid)
        );

        const journalSnapshot = await getDocs(journalQuery);
        const allEntries: MoodEntry[] = [];

        journalSnapshot.forEach(doc => {
          const data = doc.data();
          allEntries.push({
            id: doc.id,
            date: data.createdAt.toDate(),
            mood: data.mood,
            journalEntry: data.entry
          });
        });

        // Sort by date descending and filter to current month
        const moodData = allEntries
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .filter(entry => entry.date >= startOfMonth && entry.date <= endOfMonth);

        setMoodData(moodData);
      } catch (error) {
        console.error('Error loading mood data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMoodData();
  }, [user?.uid, currentDate]);

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'happy':
      case 'excellent':
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'calm':
      case 'neutral':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'anxious':
      case 'stressed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sad':
      case 'tired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'angry':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'happy':
      case 'excellent':
      case 'good':
        return '😊';
      case 'calm':
        return '😌';
      case 'anxious':
      case 'stressed':
        return '😰';
      case 'sad':
        return '😢';
      case 'tired':
        return '😴';
      case 'angry':
        return '😠';
      case 'excited':
        return '🤩';
      default:
        return '😐';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: new Date(year, month, -startingDayOfWeek + i + 1),
        hasJournal: false
      });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toDateString();

      const moodEntry = moodData.find(entry => entry.date.toDateString() === dateKey);

      days.push({
        date,
        mood: moodEntry?.mood,
        hasJournal: !!moodEntry?.journalEntry
      });
    }

    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);
  const selectedDateData = selectedDate ?
    moodData.find(entry => entry.date.toDateString() === selectedDate.toDateString()) :
    null;

  if (loading) {
    return (
      <Layout background="gradient">
        <Container className="py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout background="gradient">
      <Container className="py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">Mood Calendar</h1>
          </div>
          <p className="text-lg text-gray-600">
            Track your emotional journey and task completion over time
          </p>
        </div>

        {/* Calendar Navigation */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => navigateMonth('prev')}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <CardTitle className="text-2xl">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>

              <Button
                variant="outline"
                onClick={() => navigateMonth('next')}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50 rounded-lg">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.date.getMonth() === currentDate.getMonth();
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === day.date.toDateString();

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all
                      ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400'}
                      ${isToday ? 'ring-2 ring-indigo-500' : ''}
                      ${isSelected ? 'ring-2 ring-green-500 bg-green-50' : ''}
                    `}
                    onClick={() => isCurrentMonth && setSelectedDate(day.date)}
                  >
                    <div className="text-sm font-medium mb-1">
                      {day.date.getDate()}
                    </div>

                    {isCurrentMonth && day.mood && (
                      <div className="space-y-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getMoodColor(day.mood)}`}
                        >
                          {getMoodEmoji(day.mood)} {day.mood}
                        </Badge>

                        {day.hasJournal && (
                          <div className="text-xs text-indigo-600">
                            📝 Journal
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span>Positive Mood</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                <span>Calm/Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span>Stressed/Anxious</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                <span>Sad/Tired</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📝</span>
                <span>Journal Entry</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        {selectedDateData && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-indigo-600" />
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Mood</h4>
                <Badge className={`${getMoodColor(selectedDateData.mood)} text-sm px-3 py-1`}>
                  {getMoodEmoji(selectedDateData.mood)} {selectedDateData.mood}
                </Badge>
              </div>

              {selectedDateData.journalEntry && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Journal Entry</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedDateData.journalEntry}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Monthly Summary */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {moodData.filter(entry => entry.journalEntry).length}
                </div>
                <div className="text-sm text-gray-600">Journal Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {moodData.length > 0 ?
                    Math.round((moodData.filter(entry =>
                      ['happy', 'excellent', 'good', 'calm'].includes(entry.mood.toLowerCase())
                    ).length / moodData.length) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Positive Days</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
}