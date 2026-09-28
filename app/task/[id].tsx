import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db';
import { tasks } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';
import TaskFormModal from '../../components/TaskFormModal';
import { useColorScheme } from 'nativewind';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

export default function TaskDetailsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  // Fetch specific task
  const { data: matchedTasks } = useLiveQuery(
    db.select().from(tasks).where(eq(tasks.id, Number(id)))
  );

  const task = matchedTasks?.[0];

  if (!task) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'} items-center justify-center`}>
        <Text className="text-muted text-lg">Task not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-4 py-2 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleToggleComplete = async () => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    await db.update(tasks)
      .set({ 
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date() : null
      })
      .where(eq(tasks.id, task.id));
  };

  const handleDelete = () => {
    Alert.alert('Delete this task?', '', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          await db.delete(tasks).where(eq(tasks.id, task.id));
          router.back();
        }
      }
    ]);
  };

  const handleBreakDown = async () => {
    Alert.alert('Coming Soon!', 'The AI Breakdown feature is currently under construction. Check back later!');
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2" onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-20">
        
        {/* Task Title & Project */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3">
            {task.projectId ? (
              <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-200'} px-3 py-1 rounded-full mr-2`}>
                <Text className="text-muted text-xs font-medium uppercase tracking-widest">Project</Text>
              </View>
            ) : null}
            <View className={`px-3 py-1 rounded-full ${task.priority === 'High' ? (isDark ? 'bg-red-900/30' : 'bg-red-100') : task.priority === 'Low' ? (isDark ? 'bg-green-900/30' : 'bg-green-100') : (isDark ? 'bg-blue-900/30' : 'bg-blue-100')}`}>
              <Text className={`text-xs font-medium uppercase tracking-widest ${task.priority === 'High' ? 'text-danger' : task.priority === 'Low' ? 'text-success' : 'text-primary'}`}>
                {task.priority} Priority
              </Text>
            </View>
          </View>
          <Text className={`text-3xl font-bold mb-4 leading-tight ${task.status === 'COMPLETED' ? 'text-muted line-through' : isDark ? 'text-darkText' : 'text-text'}`}>
            {task.title}
          </Text>
          {task.description && (
            <Text className="text-muted text-base leading-relaxed">
              {task.description}
            </Text>
          )}
        </View>

        {/* Task Metadata */}
        <View className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-2xl p-5 shadow-sm border ${isDark ? 'border-gray-800' : 'border-gray-100'} mb-8`}>
          <View className={`flex-row items-center justify-between py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-50'}`}>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#6b7280" className="mr-3" />
              <Text className={`${isDark ? 'text-darkText' : 'text-text'} font-medium ml-2`}>Deadline</Text>
            </View>
            <Text className="text-muted">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</Text>
          </View>
          <View className={`flex-row items-center justify-between py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-50'}`}>
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={20} color="#6b7280" className="mr-3" />
              <Text className={`${isDark ? 'text-darkText' : 'text-text'} font-medium ml-2`}>Created On</Text>
            </View>
            <Text className="text-muted">{new Date(task.createdAt).toLocaleDateString()}</Text>
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="flag-outline" size={20} color="#6b7280" className="mr-3" />
              <Text className={`${isDark ? 'text-darkText' : 'text-text'} font-medium ml-2`}>Status</Text>
            </View>
            <Text className={`font-medium ${task.status === 'COMPLETED' ? 'text-success' : task.status === 'IN PROGRESS' ? 'text-primary' : 'text-muted'}`}>
              {task.status}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="mb-8">
          {task.status !== 'COMPLETED' && (
            <TouchableOpacity 
              className="bg-primary py-4 rounded-2xl items-center flex-row justify-center mb-3"
              onPress={() => router.push('/focus')}
            >
              <Text className="text-white font-bold text-lg mr-2">START FOCUS</Text>
              <Ionicons name="play" size={20} color="white" />
            </TouchableOpacity>
          )}

          <View className="flex-row space-x-3">
            <TouchableOpacity 
              className={`flex-1 ${isDark ? 'bg-darkCard' : 'bg-card'} py-4 rounded-2xl items-center justify-center border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              onPress={() => setModalVisible(true)}
            >
              <Text className={`${isDark ? 'text-darkText' : 'text-text'} font-bold text-base`}>EDIT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-1 py-4 rounded-2xl items-center justify-center border ${task.status === 'COMPLETED' ? `${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${isDark ? 'border-gray-600' : 'border-gray-300'}` : 'bg-success/10 border-success/20'}`}
              onPress={handleToggleComplete}
            >
              <Text className={`${task.status === 'COMPLETED' ? 'text-muted' : 'text-success'} font-bold text-base`}>
                {task.status === 'COMPLETED' ? 'MARK UNDONE' : 'COMPLETE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Breakdown Placeholder */}
        {task.status !== 'COMPLETED' && (
          <View className={`mb-10 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50/50'} p-6 rounded-3xl border ${isDark ? 'border-blue-900/50' : 'border-blue-100'}`}>
            <View className="flex-row items-center mb-4">
              <Ionicons name="sparkles" size={20} color="#0ea5e9" className="mr-2" />
              <Text className="font-bold text-primary ml-1">Break this down</Text>
            </View>
            <Text className="text-muted text-sm mb-4">
              This task feels large. AI can generate smaller, manageable steps.
            </Text>
            <TouchableOpacity 
              disabled={isBreakingDown}
              onPress={handleBreakDown}
              className={`${isDark ? 'bg-darkCard' : 'bg-card'} py-3 rounded-xl items-center border ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isBreakingDown ? 'opacity-50' : ''}`}>
              <Text className="font-semibold text-primary">{isBreakingDown ? "Generating..." : "Generate steps"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TaskFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        taskToEdit={task} 
      />
    </SafeAreaView>
  );
}
