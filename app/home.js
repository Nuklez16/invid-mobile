// app/home.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
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

  // Use real data from API, fallback to basic user info
  const profileData = userProfile || {
    username: user?.username || 'Unknown',
    role: 'Member',
    lastSeen: 'Just now',
    registered: 'Unknown',
    age: null,
    gender: 'Not specified',
    location: 'Unknown',
    reputation: 0,
    teams: [],
    friends: [],
    matchStats: {
      totalPugMatches: 0,
      totalTournamentMatches: 0
    }
  };

  // Format reputation with commas
  const formattedReputation = profileData.reputation?.toLocaleString() || '0';

  // Function to handle friend click
  const handleFriendPress = (friendUsername) => {
    // Navigate to user profile with the friend's username
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
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{profileData.username}</Text>
              <Text style={styles.role}>{profileData.role}</Text>
              <Text style={styles.lastSeen}>Last seen: {profileData.lastSeen}</Text>
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
              <Text style={styles.infoValue}>{profileData.registered}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{profileData.age || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{profileData.gender}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{profileData.location}</Text>
            </View>
          </View>

          {/* Reputation */}
          <View style={styles.reputation}>
            <Text style={styles.reputationLabel}>Forum Reputation</Text>
            <Text style={styles.reputationValue}>{formattedReputation} rep</Text>
          </View>
        </View>
      </TouchableOpacity>

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

      {/* Friends Section - Now Clickable! */}
      {profileData.friends && profileData.friends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends</Text>
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
        </View>
      )}

      {/* Match Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profileData.matchStats?.totalPugMatches || 0}</Text>
            <Text style={styles.statLabel}>Total PUG Matches</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profileData.matchStats?.totalTournamentMatches || 0}</Text>
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