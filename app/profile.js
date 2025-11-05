// app/profile.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  Alert 
} from 'react-native';
import { useAuthContext } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, userProfile, loadUserProfile, logout } = useAuthContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  // Format the data to handle cases where API might return different structure
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

  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Profile editing will be available in the next update!');
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
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
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
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
          <Text style={styles.reputationValue}>{profileData.reputation} rep</Text>
        </View>
      </View>

      {/* Teams Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Teams</Text>
        {profileData.teams && profileData.teams.length > 0 ? (
          profileData.teams.map((team, index) => (
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

      {/* Friends Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Friends</Text>
        <View style={styles.friendsList}>
          {profileData.friends && profileData.friends.length > 0 ? (
            profileData.friends.map((friend, index) => (
              <Text key={index} style={styles.friendName}>{friend}</Text>
            ))
          ) : (
            <Text style={styles.emptyText}>No friends yet</Text>
          )}
        </View>
      </View>

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

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#ff4655" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  editButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 20,
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
  friendName: {
    color: '#fff',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
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
  emptyText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a1a1a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4655',
  },
  logoutText: {
    color: '#ff4655',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});