// app/notifications.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useAuthContext } from '../src/context/AuthContext';
import NotificationItem from '../src/components/NotificationItem';
import { router, useNavigation } from 'expo-router';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native';
import { authedFetch } from '../src/api/client'; // Import authedFetch

const layoutWidth = Dimensions.get('window').width;

// Separate component to avoid re-renders
function NotificationList({ items, refreshing, onRefresh, emptyMessage, searchQuery, onClearSearch }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(n, i) => String(n.id ?? i)}
      renderItem={({ item }) => <NotificationItem note={item} />}
      contentContainerStyle={{ padding: 12, flexGrow: 1 }}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#ff4655']}
          tintColor="#ff4655"
        />
      }
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      ListEmptyComponent={
        <View style={{ padding: 16, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Text style={{ color: '#888', fontWeight: '600', textAlign: 'center' }}>
            {emptyMessage}
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              onPress={onClearSearch}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: '#ff4655', fontSize: 14 }}>
                Clear search
              </Text>
            </TouchableOpacity>
          )}
        </View>
      }
    />
  );
}

export default function NotificationsScreen() {
  const { isLoading, accessToken, logout } = useAuthContext();
  const navigation = useNavigation();

  const [unread, setUnread] = useState([]);
  const [read, setRead] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [index, setIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  };

  const markAllAsRead = async () => {
    try {
      const response = await authedFetch('/notifications/read-all', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      load(); // Reload notifications after marking all as read
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
      // If it's an auth error, the authedFetch should handle it automatically
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        unread.length > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={{ marginRight: 15 }}>
            <Text style={{ color: '#ff4655', fontWeight: 'bold' }}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        ) : null
      ),
    });
  }, [navigation, unread.length]);

  const load = useCallback(async () => {
    if (isLoading || !accessToken) return;
    
    let isMounted = true;
    
    try {
      const res = await authedFetch('/notifications'); // Use authedFetch instead of direct fetch

      if (!isMounted) return;

      if (res.status === 401) {
        console.log('🔐 Authentication failed, logging out...');
        // The authedFetch should handle refresh automatically, but if we still get 401, logout
        setTimeout(() => {
          logout();
        }, 1000);
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
      }

      const json = await res.json();
      if (!isMounted) return;

      const list = Array.isArray(json?.notifications)
        ? json.notifications
        : Array.isArray(json)
        ? json
        : [];

      const readItems = sortItems(list.filter(n => n.is_read));
      const unreadItems = sortItems(list.filter(n => !n.is_read));

      setRead(readItems);
      setUnread(unreadItems);
    } catch (e) {
      if (!isMounted) return;
      console.error('❌ Failed to load notifications:', e);
      setRead([]);
      setUnread([]);
    }
  }, [accessToken, isLoading, logout, sortOrder]);

  useEffect(() => {
    if (!isLoading && !accessToken) {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, accessToken]);

  useEffect(() => {
    if (!isLoading && accessToken) load();
  }, [isLoading, accessToken, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Filter notifications based on search query
  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filterByQuery = useCallback((note) => {
    if (!normalizedQuery) return true;

    const fields = [note.message, note.type, note.title];
    return fields.some((field) =>
      typeof field === 'string' && field.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const filteredUnread = useMemo(
    () => unread.filter(filterByQuery),
    [unread, filterByQuery]
  );

  const filteredRead = useMemo(
    () => read.filter(filterByQuery),
    [read, filterByQuery]
  );

  // Use useMemo for scenes to prevent re-renders
  const renderScene = useCallback(SceneMap({
    unread: () => (
      <NotificationList 
        items={filteredUnread}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyMessage={searchQuery ? 'No matching unread notifications' : 'No unread notifications'}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
      />
    ),
    read: () => (
      <NotificationList 
        items={filteredRead}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyMessage={searchQuery ? 'No matching read notifications' : 'No read notifications'}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
      />
    )
  }), [filteredUnread, filteredRead, refreshing, onRefresh, searchQuery]);

  const tabRoutes = [
    { key: 'unread', title: `Unread (${unread.length})` },
    { key: 'read', title: `Read (${read.length})` },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Search Bar */}
      <View style={{ padding: 12, backgroundColor: '#000' }}>
        <TextInput
          placeholder="Search notifications..."
          placeholderTextColor="#888"
          style={{
            backgroundColor: '#1a1a1a',
            padding: 12,
            borderRadius: 8,
            color: 'white',
            borderWidth: 1,
            borderColor: '#333',
          }}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* Sort Toggle */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        paddingVertical: 8,
        backgroundColor: '#1a1a1a',
        marginHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8
      }}>
        <TouchableOpacity 
          onPress={() => setSortOrder('desc')} 
          style={{ 
            marginHorizontal: 12,
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: sortOrder === 'desc' ? '#ff4655' : 'transparent',
            borderRadius: 6
          }}
        >
          <Text style={{ 
            color: sortOrder === 'desc' ? 'white' : '#888',
            fontWeight: sortOrder === 'desc' ? 'bold' : 'normal'
          }}>
            Newest First
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setSortOrder('asc')} 
          style={{ 
            marginHorizontal: 12,
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: sortOrder === 'asc' ? '#ff4655' : 'transparent',
            borderRadius: 6
          }}
        >
          <Text style={{ 
            color: sortOrder === 'asc' ? 'white' : '#888',
            fontWeight: sortOrder === 'asc' ? 'bold' : 'normal'
          }}>
            Oldest First
          </Text>
        </TouchableOpacity>
      </View>

      {/* TabView */}
      <TabView
        navigationState={{ index, routes: tabRoutes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layoutWidth }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: 'white' }}
            style={{ backgroundColor: '#111' }}
            labelStyle={{ fontWeight: 'bold' }}
          />
        )}
      />
    </View>
  );
}