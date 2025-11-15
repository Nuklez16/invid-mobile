// app/messages/[conversationId].js
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import styles from "../../src/styles/messageStyles";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useNavigation,
  useLocalSearchParams,
} from "expo-router";

import { useAuthContext } from "../../src/context/AuthContext";
import { authedFetch } from "../../src/api/client";
import SecureAvatar from "../../src/components/SecureAvatar";

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams();
  const { user } = useAuthContext();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const flatListRef = useRef(null);

  // Load conversation
  const loadConversation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authedFetch(
        `/messages/conversations/${conversationId}?page=1&pageSize=50`
      );
      const data = await res.json();

      setConversation(data);
      setMessages(data.messages || []);

      navigation.setOptions({
        title: data.conversationName || "Conversation",
      });
    } catch (err) {
      console.warn("Failed to load conversation", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Send message
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);

    const optimistic = {
      id: `local-${Date.now()}`,
      message: trimmed,
      mediaUrls: [],
      senderId: user.id,
      senderUsername: user.username,
      senderAvatar: user.avatar,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setText("");

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const res = await authedFetch("/messages/send", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          message: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        console.warn("Send failed", data.error);
        return;
      }

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== optimistic.id)
          .concat({
            id: data.id,
            message: data.message,
            mediaUrls: data.mediaUrls,
            senderId: data.senderId,
            senderUsername: data.senderUsername,
            senderAvatar: data.senderAvatar,
            createdAt: data.createdAt,
          })
      );
    } catch (err) {
      console.warn("Error sending message", err);
    } finally {
      setSending(false);
    }
  };

  // Render messages
  const renderItem = ({ item }) => {
    const isMine = Number(item.senderId) === Number(user.id);

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowTheirs,
        ]}
      >
        {!isMine && (
          <SecureAvatar
            path={item.senderAvatar}
            size={34}
            style={styles.avatar}
          />
        )}

        <View style={styles.messageBubbleWrapper}>
          <View
            style={[
              styles.messageBubble,
              isMine && styles.messageBubbleMine,
            ]}
          >
            <Text style={styles.messageText}>{item.message}</Text>
          </View>

          <Text style={styles.messageMeta}>
            {item.senderUsername}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color="#ff4655" />
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Conversation not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* INPUT BAR */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor="#888"
              multiline
            />

            <TouchableOpacity
              onPress={send}
              disabled={sending || !text.trim()}
            >
              <Text
                style={[
                  styles.sendButton,
                  (!text.trim() || sending) && styles.sendButtonDisabled,
                ]}
              >
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
