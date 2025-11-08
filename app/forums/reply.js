// app/forums/reply.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { authedFetch } from '../../src/api/client';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
export default function ReplyScreen() {
  const { topic, quote } = useLocalSearchParams();
  const { accessToken } = useAuthContext();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [topicData, setTopicData] = useState(null);
  const [quotedPost, setQuotedPost] = useState(null);

  // ───────────────────────────────
  // Load topic details and quoted post if applicable
  useEffect(() => {
    const loadData = async () => {
      try {
        const topicResponse = await authedFetch(`/forums/topic/${topic}`);
        const topicResult = await topicResponse.json();

        if (topicResult.success) {
          setTopicData(topicResult.topic);
        }

        // Load quoted post if quote parameter exists
        if (quote) {
          const posts = topicResult.posts || [];
          const quoted = posts.find(p => p.id === parseInt(quote));
          if (quoted) {
            setQuotedPost(quoted);
            setContent(`[quote="${quoted.author.username}"]\n${quoted.content}\n[/quote]\n\n`);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [topic, quote]);

  // ───────────────────────────────
 const handleSubmit = async () => {
  if (!content.trim()) {
    Alert.alert('Error', 'Please enter some content');
    return;
  }

  if (content.trim().length < 10) {
    Alert.alert('Error', 'Reply must be at least 10 characters long');
    return;
  }

  setLoading(true);

  try {
    const response = await authedFetch(`/forums/reply?topic=${topic}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      router.replace(
        `/forums/topic/${result.redirect.topic_id}?highlight=${result.redirect.post_id}&scrollToPost=${result.redirect.post_id}&justPosted=true`
      );
    } else {
      Alert.alert('Error', result.error || result.message || 'Failed to post reply');
    }
  } catch (error) {
    console.error('❌ Reply error:', error);
    Alert.alert('Error', 'Failed to post reply. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // ───────────────────────────────
  const handleCancel = () => {
  // Add gentle haptic tap if supported
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }

  if (content.trim().length > 0) {
    // Use Alert.confirm-like behavior that works on all platforms
    Alert.alert(
      'Discard Reply?',
      'You have unsaved changes. Are you sure you want to discard?',
      [
        {
          text: 'Keep Editing',
          style: 'cancel',
          onPress: () => {}, // do nothing
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            router.back();
          },
        },
      ],
      { cancelable: true }
    );
  } else {
    router.back();
  }
};

  // ───────────────────────────────
  const removeQuote = () => {
    setQuotedPost(null);
    const withoutQuote = content.replace(
      `[quote="${quotedPost?.author.username}"]\n${quotedPost?.content}\n[/quote]\n\n`,
      ''
    );
    setContent(withoutQuote || '');
  };

  // ───────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: '#111',
          padding: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#333'
        }}
      >
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {topicData ? `Reply to: ${topicData.title}` : 'New Reply'}
        </Text>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !content.trim() || content.length < 10}
          style={{ opacity: (loading || !content.trim() || content.length < 10) ? 0.5 : 1 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ff4655" />
          ) : (
            <Text style={{ color: '#ff4655', fontSize: 16, fontWeight: 'bold' }}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Quoted Post Preview */}
        {quotedPost && (
          <View
            style={{
              backgroundColor: '#1a1a1a',
              margin: 16,
              padding: 12,
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#ff4655'
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <Text style={{ color: '#ff4655', fontSize: 12, marginBottom: 4, flex: 1 }}>
                Quoting {quotedPost.author.username}:
              </Text>
              <TouchableOpacity onPress={removeQuote} style={{ padding: 4 }}>
                <Ionicons name="close" size={16} color="#888" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#888', fontSize: 14, fontStyle: 'italic' }}>
              {quotedPost.content.replace(/<[^>]*>/g, '').substring(0, 100)}
              {quotedPost.content.length > 100 ? '...' : ''}
            </Text>
          </View>
        )}

        {/* Reply Editor */}
        <View style={{ padding: 16 }}>
          <TextInput
            style={{
              backgroundColor: '#1a1a1a',
              color: '#fff',
              fontSize: 16,
              padding: 16,
              borderRadius: 8,
              minHeight: 200,
              textAlignVertical: 'top'
            }}
            multiline
            placeholder="Type your reply here..."
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            autoFocus={!quote}
          />

          {/* Character Count */}
          <Text
            style={{
              color: content.length < 10 ? '#ff4655' : '#888',
              fontSize: 12,
              marginTop: 8,
              textAlign: 'right'
            }}
          >
            {content.length} characters (minimum: 10)
            {content.length < 10 && ` - ${10 - content.length} more needed`}
          </Text>

          {/* Formatting Help */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>
              Formatting Help:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {['Bold', 'Italic', 'Underline', 'Quote', 'Code'].map((format) => (
                <TouchableOpacity
                  key={format}
                  style={{
                    backgroundColor: '#333',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    marginRight: 8,
                    marginBottom: 8
                  }}
                  onPress={() => {
                    const formats = {
                      Bold: '**bold text**',
                      Italic: '*italic text*',
                      Underline: '__underline__',
                      Quote: '[quote="username"]quote text[/quote]',
                      Code: '[code]code here[/code]'
                    };
                    setContent((prev) => prev + formats[format] + ' ');
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12 }}>{format}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>


      {/* Bottom Bar */}
      <SafeAreaView
        edges={['bottom', 'left', 'right']}
        mode="padding"
        style={{
          backgroundColor: '#111',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: '#333',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Cancel Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#333',
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderRadius: 8,
              flex: 1,
              marginRight: 8,
            }}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: '#fff',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 15,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          {/* Post Button */}
          <TouchableOpacity
            style={{
              backgroundColor:
                content.trim() && content.length >= 10 ? '#ff4655' : '#333',
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderRadius: 8,
              flex: 1,
              marginLeft: 8,
            }}
            onPress={handleSubmit}
            disabled={loading || !content.trim() || content.length < 10}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color:
                  content.trim() && content.length >= 10 ? '#fff' : '#666',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 15,
              }}
            >
              {loading ? 'Posting...' : 'Post Reply'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
