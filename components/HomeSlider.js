import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import Swiper from "react-native-swiper";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function HomeSlider({ slides }) {
  if (!slides || slides.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Swiper
        autoplay
        autoplayTimeout={4}
        showsPagination
        dotColor="#333"
        activeDotColor="#ff4655"
        height={200}
      >
        {slides.map((slide, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.8}
            onPress={() => {
              if (slide.link) router.push(slide.link);
            }}
          >
            <Image
              source={{ uri: slide.imageUrl }}
              style={styles.image}
            />
            <View style={styles.textOverlay}>
              <Text style={styles.title}>{slide.title}</Text>
              {slide.subtitle && <Text style={styles.subtitle}>{slide.subtitle}</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </Swiper>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: 200,
    marginTop: 12,
  },
  image: {
    width: width - 32,
    height: 200,
    marginHorizontal: 16,
    borderRadius: 12,
    resizeMode: "cover",
  },
  textOverlay: {
    position: "absolute",
    bottom: 20,
    left: 28,
    right: 28,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: "#ccc",
    marginTop: 4,
    fontSize: 14,
  }
});
