// src/components/HamburgerMenu.js
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

export default function HamburgerMenu() {
  const [isVisible, setIsVisible] = useState(false);
  const { user, logout } = useAuthContext();

  const menuItems = [
    { title: "Home", icon: "home", onPress: () => { setIsVisible(false); router.push("/home"); } },
    { title: "Notifications", icon: "notifications", onPress: () => { setIsVisible(false); router.push("/notifications"); } },
    { title: "Messages", icon: "chatbubble", onPress: () => { setIsVisible(false); alert("Messages feature coming soon!"); } },
    { title: "Forum", icon: "people", onPress: () => { setIsVisible(false); alert("Forum feature coming soon!"); } },
    { title: "Competitions", icon: "trophy", onPress: () => { setIsVisible(false); alert("Competitions feature coming soon!"); } },
    { title: "Debug", icon: "bug", onPress: () => { setIsVisible(false); router.push("/debug"); } },
    { title: "Settings", icon: "settings", onPress: () => { setIsVisible(false); alert("Settings feature coming soon!"); } },
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
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Menu</Text>
              {user && (
                <Text style={styles.userInfo}>
                  {user.username || user.email}
                </Text>
              )}
            </View>

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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#000",
  },
  headerTitle: { 
    color: "#fff", 
    fontSize: 20, 
    fontWeight: "bold",
    marginBottom: 4,
  },
  userInfo: { 
    color: "#888", 
    fontSize: 14,
  },
  menuItems: { 
    flex: 1, 
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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