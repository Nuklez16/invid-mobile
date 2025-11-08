// app/forums/topic/[id].js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Animated
} from 'react-native';
import { useAuthContext } from '../../../src/context/AuthContext';
import { authedFetch } from '../../../src/api/client';
import { router, useLocalSearchParams, useNavigation } from 'expo-router'; // ✅ added useNavigation
import { Ionicons } from '@expo/vector-icons';

const HIGHLIGHT_DURATION = 1500;

export default function TopicScreen() {
  const { id, highlight, scrollToPost } = useLocalSearchParams();
  const { accessToken } = useAuthContext();
  const navigation = useNavigation(); // ✅ define navigation instance here

  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const flatListRef = useRef(null);
  const jumpedRef = useRef(false);
  const [highlightAnim] = useState(new Animated.Value(0));
  const [showScrollTop, setShowScrollTop] = useState(false);

  const targetPostId = parseInt(scrollToPost || highlight || 0, 10);

  // ✅ Dynamically update title once topic is loaded
  useEffect(() => {
    if (topic?.title) {
      navigation.setOptions({ title: topic.title });
    }
  }, [topic, navigation]);

  // ───────────────────────────────
  const loadTopic = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append) setLoading(true);
        const response = await authedFetch(`/forums/topic/${id}?page=${pageNum}`);
        const data = await response.json();

        if (data.success) {
          setTopic(data.topic);
          setIsWatching(data.isWatching ?? data.is_watching ?? false);

          const p = data.pagination || {};
          const currentPage = p.current_page ?? p.page ?? pageNum;
          const total = p.total_pages ?? p.totalPages ?? 1;

          if (append) {
            setPosts((prev) => [...prev, ...(data.posts || [])]);
          } else {
            setPosts(data.posts || []);
          }

          setPage(currentPage);
          setTotalPages(total);
          setHasMore(currentPage < total);
        }
      } catch (error) {
        console.error('❌ Failed to load topic:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [id, accessToken]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTopic(1, false);
  }, [loadTopic]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadTopic(page + 1, true);
  };

  useEffect(() => {
    loadTopic(1);
  }, [loadTopic]);

  // ───────────────────────────────
  const toggleWatch = async () => {
    try {
      const response = await authedFetch(`/forums/topic/${id}/watch`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setIsWatching(data.watching);
      }
    } catch (error) {
      console.error('Failed to toggle watch:', error);
    }
  };

const voteOnPost = async (postId, direction) => {
  try {
    const targetIndex = posts.findIndex(p => p.id === postId);
    if (targetIndex === -1) return;

    const targetPost = posts[targetIndex];
    const prevVote = targetPost.user_vote;
    const authorId = targetPost.user_id;

    // --- Optimistic local update ---
    let upvotes = targetPost.reputation.upvotes;
    let downvotes = targetPost.reputation.downvotes;

    if (direction === 'up') {
      if (prevVote === 'down') downvotes -= 1;
      if (prevVote !== 'up') upvotes += 1;
    } else if (direction === 'down') {
      if (prevVote === 'up') upvotes -= 1;
      if (prevVote !== 'down') downvotes += 1;
    }

    const total = upvotes + downvotes;
    const percentage = total > 0 ? Math.round((upvotes / total) * 100) : 0;

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              user_vote: direction,
              reputation: { upvotes, downvotes, percentage },
            }
          : p
      )
    );

    // --- Send to backend ---
    const res = await authedFetch(`/forums/post/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });
    const data = await res.json();

    if (!data.success) {
      Alert.alert('Vote Failed', data.message || 'Unable to register vote.');
      return;
    }

    // --- Apply confirmed results to all posts by same author ---
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          // Current post
          return {
            ...p,
            user_vote: data.direction,
            reputation: {
              upvotes: data.upvotes,
              downvotes: data.downvotes,
              percentage: data.percentage,
            },
            author: {
              ...p.author,
              total_reputation: data.totalRep,
            },
          };
        } else if (p.author && p.author.username === targetPost.author.username) {
          // Other posts by same author
          return {
            ...p,
            author: {
              ...p.author,
              total_reputation: data.totalRep,
            },
          };
        }
        return p;
      })
    );
  } catch (error) {
    console.error('❌ Vote failed:', error);
    Alert.alert('Error', 'Failed to submit vote.');
  }
};

  const deletePost = async (postId) => {
    try {
      await authedFetch(`/forums/post/${postId}`, { method: 'DELETE' });
      await loadTopic(1);
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const openPostActions = (post) => {
    const options = [];
    if (post.can_edit) {
      options.push({ text: 'Edit', onPress: () => router.push(`/forums/edit?post=${post.id}`) });
    }
    if (post.can_delete) {
      options.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePost(post.id)
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Post Actions', '', options);
  };

  // ───────────────────────────────
  const renderPost = ({ item, index }) => {
  const isHighlighted = item.id === targetPostId;
  const bgColor = isHighlighted
    ? highlightAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#222', '#ff465520']
      })
    : '#1a1a1a';

  return (
    <Animated.View
      style={{
        backgroundColor: bgColor,
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 8,
        overflow: 'hidden'
      }}
    >
      {/* ─── Header ─── */}
      <View
        style={{
          backgroundColor: '#111',
          padding: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Left: Avatar + Username */}
        <TouchableOpacity
          onPress={() => router.push(`/user-profile?username=${item.author.username}`)}
          style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}
          activeOpacity={0.7}
        >
         <Image
  source={{
    uri:
      item.author.avatar
        ? item.author.avatar.startsWith('http')
          ? item.author.avatar
          : `https://invid.au/${item.author.avatar.replace(/^\/+/, '')}`
        : 'https://invid.au/uploads/avatars/default.png'
  }}
  style={{
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    borderColor: item.author.is_online ? '#4CAF50' : '#222'
  }}
