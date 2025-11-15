// app/messages/index.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useAuthContext } from "../../src/context/AuthContext";
import { authedFetch } from "../../src/api/client";
import SecureAvatar from "../../src/components/SecureAvatar";
import styles from "../../src/styles/messageListStyles";  // ✅ your stylesheet

export default function MessagesInboxScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authedFetch("/messages/conversations");

      if (res.status === 204) {
        setConversations([]);
        return;
      }

      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.warn("❌ Failed to load conversations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({ title: "Messages" });
    loadConversations();
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  // ⭐ FIX: mark read immediately + call backend
  const openConversation = async (conversationId) => {
    // Instant UI update
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? { ...c, unreadCount: 0 }
          : c
      )
    );

    // Call backend to clear unread state
    try {
      await authedFetch(
        `/messages/conversations/${conversationId}/mark-read`,
        { method: "POST" }
      );
    } catch (err) {
      console.warn("❌ Failed to mark conversation read:", err);
    }

    // Navigate to chat screen
    router.push({
      pathname: "/messages/[conversationId]",
      params: { conversationId },
    });
  };

  const renderItem = ({ item }) => {
    const other = item.primaryParticipant;
    const isUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openConversation(item.conversationId)}
      >
        <SecureAvatar path={other?.avatar} size={48} />

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.username,
                isUnread && styles.usernameUnread,
              ]}
            >
              {other?.username || item.conversationName}
            </Text>

            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          <Text numberOfLines={1} style={styles.preview}>
            {item.lastSenderUsername
              ? `${item.lastSenderUsername}: ${item.lastMessage || ""}`
              : item.lastMessage || ""}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff4655" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No conversations yet.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
