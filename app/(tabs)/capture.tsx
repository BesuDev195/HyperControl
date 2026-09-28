import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../db';
import { captures } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import CaptureEditModal from '../../components/CaptureEditModal';
import { useColorScheme } from 'nativewind';

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

export default function CaptureScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [color, setColor] = useState('#6b7280');
  const [captured, setCaptured] = useState(false);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [captureToEdit, setCaptureToEdit] = useState(null);

  // Fetch captures
  const { data: allCaptures } = useLiveQuery(
    db.select().from(captures).orderBy(desc(captures.createdAt))
  );

  const savedCaptures = allCaptures || [];

  const handleCapture = async () => {
    if (!text.trim() && !imageUri) return;
    
    try {
      await db.insert(captures).values({
        content: text.trim() || '📸 Image captured',
        imageUri,
        color,
        createdAt: new Date(),
      });

      setCaptured(true);
      setTimeout(() => {
        setText('');
        setImageUri(null);
        setColor('#6b7280');
        setCaptured(false);
      }, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete this capture?', '', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          await db.delete(captures).where(eq(captures.id, id));
        }
      }
    ]);
  };

  const openEdit = (cap: any) => {
    setCaptureToEdit(cap);
    setEditModalVisible(true);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-8" keyboardShouldPersistTaps="handled">
          
          <View className="mb-8">
            <Text className={`text-4xl font-bold ${isDark ? 'text-darkText' : 'text-text'} mb-2`}>Capture</Text>
            <Text className="text-muted text-lg">Don't organize it yet. Just capture it.</Text>
          </View>

          {captured ? (
            <View className="items-center justify-center py-10 mb-10 bg-success/10 rounded-3xl border border-success/20">
              <View className="w-16 h-16 rounded-full bg-success/20 items-center justify-center mb-3">
                <Ionicons name="checkmark" size={32} color="#22c55e" />
              </View>
              <Text className="text-xl font-bold text-success">Captured ✓</Text>
            </View>
          ) : (
            <View className={`mb-10 ${isDark ? 'bg-darkCard border-gray-800' : 'bg-white border-gray-100'} rounded-3xl p-5 shadow-sm border`}>
              <TextInput
                className={`text-xl ${isDark ? 'text-white' : 'text-text'} font-medium mb-4`}
                placeholder="What's on your mind?"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                multiline
                value={text}
                onChangeText={setText}
                style={{ textAlignVertical: 'top', minHeight: 100 }}
              />

              {imageUri && (
                <View className="mb-4 relative">
                  <Image source={{ uri: imageUri }} className="w-full h-40 rounded-2xl" resizeMode="cover" />
                  <TouchableOpacity 
                    className="absolute top-2 right-2 bg-black/50 w-8 h-8 rounded-full items-center justify-center"
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}

              <View className="flex-row items-center justify-between mt-2 pt-4 border-t border-gray-100">
                <View className="flex-row space-x-3">
                  <TouchableOpacity onPress={pickImage} className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                    <Ionicons name="image" size={20} color="#0ea5e9" />
                  </TouchableOpacity>

                  {/* Simple Color Picker toggle or just map colors in a scrollview */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-w-[150px]">
                    <View className="flex-row items-center space-x-2 py-1">
                      {COLORS.map((c) => (
                        <TouchableOpacity
                          key={c.value}
                          onPress={() => setColor(c.value)}
                          style={[{ backgroundColor: c.value }, color === c.value ? { borderWidth: 2, borderColor: '#111827' } : {}]}
                          className="w-8 h-8 rounded-full"
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <TouchableOpacity 
                  className={`px-5 py-3 rounded-xl items-center justify-center ${(text.trim() || imageUri) ? 'bg-primary' : 'bg-gray-200'}`}
                  onPress={handleCapture}
                  disabled={!(text.trim() || imageUri)}
                >
                  <Text className={`font-bold text-sm ${(text.trim() || imageUri) ? 'text-white' : 'text-gray-400'}`}>
                    CAPTURE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Captured List */}
          <View className="pb-20">
            <Text className="text-sm font-bold text-muted uppercase tracking-widest mb-4 ml-1">Your Captures</Text>

            {savedCaptures.length === 0 ? (
              <View className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-3xl p-8 items-center border ${isDark ? 'border-gray-800' : 'border-gray-100'} shadow-sm opacity-60`}>
                <Ionicons name="chatbubble-ellipses-outline" size={32} color="#9ca3af" className="mb-4" />
                <Text className={`text-base font-medium ${isDark ? 'text-darkText' : 'text-text'} mb-1`}>Nothing captured yet.</Text>
                <Text className="text-muted text-center text-sm">When a thought pops into your head, put it here.</Text>
              </View>
            ) : (
              <View className="space-y-4">
                {savedCaptures.map((cap) => (
                  <View key={cap.id} className={`${isDark ? 'bg-darkCard' : 'bg-card'} rounded-2xl p-4 shadow-sm border ${isDark ? 'border-gray-800' : 'border-gray-100'} flex-row overflow-hidden`}>
                    <View style={[{ backgroundColor: cap.color || '#6b7280' }]} className="w-2 absolute top-0 bottom-0 left-0" />
                    
                    <View className="flex-1 ml-3 pr-2">
                      <Text className={`text-base ${isDark ? 'text-darkText' : 'text-text'} font-medium mb-2`}>{cap.content}</Text>
                      {cap.imageUri && (
                        <Image source={{ uri: cap.imageUri }} className="w-full h-32 rounded-xl mb-3 bg-gray-100" resizeMode="cover" />
                      )}
                      <Text className="text-xs text-muted">
                        {new Date(cap.createdAt).toLocaleDateString()} at {new Date(cap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <TouchableOpacity 
                      className="p-2 h-10"
                      onPress={() => {
                        Alert.alert('Capture Options', '', [
                          { text: 'Edit', onPress: () => openEdit(cap) },
                          { text: 'Delete', onPress: () => handleDelete(cap.id), style: 'destructive' },
                          { text: 'Cancel', style: 'cancel' }
                        ]);
                      }}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <CaptureEditModal
        visible={editModalVisible}
        onClose={() => { setEditModalVisible(false); setCaptureToEdit(null); }}
        captureToEdit={captureToEdit}
      />
    </SafeAreaView>
  );
}
