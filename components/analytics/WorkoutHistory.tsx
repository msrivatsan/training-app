'use client';

import { useEffect, useState } from 'react';
import { Calendar, Filter, Download, Clock, Dumbbell } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

interface Workout {
  id: string;
  name: string;
  type: string;
  duration_minutes: number | null;
  volume_kg: number | null;
  time: string;
}

interface CalendarDay {
  date: string;
  workouts: Workout[];
}

interface HistoryData {
  calendar: CalendarDay[];
  statistics: {
    total_workouts: number;
    total_volume_kg: number;
    average_duration_minutes: number;
    type_distribution: Record<string, number>;
  };
}

export default function WorkoutHistory() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(3);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [months, filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = filterType
        ? `/api/analytics/workout-history?months=${months}&type=${filterType}`
        : `/api/analytics/workout-history?months=${months}`;
      const response = await fetch(url);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;

    const csvRows = ['Date,Workout,Type,Duration (min),Volume (kg)'];
    data.calendar.forEach(day => {
      day.workouts.forEach(workout => {
        csvRows.push(
          `${day.date},"${workout.name}",${workout.type},${workout.duration_minutes || ''},${workout.volume_kg || ''}`
        );
      });
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workout history...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Workout History</h3>
          <p className="text-muted-foreground">
            Your workout history will appear here
          </p>
        </div>
      </div>
    );
  }

  // Get calendar for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map for quick lookup
  const workoutMap = new Map<string, Workout[]>();
  data.calendar.forEach(day => {
    workoutMap.set(day.date, day.workouts);
  });

  const selectedDayWorkouts = selectedDate ? workoutMap.get(selectedDate) || [] : [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-red-500';
      case 'hypertrophy':
        return 'bg-blue-500';
      case 'mixed':
        return 'bg-purple-500';
      case 'deload':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Workout History</h2>
          <p className="text-muted-foreground">Track your training consistency and patterns</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Workouts</p>
          <p className="text-2xl font-bold">{data.statistics.total_workouts}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
          <p className="text-2xl font-bold">{data.statistics.total_volume_kg.toLocaleString()}kg</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Avg Duration</p>
          <p className="text-2xl font-bold">{data.statistics.average_duration_minutes}min</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Most Common</p>
          <p className="text-2xl font-bold capitalize">
            {Object.entries(data.statistics.type_distribution).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setFilterType(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            filterType === null ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('strength')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            filterType === 'strength' ? 'bg-red-500 text-white' : 'bg-muted'
          }`}
        >
          Strength
        </button>
        <button
          onClick={() => setFilterType('hypertrophy')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            filterType === 'hypertrophy' ? 'bg-blue-500 text-white' : 'bg-muted'
          }`}
        >
          Hypertrophy
        </button>
        <button
          onClick={() => setFilterType('mixed')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            filterType === 'mixed' ? 'bg-purple-500 text-white' : 'bg-muted'
          }`}
        >
          Mixed
        </button>
        <button
          onClick={() => setFilterType('deload')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            filterType === 'deload' ? 'bg-green-500 text-white' : 'bg-muted'
          }`}
        >
          Deload
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            className="px-3 py-1 rounded hover:bg-muted"
          >
            ←
          </button>
          <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            className="px-3 py-1 rounded hover:bg-muted"
          >
            →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayWorkouts = workoutMap.get(dateStr) || [];
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`aspect-square p-2 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : dayWorkouts.length > 0
                    ? 'bg-primary/10 border-primary/20 hover:bg-primary/20'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="text-sm font-medium">{format(day, 'd')}</div>
                {dayWorkouts.length > 0 && (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {dayWorkouts.slice(0, 3).map((workout, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${getTypeColor(workout.type)}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && selectedDayWorkouts.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">
            {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
          </h3>
          <div className="space-y-3">
            {selectedDayWorkouts.map((workout, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getTypeColor(workout.type)}`} />
                  <div>
                    <p className="font-medium">{workout.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{workout.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  {workout.duration_minutes && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {workout.duration_minutes}min
                    </div>
                  )}
                  {workout.volume_kg && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Dumbbell className="h-3 w-3" />
                      {workout.volume_kg.toLocaleString()}kg
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
