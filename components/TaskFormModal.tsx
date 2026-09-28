import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../db';
import { tasks } from '../db/schema';
import { eq } from 'drizzle-orm';
import { useColorScheme } from 'nativewind';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  taskToEdit?: any | null; // Pass null for new task
  defaultRank?: number | null;
}

export default function TaskFormModal({ visible, onClose, taskToEdit, defaultRank }: TaskFormModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('TODO');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'Medium');
      setStatus(taskToEdit.status || 'TODO');
      setCategory(taskToEdit.category || 'personal');
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate) : null);
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('TODO');
      setCategory('personal');
      setDueDate(null);
    }
  }, [taskToEdit, visible]);

  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      if (taskToEdit) {
        await db.update(tasks).set({
          title,
          description,
          priority,
          status,
          category,
          dueDate,
          updatedAt: new Date(),
          completedAt: status === 'COMPLETED' ? (taskToEdit.completedAt || new Date()) : null,
        }).where(eq(tasks.id, taskToEdit.id));
      } else {
        await db.insert(tasks).values({
          title,
          description,
          priority,
          status,
          category,
          dueDate,
          topPriorityRank: defaultRank || null,
          createdAt: new Date(),
          isToday: true, // Show in today's view by default
        });
      }

      onClose();
    } catch (e: any) {
      console.error('Error saving task:', e);
      Alert.alert('Error saving task', e.message || String(e));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
        <View className={`flex-row justify-between items-center px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isDark ? 'bg-darkCard' : 'bg-card'}`}>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-primary font-medium text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="font-bold text-lg">{taskToEdit ? 'Edit Task' : 'New Task'}</Text>
          <TouchableOpacity onPress={handleSave} className="p-2">
            <Text className={`font-bold text-lg ${title.trim() ? 'text-primary' : 'text-gray-400'}`}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="mb-6">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">Title</Text>
            <TextInput
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`${isDark ? 'bg-darkCard' : 'bg-card'} px-4 py-4 rounded-xl border ${isDark ? 'border-gray-800' : 'border-gray-100'} text-lg ${isDark ? 'text-white' : 'text-black'}`}
              placeholder="What needs to be done?"
              value={title}
              onChangeText={setTitle}
              autoFocus={!taskToEdit}
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">Description (Optional)</Text>
            <TextInput
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`${isDark ? 'bg-darkCard' : 'bg-card'} px-4 py-4 rounded-xl border ${isDark ? 'border-gray-800' : 'border-gray-100'} text-base ${isDark ? 'text-white' : 'text-black'}`}
              placeholder="Add more details..."
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          <View className="flex-row mb-6 space-x-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">Priority</Text>
              <View className="flex-row space-x-2">
                {['High', 'Medium', 'Low'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    className={`flex-1 py-3 items-center justify-center rounded-xl border ${priority === p ? 'bg-primary border-primary' : 'bg-card border-gray-200'}`}
                  >
                    <Text className={`font-medium ${priority === p ? 'text-white' : 'text-muted'}`}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">Status</Text>
            <View className="flex-row space-x-2">
              {['TODO', 'IN PROGRESS', 'COMPLETED'].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  className={`flex-1 py-3 items-center justify-center rounded-xl border ${status === s ? 'bg-secondary border-secondary' : 'bg-card border-gray-200'}`}
                >
                  <Text className={`font-medium text-xs ${status === s ? 'text-white' : 'text-muted'}`}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">Category</Text>
            <View className="flex-row space-x-2">
              {[
                { id: 'personal', label: 'Personal', icon: 'person' },
                { id: 'work', label: 'Work', icon: 'briefcase' },
                { id: 'class', label: 'Class', icon: 'school' }
              ].map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  className={`flex-1 py-3 flex-row items-center justify-center rounded-xl border ${category === c.id ? 'bg-indigo-500 border-indigo-500' : 'bg-card border-gray-200'}`}
                >
                  <Ionicons name={c.icon as any} size={14} color={category === c.id ? 'white' : '#6b7280'} style={{ marginRight: 6 }} />
                  <Text className={`font-medium text-xs ${category === c.id ? 'text-white' : 'text-muted'}`}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">Deadline</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              className={`${isDark ? 'bg-darkCard' : 'bg-card'} px-4 py-4 rounded-xl border flex-row justify-between items-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
            >
              <Text className={`text-base ${dueDate ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                {dueDate ? dueDate.toLocaleDateString() : 'No deadline'}
              </Text>
              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(null)}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDueDate(selectedDate);
                }}
              />
            )}
          </View>


        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
