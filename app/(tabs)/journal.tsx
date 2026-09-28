import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../db';
import { journalEntries } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useColorScheme } from 'nativewind';

export default function JournalScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: allEntries } = useLiveQuery(
    db.select().from(journalEntries).orderBy(desc(journalEntries.createdAt))
  );

  const entries = allEntries || [];

  const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({});
  const toggleExpand = (id: number) => {
    setExpandedEntries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const openEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditTitle(entry.title || '');
    setEditContent(entry.content);
  };

  const handleUpdate = async () => {
    if (!editContent.trim() || !editingEntry) return;
    try {
      await db.update(journalEntries).set({
        title: editTitle.trim(),
        content: editContent.trim()
      }).where(eq(journalEntries.id, editingEntry.id));
      setEditingEntry(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.delete(journalEntries).where(eq(journalEntries.id, id));
      }}
    ]);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      await db.insert(journalEntries).values({
        title: title.trim() || 'Untitled Entry',
        content: content.trim(),
        question: 'How did today go?',
        createdAt: new Date(),
      });

      setSaved(true);
      setTimeout(() => {
        setTitle('');
        setContent('');
        setSaved(false);
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-8" keyboardShouldPersistTaps="handled">
          
          <View className="mb-8">
            <Text className={`text-4xl font-bold ${isDark ? 'text-darkText' : 'text-text'} mb-2`}>Journal</Text>
            <Text className="text-muted text-lg">Brain dump or daily review.</Text>
          </View>

          {saved ? (
            <View className="items-center justify-center py-10 mb-10 bg-blue-50/50 rounded-3xl border border-primary/20">
              <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-3">
                <Ionicons name="journal" size={32} color="#0ea5e9" />
              </View>
              <Text className="text-xl font-bold text-primary">Entry Saved</Text>
            </View>
          ) : (
            <View className={`mb-10 ${isDark ? 'bg-darkCard border-gray-800' : 'bg-white border-gray-100'} rounded-3xl p-5 shadow-sm border`}>
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-text'} mb-4`}>How did today go?</Text>
              
              <TextInput
                className={`text-xl font-bold ${isDark ? 'text-white' : 'text-text'} mb-3`}
                placeholder="Give it a title..."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={title}
                onChangeText={setTitle}
              />



              <TextInput
                className={`text-lg ${isDark ? 'text-white' : 'text-text'} mb-6`}
                placeholder="Write your thoughts..."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                multiline
                value={content}
                onChangeText={setContent}
                style={{ textAlignVertical: 'top', minHeight: 120 }}
              />

              <TouchableOpacity 
                className={`py-4 rounded-xl items-center justify-center ${content.trim() ? 'bg-primary' : 'bg-gray-200'}`}
                onPress={handleSave}
                disabled={!content.trim()}
              >
                <Text className={`font-bold text-base ${content.trim() ? 'text-white' : 'text-gray-400'}`}>
                  SAVE ENTRY
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="pb-20">
            <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4 ml-1">Past Entries</Text>
            
            {entries.length === 0 ? (
              <View className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-3xl p-8 items-center border ${isDark ? 'border-gray-800' : 'border-gray-100'} shadow-sm opacity-60`}>
                <Ionicons name="book-outline" size={32} color="#9ca3af" className="mb-4" />
                <Text className={`text-base font-medium ${isDark ? 'text-darkText' : 'text-text'} mb-1`}>No entries yet.</Text>
                <Text className="text-muted text-center text-sm">Write something to reflect later.</Text>
              </View>
            ) : (
              <View className="space-y-4">
                {entries.map((entry) => {
                  const isExpanded = expandedEntries[entry.id];
                  return (
                  <View key={entry.id} className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-2xl shadow-sm border ${isDark ? 'border-gray-800' : 'border-gray-100'} overflow-hidden`}>
                    <TouchableOpacity onPress={() => toggleExpand(entry.id)} className="p-5 flex-row items-center justify-between">
                      <View className="flex-1 mr-4">
                        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-text'} mb-1`} numberOfLines={1}>
                          {entry.title || 'Untitled Entry'}
                        </Text>
                        <Text className="text-xs font-bold text-primary uppercase tracking-wider">
                          {new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    
                    {isExpanded && (
                      <View className="px-5 pb-5 pt-0">
                        <Text className={`text-base ${isDark ? 'text-darkText' : 'text-text'} leading-relaxed mb-4`}>
                          {entry.content}
                        </Text>
                        <View className={`flex-row justify-end space-x-4 border-t pt-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                          <TouchableOpacity onPress={() => openEdit(entry)} className="px-2">
                            <Text className="text-primary font-bold">Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDelete(entry.id)} className="px-2">
                            <Text className="text-red-500 font-bold">Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )})}
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!editingEntry} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditingEntry(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
          <View className={`flex-row justify-between items-center px-4 py-4 border-b ${isDark ? 'border-gray-800 bg-darkCard' : 'border-gray-200 bg-white'}`}>
            <TouchableOpacity onPress={() => setEditingEntry(null)} className="p-2">
              <Text className="text-primary font-medium text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg">Edit Journal</Text>
            <TouchableOpacity onPress={handleUpdate} className="p-2">
              <Text className={`font-bold text-lg ${editContent.trim() ? 'text-primary' : 'text-gray-400'}`}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-5 pt-6">
            <TextInput
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`text-xl font-bold ${isDark ? 'text-white' : 'text-text'} mb-4`}
              placeholder="Title"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`text-lg ${isDark ? 'text-white' : 'text-text'}`}
              multiline
              autoFocus
              value={editContent}
              onChangeText={setEditContent}
              style={{ textAlignVertical: 'top', minHeight: 120 }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
