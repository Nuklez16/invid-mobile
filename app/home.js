// app/home.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Image, Dimensions } from 'react-native';
import styles from '../src/styles/homeStyles';
import { useAuthContext } from '../src/context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';
import { loadHomepageSlides } from '../src/services/homeService';
const { width } = Dimensions.get('window');
// -------------------------
// HOMEPAGE SLIDER — REANIMATED
// -------------------------
function HomeSlider({ slides }) {


  if (!slides || slides.length === 0) {

    return null;
  }

  return (
    <View style={styles.carouselWrapper}>
      <Carousel
        width={width}
        height={180}
        loop
        autoPlay
        autoPlayInterval={3500}
        data={slides}
        scrollAnimationDuration={850}
        renderItem={({ item, index }) => {


          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                console.log("🎞 Slide pressed:", item.link);
                item.link && router.push(item.link);
              }}
              style={styles.carouselItem}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.carouselImage}
                onError={() => console.warn("❌ Slide image failed to load:", item.image)}
              />

              {item.title && (
                <View style={styles.carouselOverlay}>
                  <Text style={styles.carouselTitle}>{item.title}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}


// -------------------------
// MAIN HOME SCREEN
// -------------------------
export default function HomeScreen() {
  const { user, userProfile, loadUserProfile } = useAuthContext();
  const [refreshing, setRefreshing] = React.useState(false);
  const [slides, setSlides] = React.useState([]);

React.useEffect(() => {
  (async () => {
    const s = await loadHomepageSlides();
    setSlides(s);
  })();
}, []);

const onRefresh = async () => {
  setRefreshing(true);
  try {
    await loadUserProfile();
    const s = await loadHomepageSlides();
    setSlides(s);
  } catch (error) {
    console.error('Refresh failed:', error);
  } finally {
    setRefreshing(false);
  }
};

  const quickActions = [
    { title: 'Notifications', icon: 'notifications', color: '#ff4655', onPress: () => router.push('/notifications') },
    { title: 'Search', icon: 'search', color: '#4CAF50', onPress: () => router.push('/search') },
    { title: 'Profile', icon: 'person', color: '#2196F3', onPress: () => router.push('/profile') },
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
      totalTournamentMatches: null,
    },
    avatarUrl: null,
    isOnline: false,
  };

  const profileData = isProfileLoaded ? userProfile : fallbackProfile;

  const displayValue = (value, fallback = 'N/A') =>
    !isProfileLoaded ? 'Loading…' : value || fallback;

  const displayNumber = (value) =>
    isProfileLoaded && typeof value === 'number' ? value : '–';

  const formattedReputation = isProfileLoaded
    ? profileData.reputation?.toLocaleString?.() ?? '0'
    : '–';

  const handleFriendPress = (friendUsername) => {
    router.push({ pathname: '/user-profile', params: { username: friendUsername } });
  };

  const handleViewOwnProfile = () => {
    router.push({ pathname: '/user-profile', params: { username: profileData.username } });
  };

  const renderAvatar = () => {
    const avatarUrl = profileData.avatarUrl;

    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
      );
    }

    return (
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person" size={24} color="#fff" />
      </View>
    );
  };

  // -------------------------
  // RETURN UI
  // -------------------------
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff4655']} tintColor="#ff4655" />
      }
    >

      {/* NEW: Homepage Slider */}
      <HomeSlider slides={slides} />

      {/* Profile Header */}
      <TouchableOpacity onPress={handleViewOwnProfile}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            {renderAvatar()}

            <View style={styles.profileInfo}>
              <Text style={styles.username}>{displayValue(profileData.username)}</Text>
              <Text style={styles.role}>{displayValue(profileData.role)}</Text>
              <Text style={styles.lastSeen}>Last seen: {displayValue(profileData.lastSeen, 'Just now')}</Text>
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
              <Text style={styles.infoValue}>{displayValue(profileData.registered)}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{displayValue(profileData.age, 'N/A')}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{displayValue(profileData.gender)}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{displayValue(profileData.location)}</Text>
            </View>
          </View>

          {/* Reputation */}
          <View style={styles.reputation}>
            <Text style={styles.reputationLabel}>Forum Reputation</Text>
            <Text style={styles.reputationValue}>{`${formattedReputation} rep`}</Text>
          </View>

          {!isProfileLoaded && <Text style={styles.loadingHint}>Hang tight, we're fetching your stats…</Text>}
        </View>
      </TouchableOpacity>

      {/* Teams */}
      {profileData.teams?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teams</Text>
          {profileData.teams.map((team, i) => (
            <View key={i} style={styles.teamItem}>
              <Text style={styles.teamGame}>[{team.game}]</Text>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamRole}>({team.role})</Text>
            </View>
          ))}
        </View>
      )}

      {/* Friends */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Friends</Text>
        {!isProfileLoaded ? (
          <View style={styles.placeholderRow}>
            {[0, 1, 2].map((i) => (<View key={i} style={styles.placeholderChip} />))}
          </View>
        ) : profileData.friends?.length > 0 ? (
          <View style={styles.friendsList}>
            {profileData.friends.map((friend, i) => (
              <TouchableOpacity key={i} onPress={() => handleFriendPress(friend)} style={styles.friendItem}>
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
            <Text style={styles.statNumber}>{displayNumber(profileData.matchStats?.totalPugMatches)}</Text>
            <Text style={styles.statLabel}>Total PUG Matches</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{displayNumber(profileData.matchStats?.totalTournamentMatches)}</Text>
            <Text style={styles.statLabel}>Tournament Matches</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
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
