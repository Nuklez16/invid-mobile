// app/forums/category/[slug].js
import React, { useEffect, useState, useCallback, useRef } from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '../../../src/context/AuthContext';
import { authedFetch } from '../../../src/api/client';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryScreen() {

  const { slug } = useLocalSearchParams();
  const navigation = useNavigation();
  const { accessToken } = useAuthContext();

  const [category, setCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const flatListRef = useRef(null);

  // ───────────────────────────────
  const loadCategory = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append) setLoading(true);
        console.log(`📖 Loading category: ${slug}, page ${pageNum}`);

        const response = await authedFetch(`/forums/category/${slug}?page=${pageNum}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setCategory(data.category);

          const p = data.pagination || {};
          const currentPage = p.current_page ?? p.page ?? pageNum;
          const total = p.total_pages ?? p.totalPages ?? 1;

          if (append) {
            setTopics(prev => [...prev, ...(data.topics || [])]);
          } else {
            setTopics(data.topics || []);
          }

          setPage(currentPage);
          setTotalPages(total);
          setHasMore(currentPage < total);
        }
      } catch (error) {
        console.error('❌ Failed to load category:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [slug, accessToken]
  );
  
  useEffect(() => {
  if (category?.name) {
    navigation.setOptions({ title: category.name });
  }
}, [category, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategory(1, false);
  }, [loadCategory]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadCategory(page + 1, true);
  };

  useEffect(() => {
    loadCategory(1);
  }, [loadCategory]);

  // ───────────────────────────────
  const renderTopic = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#1a1a1a',
        padding: 16,
        marginHorizontal: 12,
        marginVertical: 6,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: item.is_pinned
          ? '#ffd700'
          : item.is_locked
          ? '#ff4655'
          : '#333',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
      }}
      onPress={() => {
        console.log('🎯 Navigating to topic:', item.id);
        router.push(`/forums/topic/${item.id}`);
      }}
    >
      {/* Title + Status */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
       {Boolean(item.is_pinned) && (
  <Ionicons
    name="pin"
    size={16}
    color="#ffd700"
    style={{ marginRight: 6 }}
  />
)}
{Boolean(item.is_locked) && (
  <Ionicons
    name="lock-closed"
    size={16}
    color="#ff4655"
    style={{ marginRight: 6 }}
  />
)}
        <Text
          style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            flex: 1,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>

      {/* Author + Date */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() =>
            item.author?.username &&
            router.push(`/user-profile?username=${item.author.username}`)
          }
          disabled={!item.author?.username}
        >
          <Text style={{ color: '#888', fontSize: 12 }}>
            by{' '}
            <Text style={{ color: '#ff4655' }}>
              {item.author?.username || 'Unknown'}
            </Text>
          </Text>
        </TouchableOpacity>

        <Text style={{ color: '#888', fontSize: 12 }}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Stats */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: item.last_post ? 4 : 0,
        }}
      >
        <Text style={{ color: '#ccc', fontSize: 12 }}>
          Replies: {item.reply_count || 0}
        </Text>
        <Text style={{ color: '#ccc', fontSize: 12 }}>
          Views: {item.view_count || 0}
        </Text>
        <Text style={{ color: '#ccc', fontSize: 12 }}>
          👁️ {item.viewing_count || 0}
        </Text>
      </View>

      {/* Last Reply */}
      {item.last_post && (
        <View
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: '#333',
          }}
        >
          <TouchableOpacity
            onPress={() =>
              item.last_post.username &&
              router.push(
                `/user-profile?username=${item.last_post.username}`
              )
            }
            disabled={!item.last_post.username}
          >
            <Text style={{ color: '#888', fontSize: 12 }}>
              Last reply by{' '}
              <Text style={{ color: '#ff4655' }}>
                {item.last_post.username || 'Unknown'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  // ───────────────────────────────
  const handleScroll = event => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 400);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // ───────────────────────────────
  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        edges={['bottom', 'left', 'right']}
      >
        <ActivityIndicator size="large" color="#ff4655" />
        <Text style={{ color: 'white', marginTop: 16 }}>
          Loading topics...
        </Text>
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        edges={['bottom', 'left', 'right']}
      >
        <Text style={{ color: 'white' }}>Category not found</Text>
        <TouchableOpacity
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: '#ff4655',
            borderRadius: 6,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────
  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      {/* Category Header */}
      <View style={{ padding: 16, backgroundColor: '#111' }}>
        <Text
          style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          {category.name}
        </Text>
        <Text style={{ color: '#888', marginTop: 4 }}>
          {category.description}
        </Text>
      </View>

      {/* Topics List */}
      <FlatList
        ref={flatListRef}
        data={topics}
        renderItem={renderTopic}
        keyExtractor={item => item.id.toString()}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
            <View
              style={{
                padding: 20,
                alignItems: 'center',
              }}
            >
              <ActivityIndicator color="#ff4655" />
              <Text
                style={{ color: '#888', marginTop: 8, fontSize: 12 }}
              >
                Loading more topics...
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View
            style={{
              padding: 40,
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="chatbox-outline"
              size={36}
              color="#555"
            />
            <Text
              style={{
                color: '#888',
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              No topics in this category yet.
            </Text>
            {category?.can_post && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#ff4655',
                  borderRadius: 6,
                }}
                onPress={() =>
                  router.push(
                    `/forums/create-topic?category=${slug}`
                  )
                }
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Create First Topic
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={{
          paddingVertical: 12,
          paddingBottom: category?.can_post ? 100 : 20,
        }}
      />

      {/* Create Topic FAB */}
      {category?.can_post && (
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
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
          }}
          onPress={() =>
            router.push(
              `/forums/create-topic?category=${slug}`
            )
          }
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}

      {/* Scroll-to-top button */}
      {showScrollTop && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: category?.can_post ? 100 : 20,
            right: 20,
            backgroundColor: '#222',
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.95,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 6,
          }}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
