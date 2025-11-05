// app/search.js
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useAuthContext } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authedFetch } from '../src/api/client'; // Import authedFetch

export default function SearchScreen() {
    const { logout } = useAuthContext(); // Get logout function
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const searchUsers = useCallback(async (searchQuery) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setUsers([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        try {
            console.log('🔍 Starting search for:', searchQuery);

            // Use authedFetch which handles token refresh automatically
            const response = await authedFetch(`/search/users?query=${encodeURIComponent(searchQuery)}`, {
                method: 'GET'
            });

            console.log('🔍 Search response status:', response.status);

            if (response.status === 401) {
                // authedFetch should handle refresh, but if we still get 401, session is invalid
                console.log('❌ Session expired after refresh attempt');
                throw new Error('SESSION_EXPIRED');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Search successful, found users:', data.users?.length);

            if (data.success) {
                setUsers(data.users);
                setSearched(true);
            } else {
                setUsers([]);
            }

        } catch (error) {
            console.error('❌ Search error:', error);
            setUsers([]);
            
            if (error.message === 'SESSION_EXPIRED') {
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again.',
                    [
                        { 
                            text: 'OK', 
                            onPress: () => {
                                console.log('🔐 Logging out due to expired session');
                                logout();
                            }
                        }
                    ]
                );
            }
        } finally {
            setLoading(false);
        }
    }, [logout]); // Only depend on logout

    const handleSearch = (text) => {
        setQuery(text);
        searchUsers(text);
    };

    const clearSearch = () => {
        setQuery('');
        setUsers([]);
        setSearched(false);
    };

    const viewUserProfile = (username) => {
        router.push({
            pathname: '/user-profile',
            params: { username }
        });
    };

    const renderUserItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => viewUserProfile(item.username)}
        >
            <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.userDetails}>
                    {item.role} • {item.reputation} rep • {item.lastSeen}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor="#888"
                    value={query}
                    onChangeText={handleSearch}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                />
                {loading && <ActivityIndicator size="small" color="#ff4655" />}
                {query ? (
                    <TouchableOpacity onPress={clearSearch}>
                        <Ionicons name="close-circle" size={20} color="#888" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Results */}
            {searched && (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>
                        {users.length} user{users.length !== 1 ? 's' : ''} found
                    </Text>
                    
                    {users.length > 0 ? (
                        <FlatList
                            data={users}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderUserItem}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color="#888" />
                            <Text style={styles.emptyText}>No users found</Text>
                            <Text style={styles.emptySubtext}>
                                Try searching with a different username
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Initial State */}
            {!searched && (
                <View style={styles.initialState}>
                    <Ionicons name="people-outline" size={64} color="#888" />
                    <Text style={styles.initialText}>Search for users</Text>
                    <Text style={styles.initialSubtext}>
                        Find other players by their username
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        marginLeft: 12,
        marginRight: 12,
        fontSize: 16,
    },
    resultsContainer: {
        flex: 1,
    },
    resultsTitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 12,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    userDetails: {
        color: '#888',
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
    },
    initialState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    initialText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    initialSubtext: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
    },
});