import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
  // Overall layout
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },

  messagesContainer: {
    padding: 12,
    backgroundColor: '#0d0d0d',
    flexGrow: 1,
  },

  // Message rows
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  messageRowMine: {
    justifyContent: 'flex-end',
  },

  messageRowTheirs: {
    justifyContent: 'flex-start',
  },

  // Avatars
  avatar: {
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    alignSelf: 'flex-end',
  },

  // Bubble wrappers
  messageBubbleWrapper: {
    maxWidth: '82%',
    flex: 1,
  },

  // Bubbles
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },

  messageBubbleMine: {
    backgroundColor: '#ff4655',
    borderColor: '#ff4655',
    alignSelf: 'flex-end',
  },

  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 20,
  },

  messageMeta: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },

  // Input area
  inputWrapper: {
    backgroundColor: '#0d0d0d',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 52,
  },

  input: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#0d0d0d',
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: 'center',
  },

  sendButton: {
    marginLeft: 8,
    color: '#ff4655',
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: 4,
    paddingVertical: 8,
    minWidth: 50,
    textAlign: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.4,
  },
  
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 6,
  },
  
  mediaItem: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
  },
  
  mediaItemSingle: {
    width: 200,
    height: 200,
  },
  
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  
  videoPlayIcon: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },

  // "Load previous messages" button
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginHorizontal: 40,
    marginBottom: 16,
  },
  
  loadMoreText: {
    color: "#ff4655",
    fontSize: 14,
    fontWeight: '600',
  },

  // Attachments preview before send
  attachmentsPreview: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#222",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  
  attachmentThumbWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  
  attachmentThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  
  attachmentRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ff4655",
    borderRadius: 999,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: '#0d0d0d',
  },
  
  attachmentRemoveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 16,
  },

  // Attach button in input bar
  attachButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  
  attachButtonText: {
    fontSize: 24,
    color: "#ff4655",
    fontWeight: '300',
  },

  // Typing indicator
  typingIndicator: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  
  typingText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },

  // Status indicators
  pendingIndicator: {
    opacity: 0.7,
  },
  
  errorIndicator: {
    borderColor: '#ff4655',
    borderWidth: 1,
  },
});