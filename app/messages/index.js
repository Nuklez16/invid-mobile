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
import styles from "../../src/styles/messageListStyles";
import { SafeAreaView } from "react-native-safe-area-context";

// Time formatting helper
const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffInHours < 168) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
};

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
    navigation.setOptions({
      title: "Messages",
      headerStyle: {
        backgroundColor: '#0d0d0d',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: '600',
      },
    });
    loadConversations();
  }, [loadConversations, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const openConversation = async (conversationId) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? { ...c, unreadCount: 0 }
          : c
      )
    );

    try {
      await authedFetch(
        `/messages/conversations/${conversationId}/mark-read`,
        { method: "POST" }
      );
    } catch (err) {
      console.warn("❌ Failed to mark conversation read:", err);
    }

    router.push({
      pathname: "/messages/[conversationId]",
      params: { conversationId },
    });
  };

  const renderItem = ({ item }) => {
    const participantCount = item.participants?.length || 0;
    const isGroup = participantCount > 2;
    const other = item.participants?.find((p) => Number(p.id) !== Number(user?.id)) || null;

    const displayName =
      item.conversationName ||
      (isGroup
        ? item.participants.map((p) => p.username).join(", ")
        : other?.username || "Conversation");

    // Determine if last message was from current user
    const lastMessageFromMe =
      item.lastSenderId && Number(item.lastSenderId) === Number(user.id);
    const hasMedia =
      (Array.isArray(item.lastMedia) && item.lastMedia.length > 0) ||
      (Array.isArray(item.lastMediaUrls) && item.lastMediaUrls.length > 0);
    
    // Build preview text with clear sender indication
    let previewText = "";
    if (lastMessageFromMe) {
      previewText = `You: ${item.lastMessage || (hasMedia ? "📎 Attachment" : "")}`;
    } else if (item.lastSenderUsername) {
      previewText = `${item.lastSenderUsername}: ${item.lastMessage || (hasMedia ? "📎 Attachment" : "")}`;
    } else {
      previewText = item.lastMessage || (hasMedia ? "📎 Attachment" : "");
    }

    const isUnread = (item.unreadCount || 0) > 0;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openConversation(item.conversationId)}
      >
        {isGroup ? (
          <View style={styles.avatarGroupContainer}>
            {item.participants.slice(0, 3).map((p, idx) => (
              <View
                key={p.id}
                style={[
                  styles.avatarGroupItem,
                  idx > 0 && { marginLeft: -12, zIndex: 3 - idx },
                ]}
              >
                <SecureAvatar path={p.avatar} size={40} />
              </View>
            ))}
          </View>
        ) : (
          <SecureAvatar path={other?.avatar} size={48} />
        )}

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.username,
                isUnread && styles.usernameUnread,
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            
            <View style={styles.headerRight}>
              {item.lastMessageAt && (
                <Text style={styles.timestamp}>
                  {formatMessageTime(item.lastMessageAt)}
                </Text>
              )}
              {isUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text 
            numberOfLines={1} 
            style={[
              styles.preview,
              lastMessageFromMe && styles.previewFromMe,
              isUnread && styles.previewUnread,
            ]}
          >
            {previewText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#ff4655" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No conversations yet.</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.conversationId)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ff4655"
              colors={["#ff4655"]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}