/>
          <View style={{ flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#ff4655', fontWeight: 'bold', fontSize: 14 }}>
                {item.author.username}
              </Text>
              {item.author.is_online && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#4CAF50',
                    marginLeft: 6
                  }}
                />
              )}
              {index === 0 && (
                <Text style={{ color: '#ff4655', fontSize: 12, marginLeft: 6 }}>
                  OP
                </Text>
              )}
            </View>
            <Text style={{ color: '#888', fontSize: 12 }}>
              {item.author.post_count} posts • ⭐ {item.author.total_reputation || 0}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right: Timestamp */}
        <Text style={{ color: '#888', fontSize: 12 }}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>

      {/* ─── Content ─── */}
      <View style={{ padding: 16 }}>
        <Text style={{ color: 'white', lineHeight: 20 }}>
          {item.content.replace(/<[^>]*>/g, '')}
        </Text>
      </View>

      {/* ─── Footer ─── */}
      <View
        style={{
          backgroundColor: '#111',
          padding: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: '#333'
        }}
      >
        {/* Votes */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ marginRight: 12 }}
            onPress={() => voteOnPost(item.id, 'up')}
            disabled={item.user_vote === 'up'}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={item.user_vote === 'up' ? '#4CAF50' : '#888'}
            />
          </TouchableOpacity>
          <Text style={{ color: 'white', marginRight: 12 }}>
            {item.reputation.upvotes - item.reputation.downvotes}
          </Text>
          <TouchableOpacity
            onPress={() => voteOnPost(item.id, 'down')}
            disabled={item.user_vote === 'down'}
          >
            <Ionicons
              name="arrow-down"
              size={20}
              color={item.user_vote === 'down' ? '#ff4655' : '#888'}
            />
          </TouchableOpacity>
        </View>

        {/* Reply + Reputation + Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/forums/reply',
                params: { topic: id, quote: item.id }
              })
            }
          >
            <Ionicons
              name="chatbox-ellipses-outline"
              size={18}
              color="#888"
              style={{ marginRight: 12 }}
            />
          </TouchableOpacity>

          <Text style={{ color: '#888', fontSize: 12, marginRight: 8 }}>
            {item.reputation.percentage}% 👍
          </Text>

          {(item.can_edit || item.can_delete) && (
            <TouchableOpacity onPress={() => openPostActions(item)}>
              <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 400); // show button after some scroll
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // ───────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff4655" />
        <Text style={{ color: 'white', marginTop: 16 }}>Loading topic...</Text>
      </View>
    );
  }

  // ───────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {topic && (
        <View style={{ padding: 16, backgroundColor: '#111' }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
            {topic.title}
          </Text>
          <Text style={{ color: '#888' }}>
            {topic.reply_count} replies • {topic.view_count} views • 👁️ {topic.viewing_count}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        onScroll={handleScroll}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff4655']}
            tintColor="#ff4655"
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator color="#ff4655" />
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingVertical: 12,
          paddingBottom: topic?.can_reply ? 100 : 20
        }}
      />

      {/* Watch button */}
      {topic && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: isWatching ? '#333' : '#ff4655',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center'
          }}
          onPress={toggleWatch}
        >
          <Ionicons
            name={isWatching ? 'eye' : 'eye-outline'}
            size={16}
            color="white"
            style={{ marginRight: 4 }}
          />
          <Text style={{ color: 'white', fontSize: 12 }}>
            {isWatching ? 'Watching' : 'Watch'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Reply FAB */}
      {topic?.can_reply && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            backgroundColor: '#ff4655',
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 8
          }}
          onPress={() => router.push(`/forums/reply?topic=${id}`)}
        >
          <Ionicons name="create" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Scroll-to-top button */}
      {showScrollTop && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: topic?.can_reply ? 100 : 20,
            right: 20,
            backgroundColor: '#222',
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.9
          }}
          onPress={scrollToTop}
        >
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
