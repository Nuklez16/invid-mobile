import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthContext } from "../context/AuthContext";
import formatImageUrl from "../utils/formatImageUrl";
import SecureAvatar from '../components/SecureAvatar';

export default function HamburgerMenu() {
  const [isVisible, setIsVisible] = useState(false);
  const { user, userProfile, logout } = useAuthContext();



  const menuItems = [
    // MAIN CONTENT
    { title: "Home", icon: "home", onPress: () => { setIsVisible(false); router.push("/home"); } },
    { title: "News", icon: "newspaper", onPress: () => { setIsVisible(false); router.push("/news"); } },
    { title: "Forum", icon: "people", onPress: () => { setIsVisible(false); router.push("/forums"); } },
    { title: "Competitions", icon: "trophy", onPress: () => { setIsVisible(false); alert("Competitions feature coming soon!"); } },

    // SOCIAL / COMMUNITY
    { title: "Notifications", icon: "notifications", onPress: () => { setIsVisible(false); router.push("/notifications"); } },
    { title: "Messages", icon: "chatbubble", onPress: () => { setIsVisible(false); router.push("/messages"); } },

    // UTILITY / SYSTEM
    { title: "Settings", icon: "settings", onPress: () => { setIsVisible(false); alert("Settings feature coming soon!"); } },
    { title: "Debug", icon: "bug", onPress: () => { setIsVisible(false); router.push("/debug"); } },
    { title: "Logout", icon: "log-out", onPress: () => { setIsVisible(false); logout(); } },
  ];

  return (
    <>
      {/* Header Hamburger Button */}
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={styles.headerButton}
      >
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Slide-in Menu */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={() => setIsVisible(false)}
        >
          <View style={styles.menuContainer}>
            {/* 🔹 USER HEADER BLOCK */}
            {user && (
              <TouchableOpacity
                style={styles.userHeader}
                activeOpacity={0.8}
                onPress={() => {
                  setIsVisible(false);
                  router.push(`/user-profile?${user.username}`);
                }}
              >
                {/* Use avatar from userProfile instead of user */}
                <SecureAvatar 
                  path={userProfile?.avatarUrl} 
                  style={styles.avatar} 
                  size={50} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.username}>
                    {user.username || "User"}
                  </Text>
                  {user.email ? (
                    <Text style={styles.email}>{user.email}</Text>
                  ) : null}
                  {/* Debug info */}

                </View>
                <Ionicons name="chevron-forward" size={18} color="#666" />
              </TouchableOpacity>
            )}

            {/* 🔹 MENU TITLE */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Navigation</Text>
            </View>

            {/* 🔹 MENU ITEMS */}
            <ScrollView style={styles.menuItems}>
              {menuItems.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color="#fff"
                    style={styles.menuIcon}
                  />
                  <Text style={styles.menuText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 🔹 CLOSE BUTTON */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Ionicons name="close" size={20} color="#ff4655" />
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginLeft: 15,
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menuContainer: {
    marginLeft: "auto",
    width: "80%",
    height: "100%",
    backgroundColor: "#1a1a1a",
    borderLeftWidth: 1,
    borderLeftColor: "#333",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#000",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#222",
  },
  username: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  email: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
    backgroundColor: "#111",
  },
  sectionTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  menuItems: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
  },
  menuText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: "#000",
  },
  closeButtonText: {
    color: "#ff4655",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});