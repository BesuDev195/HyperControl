import { View, Text, TouchableOpacity, ScrollView, AppState, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db';
import { tasks, focusSessions } from '../../db/schema';
import { eq, ne } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

const PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '25m', minutes: 25 },
  { label: '50m', minutes: 50 },
];

export default function FocusScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const router = useRouter();
  
  // Timer State
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(25);
  
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  // Fetch only unfinished tasks for selection
  const { data: allTasks } = useLiveQuery(
    db.select().from(tasks).where(ne(tasks.status, 'COMPLETED'))
  );
  const availableTasks = allTasks || [];

  // Accurate Timer using Date.now()
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.round((endTime - now) / 1000);
        
        if (remaining <= 0) {
          clearInterval(interval);
          handleComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, endTime]);

  // Handle background/foreground to keep timer accurate
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isRunning && endTime) {
        const now = Date.now();
        const remaining = Math.round((endTime - now) / 1000);
        if (remaining <= 0) {
          handleComplete();
        } else {
          setTimeLeft(remaining);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning, endTime]);

  const handleStart = () => {
    if (!selectedTaskId) {
      Alert.alert('Select a task', 'Please pick something to focus on first.');
      return;
    }
    const now = Date.now();
    setStartedAt(now);
    setEndTime(now + (durationMinutes * 60 * 1000));
    setTimeLeft(durationMinutes * 60);
    setIsRunning(true);
  };

  const handlePause = () => {
    if (isRunning) {
      setIsRunning(false);
      // Adjust end time so when we resume, it resumes correctly
      setEndTime(null); 
    } else {
      setIsRunning(true);
      setEndTime(Date.now() + (timeLeft * 1000));
    }
  };

  const handleCancel = () => {
    Alert.alert('End Session?', 'This will save a partial session.', [
      { text: 'Keep Going', style: 'cancel' },
      { 
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          setIsRunning(false);
          setEndTime(null);
          
          if (startedAt) {
            const durationPassed = (durationMinutes * 60) - timeLeft;
            await db.insert(focusSessions).values({
              taskId: selectedTaskId,
              startedAt: new Date(startedAt),
              endedAt: new Date(),
              durationSeconds: durationPassed,
              completed: false,
              interrupted: true,
              createdAt: new Date(),
            });
          }
          
          setStartedAt(null);
          setTimeLeft(durationMinutes * 60);
        }
      }
    ]);
  };

  const handleComplete = async () => {
    setIsRunning(false);
    setEndTime(null);
    
    if (startedAt) {
      await db.insert(focusSessions).values({
        taskId: selectedTaskId,
        startedAt: new Date(startedAt),
        endedAt: new Date(),
        durationSeconds: durationMinutes * 60,
        completed: true,
        interrupted: false,
        createdAt: new Date(),
      });
    }

    Alert.alert('Focus Session Complete! 🎉', 'Great job! Want to mark the task as done?', [
      { text: 'Not Yet', style: 'cancel' },
      { 
        text: 'Mark Done',
        onPress: async () => {
          if (selectedTaskId) {
            await db.update(tasks).set({ status: 'COMPLETED', completedAt: new Date() }).where(eq(tasks.id, selectedTaskId));
          }
        }
      }
    ]);
    
    setStartedAt(null);
    setTimeLeft(durationMinutes * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedTask = availableTasks.find(t => t.id === selectedTaskId);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
      <ScrollView className="flex-1 px-5 pt-8">
        
        {!isRunning && !startedAt ? (
          // SETUP VIEW
          <View className="flex-1 pb-20">
            <View className="mb-10">
              <Text className={`text-4xl font-bold ${isDark ? 'text-darkText' : 'text-text'} mb-2`}>Focus</Text>
              <Text className="text-muted text-lg">Pick one thing. Do it until the timer rings.</Text>
            </View>

            <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4 ml-1">What are you working on?</Text>
            
            <View className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-3xl p-2 mb-10 border ${isDark ? 'border-gray-800' : 'border-gray-100'} shadow-sm max-h-[300px]`}>
              <ScrollView nestedScrollEnabled className="h-full">
                {availableTasks.length === 0 ? (
                  <View className="p-6 items-center">
                    <Text className="text-muted mb-4">No pending tasks.</Text>
                    <TouchableOpacity onPress={() => router.push('/')} className="bg-primary px-4 py-2 rounded-xl">
                      <Text className="text-white font-bold">Go to Today</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  availableTasks.map((task, index) => (
                    <TouchableOpacity
                      key={task.id}
                      onPress={() => setSelectedTaskId(task.id)}
                      className={`p-4 flex-row items-center rounded-2xl ${selectedTaskId === task.id ? 'bg-blue-50/50 border border-primary/20' : 'border border-transparent'}`}
                    >
                      <View className={`w-5 h-5 rounded-full mr-3 items-center justify-center border-2 ${selectedTaskId === task.id ? 'border-primary' : 'border-gray-300'}`}>
                        {selectedTaskId === task.id && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
                      </View>
                      <Text className={`flex-1 text-base font-medium ${selectedTaskId === task.id ? 'text-primary' : isDark ? 'text-darkText' : 'text-text'}`}>
                        {task.title}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>

            <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4 ml-1">For how long? (minutes)</Text>
            <View className="flex-row space-x-3 mb-12 items-center">
              {PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.minutes}
                  onPress={() => {
                    setDurationMinutes(preset.minutes);
                    setTimeLeft(preset.minutes * 60);
                  }}
                  className={`py-3 px-4 items-center justify-center rounded-xl border ${durationMinutes === preset.minutes ? 'bg-primary border-primary' : `${isDark ? 'bg-darkCard border-gray-800' : 'bg-card border-gray-200'}`}`}
                >
                  <Text className={`font-bold text-base ${durationMinutes === preset.minutes ? 'text-white' : 'text-muted'}`}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <View className={`flex-1 flex-row items-center px-4 py-2 rounded-xl border ${isDark ? 'bg-darkCard border-gray-800' : 'bg-card border-gray-200'}`}>
                <TextInput
                  className={`flex-1 font-bold text-base ${isDark ? 'text-white' : 'text-black'}`}
                  keyboardType="number-pad"
                  placeholder="Custom"
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                  value={durationMinutes ? String(durationMinutes) : ''}
                  onChangeText={(val) => {
                    const min = parseInt(val, 10);
                    if (!isNaN(min) && min > 0) {
                      setDurationMinutes(min);
                      setTimeLeft(min * 60);
                    } else if (val === '') {
                      setDurationMinutes(0);
                    }
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              className={`py-5 rounded-2xl items-center justify-center ${(selectedTaskId && durationMinutes > 0) ? 'bg-primary' : 'bg-gray-200'}`}
              onPress={handleStart}
              disabled={!selectedTaskId || durationMinutes <= 0}
            >
              <Text className={`font-bold text-lg ${selectedTaskId ? 'text-white' : 'text-gray-400'}`}>START FOCUSING</Text>
            </TouchableOpacity>

          </View>
        ) : (
          // ACTIVE TIMER VIEW
          <View className="flex-1 items-center pt-10">
            <Text className="text-muted text-sm font-bold tracking-widest uppercase mb-2">Focusing On</Text>
            <Text className={`text-2xl font-bold ${isDark ? 'text-darkText' : 'text-text'} mb-12 text-center px-4`}>
              {selectedTask?.title || 'Unknown Task'}
            </Text>

            <View className="w-72 h-72 rounded-full border-8 border-gray-100 items-center justify-center mb-16 relative">
              {/* Optional: Add circular progress SVG here using react-native-svg in future */}
              <View className="absolute inset-0 rounded-full border-8 border-primary/20 opacity-50" />
              <Text className={`text-7xl font-bold ${isDark ? 'text-darkText' : 'text-text'} tabular-nums tracking-tighter`}>
                {formatTime(timeLeft)}
              </Text>
            </View>

            <View className="flex-row space-x-6">
              <TouchableOpacity
                onPress={handleCancel}
                className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePause}
                className={`w-20 h-20 rounded-full items-center justify-center ${isRunning ? 'bg-amber-100' : 'bg-success/20'}`}
              >
                <Ionicons name={isRunning ? 'pause' : 'play'} size={32} color={isRunning ? '#d97706' : '#22c55e'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleComplete}
                className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center"
              >
                <Ionicons name="checkmark-done" size={28} color="#0ea5e9" />
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
