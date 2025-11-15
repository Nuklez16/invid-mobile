import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // SLIDER
  carouselWrapper: {
    width: '100%',
    marginTop: 12,
    marginBottom: 16,
  },
  carouselItem: {
    width: width,
    height: 180,
    justifyContent: 'flex-end',
  },
  carouselImage: {
    width: width - 32,
    height: 180,
    borderRadius: 12,
    marginHorizontal: 16,
    resizeMode: 'cover',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 32,
  },
  carouselTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // PROFILE HEADER
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
  profileInfo: { flex: 1 },

  username: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  role: { color: '#ff4655', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  lastSeen: { color: '#888', fontSize: 12 },

  chevron: { marginLeft: 8 },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  onlineText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // INFO GRID
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  infoItem: { width: '50%', marginBottom: 12 },
  infoLabel: { color: '#888', fontSize: 12 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '500' },

  // REPUTATION
  reputation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  reputationLabel: { color: '#888' },
  reputationValue: { color: '#ff4655', fontSize: 16, fontWeight: 'bold' },
  loadingHint: { color: '#888', fontSize: 12, marginTop: 8 },

  // SECTIONS
  section: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // TEAMS
  teamItem: { flexDirection: 'row', marginBottom: 8 },
  teamGame: { color: '#888', marginRight: 6 },
  teamName: { color: '#fff', marginRight: 6 },
  teamRole: { color: '#ff4655' },

  // FRIENDS
  placeholderRow: { flexDirection: 'row' },
  placeholderChip: {
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    marginRight: 8,
    marginBottom: 8,
    minWidth: 64,
  },

  friendsList: { flexDirection: 'row', flexWrap: 'wrap' },
  friendItem: { marginRight: 8, marginBottom: 8 },
  friendName: {
    color: '#fff',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  // MATCH STATS
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { color: '#ff4655', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12 },

  // QUICK ACTIONS
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionText: { color: '#fff', marginTop: 8, fontSize: 12 },

  emptyText: { color: '#888', fontStyle: 'italic' },
});
