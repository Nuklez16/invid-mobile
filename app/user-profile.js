// app/user-profile.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthContext } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { authedFetch } from '../src/api/client';

export default function UserProfileScreen() {
    const { username } = useLocalSearchParams();
    const { accessToken, user: currentUser } = useAuthContext();
    const [profile, setProfile] = useState(null);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserProfile();
    }, [username]);

    const loadUserProfile = async () => {
        try {
            const profileEndpoint = username
                ? `/user/profile/${username}`
                : '/user/profile';

            // Use authedFetch for automatic token refresh
            const response = await authedFetch(profileEndpoint);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('🔍 PROFILE DATA:', data); // Debug log

            if (data.success) {
                setProfile(data.profile);
                
                // Load friends list for this user
                await loadFriendsList(data.profile);
            } else {
                Alert.alert('Error', data.error || 'Failed to load profile');
            }
        } catch (error) {
            console.error('Profile load error:', error);
            Alert.alert('Error', 'Failed to load user profile');
        } finally {
            setLoading(false);
        }
    };

    const loadFriendsList = async (profileData) => {
        try {
            // If this is the current user's own profile, use the main profile endpoint
            if (profileData.isOwnProfile) {
                const response = await authedFetch('/user/profile');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.profile.friends) {
                        setFriends(data.profile.friends);
                        return;
                    }
                }
            }
            
            // For other users, use the friends endpoint
            const response = await authedFetch(`/user/${profileData.username}/friends`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setFriends(data.friends);
                }
            }
        } catch (error) {
            console.error('Failed to load friends list:', error);
            setFriends([]);
        }
    };

    const sendFriendRequest = () => {
        Alert.alert('Coming Soon', 'Friend requests will be available soon!');
    };

    // Function to handle friend click
    const handleFriendPress = (friendUsername) => {
        router.push({
            pathname: '/user-profile',
            params: { username: friendUsername }
        });
    };

    // Render avatar component
    const renderAvatar = () => {
        const avatarUrl = profile?.avatarUrl;
        
        if (avatarUrl) {
            return (
                <Image 
                    source={{ 
                        uri: avatarUrl,
                        cache: 'force-cache'
                    }}
                    style={styles.avatar}
                    onError={(error) => {
                        console.log('Avatar loading failed, using fallback:', error.nativeEvent.error);
                    }}
                />
            );
        }
        
        // Fallback to icon if no avatar
        return (
            <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#fff" />
            </View>
        );
    };

    // Render friend avatar (for friends list)
    const renderFriendAvatar = (friend) => {
        const avatarUrl = friend.avatarUrl;
        
        if (avatarUrl) {
            return (
                <Image 
                    source={{ uri: avatarUrl }}
                    style={styles.friendAvatar}
                    onError={(error) => {
                        console.log('Friend avatar loading failed:', error.nativeEvent.error);
                    }}
                />
            );
        }
        
        return (
            <View style={styles.friendAvatarPlaceholder}>
                <Ionicons name="person" size={16} color="#fff" />
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>User not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Profile Header */}
            <View style={styles.profileSection}>
                <View style={styles.profileHeader}>
                    {/* Avatar */}
                    {renderAvatar()}
                    
                    <View style={styles.profileInfo}>
                        <Text style={styles.username}>{profile.username}</Text>
                        <Text style={styles.role}>{profile.role}</Text>
                        <Text style={styles.lastSeen}>Last seen: {profile.lastSeen}</Text>
                    </View>
                    {profile.isOnline && (
                        <View style={styles.onlineIndicator}>
                            <Text style={styles.onlineText}>Online</Text>
                        </View>
                    )}
                </View>

                {/* Friend Status/Actions - Only show for other users */}
                {!profile.isOwnProfile && currentUser && (
                    <View style={styles.actionsContainer}>
                        {profile.isFriend ? (
                            <View style={styles.friendStatus}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.friendText}>Friends</Text>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addFriendButton} onPress={sendFriendRequest}>
                                <Ionicons name="person-add" size={16} color="#fff" />
                                <Text style={styles.addFriendText}>Add Friend</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Basic Info */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Registered</Text>
                        <Text style={styles.infoValue}>{profile.registered}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Age</Text>
                        <Text style={styles.infoValue}>{profile.age || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Gender</Text>
                        <Text style={styles.infoValue}>{profile.gender}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={styles.infoValue}>{profile.location}</Text>
                    </View>
                </View>

                {/* Reputation */}
                <View style={styles.reputation}>
                    <Text style={styles.reputationLabel}>Forum Reputation</Text>
                    <Text style={styles.reputationValue}>{profile.reputation} rep</Text>
                </View>
            </View>

            {/* Teams Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Teams</Text>
                {profile.teams && profile.teams.length > 0 ? (
                    profile.teams.map((team, index) => (
                        <View key={index} style={styles.teamItem}>
                            <Text style={styles.teamGame}>[{team.game}]</Text>
                            <Text style={styles.teamName}>{team.name}</Text>
                            <Text style={styles.teamRole}>({team.role})</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No teams</Text>
                )}
            </View>

            {/* Friends Section - ALWAYS DISPLAYS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Friends ({friends.length})
                </Text>
                {friends.length > 0 ? (
                    <View style={styles.friendsList}>
                        {friends.map((friend, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleFriendPress(friend.username || friend)}
                                style={styles.friendItem}
                            >
                                {/* Friend Avatar */}
                                {renderFriendAvatar(friend)}
                                
                                <Text style={styles.friendName}>
                                    {friend.username || friend}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>
                        {profile.isOwnProfile 
                            ? "You haven't added any friends yet" 
                            : `${profile.username} hasn't added any friends yet`
                        }
                    </Text>
                )}
            </View>

            {/* Match Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Match Stats</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{profile.matchStats?.totalPugMatches || 0}</Text>
                        <Text style={styles.statLabel}>Total PUG Matches</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{profile.matchStats?.totalTournamentMatches || 0}</Text>
                        <Text style={styles.statLabel}>Tournament Matches</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    profileSection: {
        backgroundColor: '#1a1a1a',
        padding: 20,
        margin: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#333',
        marginRight: 16,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    username: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    role: {
        color: '#ff4655',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    lastSeen: {
        color: '#888',
        fontSize: 12,
    },
    onlineIndicator: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    onlineText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    actionsContainer: {
        marginBottom: 16,
    },
    friendStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a3a1a',
        padding: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    friendText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    addFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff4655',
        padding: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    addFriendText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    infoItem: {
        width: '50%',
        marginBottom: 12,
    },
    infoLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    reputation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    reputationLabel: {
        color: '#888',
        fontSize: 14,
    },
    reputationValue: {
        color: '#ff4655',
        fontSize: 16,
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: '#1a1a1a',
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    teamItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    teamGame: {
        color: '#888',
        fontSize: 14,
        marginRight: 6,
    },
    teamName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginRight: 6,
    },
    teamRole: {
        color: '#ff4655',
        fontSize: 12,
    },
    friendsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 12,
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    friendAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    friendAvatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#555',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    friendName: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        color: '#ff4655',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        textAlign: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 14,
        fontStyle: 'italic',
    },
});