import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { authedFetch } from '../../src/api/client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

export default function ForumCategoriesScreen() {
  const { accessToken } = useAuthContext();
  const [groupedCategories, setGroupedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      console.log('📚 Loading forum categories...');
      const response = await authedFetch('/forums/categories');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Categories loaded:', data.groupedCategories);
      
      if (data.success) {
        setGroupedCategories(data.groupedCategories || {});
      }
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Convert to SectionList format
  const sectionData = Object.keys(groupedCategories).map(sectionName => ({
    title: sectionName,
    data: groupedCategories[sectionName]
  }));

  const renderSectionHeader = ({ section }) => (
    <View style={{
      backgroundColor: '#111',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#333'
    }}>
      <Text style={{
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold'
      }}>
        {section.title}
      </Text>
    </View>
  );

const renderCategory = ({ item }) => (
  <TouchableOpacity
    style={{
      backgroundColor: '#1a1a1a',
      padding: 16,
      marginHorizontal: 12,
      marginVertical: 6,
      borderRadius: 8,
    }}
    onPress={() => {
      console.log('🎯 Navigating to category:', item.slug);
      router.push(`/forums/category/${item.slug}`);
    }}
  >
    {/* Category Header */}
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
      {/* ✅ Icon Loader (handles both Ionicon + image URLs) */}
      {item.icon && (
        item.icon.startsWith('http') || item.icon.endsWith('.png') ? (
          <Image
            source={{
              uri: item.icon.startsWith('http')
                ? item.icon
                : `https://invid.au/images/forum/icons/${item.icon}`,
            }}
            style={{
              width: 22,
              height: 22,
              marginRight: 8,
              tintColor: '#ff4655', // optional tint to match theme
            }}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name={item.icon}
            size={20}
            color="#ff4655"
            style={{ marginRight: 8 }}
          />
        )
      )}

      {/* Title + Description */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
            {item.description}
          </Text>
        )}
      </View>
    </View>

    {/* Stats Row */}
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ alignItems: 'center', marginRight: 16 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            {item.thread_count}
          </Text>
          <Text style={{ color: '#888', fontSize: 12 }}>Threads</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            {item.post_count}
          </Text>
          <Text style={{ color: '#888', fontSize: 12 }}>Posts</Text>
        </View>
      </View>

      {/* Last Post */}
      {item.last_post && (
        <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 12 }}>
          <Text
            style={{ color: '#ccc', fontSize: 12, textAlign: 'right' }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.last_post.title}
          </Text>
          <Text style={{ color: '#666', fontSize: 11, textAlign: 'right' }}>
            {new Date(item.last_post.created_at).toLocaleDateString()} by{' '}
            {item.last_post.username}
          </Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff4655" />
        <Text style={{ color: 'white', marginTop: 16 }}>Loading forums...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SectionList
        sections={sectionData}
        renderItem={renderCategory}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff4655']}
            tintColor="#ff4655"
          />
        }
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#888' }}>No forums available</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        stickySectionHeadersEnabled={true}
      />
    </View>
  );
}