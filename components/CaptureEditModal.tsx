import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../db';
import { captures } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';

interface CaptureEditModalProps {
  visible: boolean;
  onClose: () => void;
  captureToEdit: any;
}

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

export default function CaptureEditModal({ visible, onClose, captureToEdit }: CaptureEditModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [color, setColor] = useState('#6b7280');

  useEffect(() => {
    if (captureToEdit) {
      setContent(captureToEdit.content || '');
      setImageUri(captureToEdit.imageUri || null);
      setColor(captureToEdit.color || '#6b7280');
    }
  }, [captureToEdit, visible]);

  const handleSave = async () => {
    if (!content.trim() && !imageUri) return;

    try {
      await db.update(captures).set({
        content,
        imageUri,
        color,
        updatedAt: new Date(),
      }).where(eq(captures.id, captureToEdit.id));
      onClose();
    } catch (e) {
      console.error('Error updating capture:', e);
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={`flex-1 ${isDark ? 'bg-darkBg' : 'bg-background'}`}>
        <View className={`flex-row justify-between items-center px-4 py-4 border-b ${isDark ? 'border-gray-800 bg-darkCard' : 'border-gray-200 bg-white'}`}>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-primary font-medium text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="font-bold text-lg">Edit Capture</Text>
          <TouchableOpacity onPress={handleSave} className="p-2">
            <Text className={`font-bold text-lg ${(content.trim() || imageUri) ? 'text-primary' : 'text-gray-400'}`}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <TextInput
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`text-xl ${isDark ? 'text-white' : 'text-text'} font-medium mb-6`}
            placeholder="What's on your mind?"
            multiline
            autoFocus
            value={content}
            onChangeText={setContent}
            style={{ textAlignVertical: 'top', minHeight: 120 }}
          />

          {imageUri && (
            <View className="mb-6 relative">
              <Image source={{ uri: imageUri }} className="w-full h-48 rounded-2xl" resizeMode="cover" />
              <TouchableOpacity 
                className="absolute top-2 right-2 bg-black/50 w-8 h-8 rounded-full items-center justify-center"
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            className={`flex-row items-center ${isDark ? 'bg-darkCard' : 'bg-card'} p-4 rounded-xl border ${isDark ? 'border-gray-800' : 'border-gray-100'} shadow-sm mb-8`}
            onPress={pickImage}
          >
            <Ionicons name="image-outline" size={24} color="#0ea5e9" className="mr-3" />
            <Text className={`font-medium ${isDark ? 'text-darkText' : 'text-text'}`}>{imageUri ? 'Change Image' : 'Add Image'}</Text>
          </TouchableOpacity>

          <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3 ml-1">Color Tag</Text>
          <View className="flex-row flex-wrap gap-3 mb-8">
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setColor(c.value)}
                style={[{ backgroundColor: c.value }, color === c.value ? { borderWidth: 3, borderColor: '#111827' } : {}]}
                className="w-10 h-10 rounded-full"
              />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
