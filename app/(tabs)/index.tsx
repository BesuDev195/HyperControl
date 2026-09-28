import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '../../db';
import { tasks } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useColorScheme } from 'nativewind';
import TaskFormModal from '../../components/TaskFormModal';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

export default function TodayScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultRank, setDefaultRank] = useState<number | null>(null);

  const [greeting, setGreeting] = useState('Good morning 👋');
  const [nairobiTime, setNairobiTime] = useState('');

  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, text: "Hi! I'm HyperBot. I'm currently under construction, but I'll be here soon to help you focus!", isBot: true }
  ]);

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    const userText = chatMessage.trim();
    const newMsg = { id: Date.now(), text: userText, isBot: false };
    setChatHistory(prev => [...prev, newMsg]);
    setChatMessage('');
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { id: Date.now() + 1, text: "AI functionality is coming soon! Check back later.", isBot: true }]);
    }, 500);
  };

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Nairobi',
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setNairobiTime(formatter.format(date));
      
      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Nairobi',
        hour: 'numeric',
        hour12: false
      });
      const hour = parseInt(hourFormatter.format(date), 10);
      
      if (hour >= 5 && hour < 12) setGreeting('Good morning 👋');
      else if (hour >= 12 && hour < 17) setGreeting('Good afternoon 👋');
      else setGreeting('Good evening 👋');
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all tasks using live query
  const { data: allTasks } = useLiveQuery(
    db.select().from(tasks).orderBy(desc(tasks.createdAt))
  );

  const todayTasks = allTasks || [];

  const handleToggleComplete = async (task: any) => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    await db.update(tasks)
      .set({ 
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date() : null
      })
      .where(eq(tasks.id, task.id));
  };

  const openNew = (rank: number | null = null) => {
    setEditingTask(null);
    setDefaultRank(rank);
    setModalVisible(true);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
      <ScrollView className="flex-1 px-5 pt-6 pb-20">
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className={`text-3xl font-bold ${isDark ? 'text-darkText' : 'text-text'} mb-1`}>{greeting}</Text>
            <Text className="text-primary text-2xl font-black tracking-tight">{nairobiTime}</Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <TouchableOpacity onPress={toggleColorScheme} className={`${isDark ? 'bg-darkCard border-gray-800' : 'bg-card border-gray-100'} w-10 h-10 rounded-full items-center justify-center border shadow-sm`}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color="#0ea5e9" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/capture')} className="bg-primary/10 w-10 h-10 rounded-full items-center justify-center">
              <Ionicons name="add" size={24} color="#0ea5e9" />
            </TouchableOpacity>
          </View>
        </View>

        {/* To Do List */}
        <View className="mb-10">
          <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-3 ml-1">To Do</Text>

          {todayTasks.length === 0 ? (
            <View className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-3xl p-8 items-center border ${isDark ? 'border-gray-800' : 'border-gray-100'} shadow-sm mb-4`}>
              <View className={`w-16 h-16 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-full items-center justify-center mb-4`}>
                <Ionicons name="checkmark-done" size={32} color="#0ea5e9" />
              </View>
              <Text className={`text-lg font-bold ${isDark ? 'text-darkText' : 'text-text'} mb-2`}>No tasks for today.</Text>
              <Text className="text-muted text-center mb-6">Add one small thing to get started.</Text>
              
              <TouchableOpacity 
                className="bg-primary px-6 py-3 rounded-xl flex-row items-center"
                onPress={() => openNew(null)}
              >
                <Ionicons name="add" size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold">Add Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-2xl border ${isDark ? 'border-gray-800' : 'border-gray-100'} overflow-hidden shadow-sm`}>
              {todayTasks.map((task, index) => (
                <View key={task.id} className={`flex-row items-center p-4 ${index !== todayTasks.length - 1 ? `border-b ${isDark ? 'border-gray-800' : 'border-gray-50'}` : ''}`}>
                  <TouchableOpacity onPress={() => handleToggleComplete(task)} className="mr-4">
                    {task.status === 'COMPLETED' ? (
                      <View className="w-6 h-6 rounded-full bg-success/20 items-center justify-center">
                        <Ionicons name="checkmark" size={14} color="#22c55e" />
                      </View>
                    ) : (
                      <View className={`w-6 h-6 rounded-full border-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity className="flex-1" onPress={() => router.push(`/task/${task.id}`)}>
                    <View className="flex-row items-center flex-wrap">
                      <Text className={`text-base font-medium ${task.status === 'COMPLETED' ? 'text-muted line-through' : isDark ? 'text-darkText' : 'text-text'} mr-2`}>
                        {task.title}
                      </Text>
                      {task.category && (
                        <View className={`px-2 py-0.5 rounded-md ${task.category === 'work' ? 'bg-orange-100 dark:bg-orange-900/30' : task.category === 'class' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                          <Text className={`text-[10px] font-bold uppercase tracking-wider ${task.category === 'work' ? 'text-orange-600 dark:text-orange-400' : task.category === 'class' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {task.category}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

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

          {todayTasks.length > 0 && (
            <TouchableOpacity 
              className={`mt-4 flex-row items-center justify-center p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-2xl border ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
              onPress={() => openNew(null)}
            >
              <Ionicons name="add" size={20} color="#6b7280" className="mr-2" />
              <Text className="font-bold text-muted">Add Task</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      <TaskFormModal 
        visible={modalVisible} 
        onClose={() => { setModalVisible(false); setEditingTask(null); setDefaultRank(null); }} 
        taskToEdit={editingTask} 
        defaultRank={defaultRank}
      />

      {/* Floating Chat Button */}
      <TouchableOpacity 
        className="absolute bottom-6 right-5 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        onPress={() => setChatVisible(true)}
      >
        <Ionicons name="chatbubbles" size={24} color="white" />
      </TouchableOpacity>

      {/* Chat Bot Modal */}
      <Modal visible={chatVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setChatVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
          <View className={`flex-row justify-between items-center px-4 py-4 border-b ${isDark ? 'border-gray-800 bg-darkCard' : 'border-gray-200 bg-white'}`}>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Ionicons name="sparkles" size={16} color="#0ea5e9" />
              </View>
              <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>HyperBot</Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => setChatHistory([{ id: 1, text: "Hi! I'm HyperBot. I'm currently under construction, but I'll be here soon to help you focus!", isBot: true }])} className={`p-2 mr-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setChatVisible(false)} className={`p-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <Ionicons name="close" size={20} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView className="flex-1 p-4">
            {chatHistory.map((msg) => (
              <View 
                key={msg.id} 
                className={`p-4 rounded-2xl max-w-[80%] mb-4 ${
                  msg.isBot 
                    ? `self-start rounded-tl-sm ${isDark ? 'bg-darkCard border border-gray-800' : 'bg-white border border-gray-100'} shadow-sm` 
                    : 'self-end rounded-tr-sm bg-primary shadow-sm'
                }`}
              >
                <Text className={`leading-5 ${msg.isBot ? (isDark ? 'text-darkText' : 'text-text') : 'text-white'}`}>
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View className={`p-4 border-t flex-row items-center ${isDark ? 'border-gray-800 bg-darkCard' : 'border-gray-200 bg-white'}`}>
            <TextInput 
              placeholder="Ask anything..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={chatMessage}
              onChangeText={setChatMessage}
              onSubmitEditing={handleSendChat}
              className={`flex-1 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'} px-4 py-3 rounded-full mr-3`}
            />
            <TouchableOpacity 
              onPress={handleSendChat}
              disabled={!chatMessage.trim()}
              className={`w-12 h-12 rounded-full items-center justify-center ${chatMessage.trim() ? 'bg-primary' : (isDark ? 'bg-gray-800' : 'bg-gray-200')}`}
            >
              <Ionicons name="send" size={18} color={chatMessage.trim() ? 'white' : '#9ca3af'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
