import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
    paddingHorizontal: 20,
  },

  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },

  emptySubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
  },

  textContainer: {
    flex: 1,
    marginLeft: 12,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },

  usernameUnread: {
    fontWeight: "700",
    color: "#ff4655",
  },

  preview: {
    color: "#888",
    fontSize: 14,
    lineHeight: 18,
  },

  previewFromMe: {
    color: "#ff4655",
  },

  previewUnread: {
    color: "#fff",
    fontWeight: "600",
  },

  timestamp: {
    color: "#666",
    fontSize: 12,
    marginRight: 8,
  },

  unreadBadge: {
    backgroundColor: "#ff4655",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  
  avatarGroupContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  avatarGroupItem: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#0d0d0d",
  },

  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});