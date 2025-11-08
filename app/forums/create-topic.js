import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { authedFetch } from '../../src/api/client';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateTopicScreen() {
  const { category } = useLocalSearchParams();
  const { accessToken } = useAuthContext();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [titleError, setTitleError] = useState('');

  const bannerAnim = useRef(new Animated.Value(-80)).current;

  // ───────────────────────────────
  const handleCreateTopic = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Fields', 'Please enter both a title and some content.');
      return;
    }

    try {
      setLoading(true);
      const res = await authedFetch(`/forums/category/${category}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();

      // Backend warns for duplicate title (400)
      if (res.status === 400 && data.error?.includes('already exists')) {
        setTitleError('A topic with this title already exists. Please choose another.');
        setDuplicateWarning(true);
        Animated.spring(bannerAnim, { toValue: 0, useNativeDriver: false }).start();
        setTimeout(() => {
          Animated.timing(bannerAnim, {
            toValue: -80,
            duration: 300,
            useNativeDriver: false
          }).start();
        }, 4000);
        return;
      }

      if (data.success) {
        await AsyncStorage.removeItem('draft_topic');
        Alert.alert('✅ Topic Created', 'Your topic has been published!', [
          {
            text: 'View Topic',
            onPress: () => router.replace(`/forums/topic/${data.topic.id}`)
          }
        ]);
      } else {
        throw new Error(data.error || 'Unknown error creating topic.');
      }
    } catch (err) {
      console.error('Create topic failed:', err);
      Alert.alert('Error', err.message || 'Failed to create topic.');
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────
  const handleSaveDraft = async () => {
    try {
      await AsyncStorage.setItem(
        'draft_topic',
        JSON.stringify({ category, title, content })
      );
      Alert.alert('💾 Draft Saved', 'You can continue editing later.');
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  useEffect(() => {
    (async () => {
      const draft = await AsyncStorage.getItem('draft_topic');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.category === category) {
          setTitle(parsed.title);
          setContent(parsed.content);
        }
      }
    })();
  }, [category]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const canPost = title.trim().length >= 3 && content.trim().length >= 10;

  // ───────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Duplicate warning banner */}
      <Animated.View
        style={{
          position: 'absolute',
          top: bannerAnim,
          left: 0,
          right: 0,
          zIndex: 20,
          backgroundColor: '#ffb300',
          paddingVertical: 10,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#cc8a00'
        }}
      >
        <Text style={{ color: '#000', fontWeight: '600', fontSize: 14 }}>
          ⚠️ A topic with this title already exists. Please pick a new title.
        </Text>
      </Animated.View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color="#ff4655" />
            <Text style={{ color: '#ff4655', marginLeft: 6 }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>
            Create New Topic
          </Text>
          <Text style={{ color: '#888', marginTop: 4 }}>
            in {category?.toUpperCase()}
          </Text>
        </View>

        {/* Title */}
        <Text style={{ color: '#888', marginBottom: 6 }}>Title</Text>
        <TextInput
          placeholder="Enter topic title"
          placeholderTextColor="#555"
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            if (t.trim().length >= 3) setTitleError('');
          }}
          style={{
            backgroundColor: '#111',
            color: 'white',
            padding: 12,
            borderRadius: 8,
            marginBottom: 4,
            fontSize: 16,
            borderWidth: titleError ? 1 : 0,
            borderColor: titleError ? '#ff4655' : 'transparent'
          }}
        />
        {titleError ? (
          <Text style={{ color: '#ff4655', fontSize: 13, marginBottom: 10 }}>
            {titleError}
          </Text>
        ) : null}

        {/* Content */}
        <Text style={{ color: '#888', marginBottom: 6 }}>Content</Text>
        <TextInput
          placeholder="Write your post..."
          placeholderTextColor="#555"
          value={content}
          onChangeText={setContent}
          style={{
            backgroundColor: '#111',
            color: 'white',
            padding: 12,
            borderRadius: 8,
            minHeight: 200,
            textAlignVertical: 'top',
            fontSize: 15
          }}
          multiline
        />

        {/* Helper Row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8
          }}
        >
          <Text style={{ color: '#666', fontSize: 12 }}>
            You can include YouTube or image links — they’ll be auto-embedded.
          </Text>
          <Text style={{ color: '#555', fontSize: 12 }}>{wordCount} words</Text>
        </View>

        {/* Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 28
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              marginRight: 10,
              backgroundColor: '#333',
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={handleSaveDraft}
          >
            <Text style={{ color: 'white', fontSize: 15 }}>
              <Ionicons name="save-outline" size={16} color="white" /> Save Draft
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: canPost ? '#ff4655' : '#222',
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1
            }}
            disabled={!canPost || loading}
            onPress={handleCreateTopic}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold' }}>
                Post Topic
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
