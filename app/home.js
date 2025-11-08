// app/home.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { useAuthContext } from '../src/context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user, userProfile, loadUserProfile } = useAuthContext();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserProfile();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const quickActions = [
    { 
      title: 'Notifications', 
      icon: 'notifications', 
      color: '#ff4655', 
      onPress: () => router.push('/notifications') 
    },
    { 
      title: 'Search', 
      icon: 'search', 
      color: '#4CAF50', 
      onPress: () => router.push('/search') 
    },
    { 
      title: 'Profile', 
      icon: 'person', 
      color: '#2196F3', 
      onPress: () => router.push('/profile') 
    },
  ];

  const isProfileLoaded = Boolean(userProfile);

  const fallbackProfile = {
    username: user?.username || 'Loading…',
    role: 'Member',
    lastSeen: 'Loading…',
    registered: 'Loading…',
    age: null,
    gender: 'Loading…',
    location: 'Loading…',
    reputation: null,
    teams: [],
    friends: [],
    matchStats: {
      totalPugMatches: null,
      totalTournamentMatches: null
    },
    avatarUrl: null,
    isOnline: false
  };

  // Use real data from API, fallback to basic user info
  const profileData = isProfileLoaded ? userProfile : fallbackProfile;

  const displayValue = (value, fallbackWhenLoaded = 'N/A') => {
    if (!isProfileLoaded) return 'Loading…';
    if (value === null || value === undefined || value === '') {
      return fallbackWhenLoaded;
    }
    return value;
  };

  const displayNumber = (value) =>
    isProfileLoaded && typeof value === 'number' ? value : '–';

  // Format reputation with commas
  const formattedReputation = isProfileLoaded
    ? profileData.reputation?.toLocaleString?.() ?? '0'
    : '–';

  // Function to handle friend click
  const handleFriendPress = (friendUsername) => {
    router.push({
      pathname: '/user-profile',
      params: { username: friendUsername }
    });
  };

  // Function to open user's own profile
  const handleViewOwnProfile = () => {
    router.push({
      pathname: '/user-profile',
      params: { username: profileData.username }
    });
  };

  // Render avatar component
  const renderAvatar = () => {
    const avatarUrl = profileData.avatarUrl;
    
    if (avatarUrl) {
      return (
        <Image 
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          onError={(error) => {
            console.log('Avatar loading error:', error.nativeEvent.error);
            // You could set a state here to show fallback on error if needed
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#ff4655']}
          tintColor="#ff4655"
        />
      }
    >
      {/* Profile Header - Make it clickable */}
      <TouchableOpacity onPress={handleViewOwnProfile}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            {/* Avatar */}
            {renderAvatar()}
            
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{displayValue(profileData.username, user?.username || 'Unknown')}</Text>
              <Text style={styles.role}>{displayValue(profileData.role, 'Member')}</Text>
              <Text style={styles.lastSeen}>
                Last seen: {displayValue(profileData.lastSeen, 'Just now')}
              </Text>
            </View>
            {profileData.isOnline && (
              <View style={styles.onlineIndicator}>
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#888" style={styles.chevron} />
          </View>

          {/* Basic Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Registered</Text>
              <Text style={styles.infoValue}>
                {displayValue(profileData.registered, 'Unknown')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>
                {displayValue(
                  profileData.age !== null ? profileData.age : undefined,
                  'N/A'
                )}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {displayValue(profileData.gender, 'Not specified')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {displayValue(profileData.location, 'Unknown')}
              </Text>
            </View>
          </View>

          {/* Reputation */}
          <View style={styles.reputation}>
            <Text style={styles.reputationLabel}>Forum Reputation</Text>
            <Text style={styles.reputationValue}>
              {isProfileLoaded ? `${formattedReputation} rep` : 'Loading…'}
            </Text>
          </View>
          {!isProfileLoaded && (
            <Text style={styles.loadingHint}>Hang tight, we're fetching your stats…</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Rest of your component remains the same */}
      {/* Teams Section */}
      {profileData.teams && profileData.teams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teams</Text>
          {profileData.teams.map((team, index) => (
            <View key={index} style={styles.teamItem}>
              <Text style={styles.teamGame}>[{team.game}]</Text>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamRole}>({team.role})</Text>
            </View>
          ))}
        </View>
      )}

      {/* Friends Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Friends</Text>
        {!isProfileLoaded ? (
          <View style={styles.placeholderRow}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.placeholderChip} />
            ))}
          </View>
        ) : profileData.friends && profileData.friends.length > 0 ? (
          <View style={styles.friendsList}>
            {profileData.friends.map((friend, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleFriendPress(friend)}
                style={styles.friendItem}
              >
                <Text style={styles.friendName}>{friend}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No friends yet</Text>
        )}
      </View>

      {/* Match Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {displayNumber(profileData.matchStats?.totalPugMatches)}
            </Text>
            <Text style={styles.statLabel}>Total PUG Matches</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {displayNumber(profileData.matchStats?.totalTournamentMatches)}
            </Text>
            <Text style={styles.statLabel}>Tournament Matches</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={action.onPress}
            >
              <Ionicons name={action.icon} size={24} color="#fff" />
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  chevron: {
    marginLeft: 8,
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  onlineText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  loadingHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  // ... rest of your styles remain the same
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
  placeholderRow: {
    flexDirection: 'row',
  },
  placeholderChip: {
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    marginRight: 8,
    marginBottom: 8,
    minWidth: 64,
  },
  friendItem: {
    marginRight: 8,
    marginBottom: 8,
  },
  friendName: {
    color: '#fff',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
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
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
});