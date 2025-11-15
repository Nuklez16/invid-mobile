import { StyleSheet } from "react-native";

export default StyleSheet.create({
  // Overall layout
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  messagesContainer: {
    padding: 12,
    backgroundColor: "#0d0d0d",
  },

  // Message rows
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  messageRowMine: {
    justifyContent: "flex-end",
  },

  messageRowTheirs: {
    justifyContent: "flex-start",
  },

  // Avatars
  avatar: {
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#222",
  },

  // Bubble wrappers
  messageBubbleWrapper: {
    maxWidth: "82%",
  },

  // Bubbles
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#1f1f1f",   // default bubble background
  },

  messageBubbleMine: {
    backgroundColor: "#ff4655",   // your brand red
    alignSelf: "flex-end",
  },

  messageText: {
    color: "#fff",
    fontSize: 15,
  },

  messageMeta: {
    color: "#999",
    fontSize: 11,
    marginTop: 4,
  },

  // Input area
  inputWrapper: {
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingBottom: 8,
    paddingHorizontal: 10,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#111",
  },

  input: {
    flex: 1,
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
  },

  sendButton: {
    marginLeft: 10,
    color: "#ff4655",
    fontWeight: "700",
    fontSize: 16,
  },

  sendButtonDisabled: {
    opacity: 0.4,
  },
  screen: {
  flex: 1,
  backgroundColor: "#0d0d0d", // dark grey chat background
},

messagesContainer: {
  padding: 10,
  backgroundColor: "#0d0d0d", // ensures rows don’t float on white
  flexGrow: 1,                // fills entire screen height
},
});
