import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db';
import { tasks, focusSessions } from '../../db/schema';
import { eq, desc, isNotNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function HistoryScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const router = useRouter();

  const { data: allTasks } = useLiveQuery(
    db.select().from(tasks).orderBy(desc(tasks.completedAt))
  );
  
  const { data: allSessions } = useLiveQuery(
    db.select().from(focusSessions)
  );

  const completedTasks = (allTasks || []).filter(t => t.status === 'COMPLETED');
  const sessions = allSessions || [];

  // Calculate statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasksCompletedToday = completedTasks.filter(
    t => t.completedAt && new Date(t.completedAt) >= today
  ).length;

  const totalTasksCompleted = completedTasks.length;

  const totalFocusSeconds = sessions.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  const totalFocusHours = Math.floor(totalFocusSeconds / 3600);
  const totalFocusMinutes = Math.floor((totalFocusSeconds % 3600) / 60);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
      <ScrollView className="flex-1 px-5 pt-8 pb-20">
        
        <View className="mb-8">
          <Text className={`text-4xl font-bold ${isDark ? 'text-darkText' : 'text-text'} mb-2`}>Progress</Text>
          <Text className="text-muted text-lg">Look how far you've come.</Text>
        </View>

        <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4 ml-1">Statistics</Text>
        
        <View className="flex-row space-x-4 mb-4">
          <View className="flex-1 bg-blue-50/50 p-5 rounded-3xl border border-primary/20 items-center">
            <Text className="text-4xl font-bold text-primary mb-1">{tasksCompletedToday}</Text>
            <Text className="text-xs font-bold text-primary/70 uppercase tracking-wider text-center">Tasks Done Today</Text>
          </View>
          
          <View className="flex-1 bg-success/10 p-5 rounded-3xl border border-success/20 items-center">
            <Text className="text-4xl font-bold text-success mb-1">{totalTasksCompleted}</Text>
            <Text className="text-xs font-bold text-success/70 uppercase tracking-wider text-center">Total Completed</Text>
          </View>
        </View>

        <View className="bg-amber-50 p-6 rounded-3xl border border-amber-200/50 items-center mb-10 flex-row">
          <View className="w-16 h-16 rounded-full bg-amber-100 items-center justify-center mr-5">
            <Ionicons name="time" size={32} color="#d97706" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-amber-600/70 uppercase tracking-wider mb-1">Total Focus Time</Text>
            <Text className="text-3xl font-bold text-amber-600">
              {totalFocusHours}h {totalFocusMinutes}m
            </Text>
          </View>
        </View>

        <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4 ml-1">Recently Completed</Text>
        
        {completedTasks.length === 0 ? (
          <View className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-3xl p-8 items-center border ${isDark ? 'border-gray-800' : 'border-gray-100'} shadow-sm opacity-60`}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color="#9ca3af" className="mb-4" />
            <Text className={`text-base font-medium ${isDark ? 'text-darkText' : 'text-text'} mb-1`}>No completed tasks yet.</Text>
            <Text className="text-muted text-center text-sm">Finish something to see it here.</Text>
          </View>
        ) : (
          <View className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-3xl border ${isDark ? 'border-gray-800' : 'border-gray-100'} overflow-hidden shadow-sm mb-10`}>
            {completedTasks.slice(0, 20).map((task, index) => (
              <View key={task.id} className={`flex-row items-center p-4 ${index !== Math.min(completedTasks.length, 20) - 1 ? 'border-b border-gray-50' : ''}`}>
                <View className="w-8 h-8 rounded-full bg-success/20 items-center justify-center mr-4">
                  <Ionicons name="checkmark" size={16} color="#22c55e" />
                </View>
                
                <View className="flex-1">
                  <Text className={`text-base font-medium ${isDark ? 'text-darkText' : 'text-text'} mb-1 line-through opacity-70`}>
                    {task.title}
                  </Text>
                  {task.completedAt && (
                    <Text className="text-xs text-muted">
                      {new Date(task.completedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <TouchableOpacity 
                  className="p-2"
                  onPress={() => router.push(`/task/${task.id}`)}
                >
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
