import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Linking,
  Alert,
  ActionSheetIOS,
  Keyboard,
  Animated,
} from "react-native";

import styles from "../../src/styles/messageStyles";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useNavigation,
  useLocalSearchParams,
} from "expo-router";

import { useAuthContext } from "../../src/context/AuthContext";
import { authedFetch } from "../../src/api/client";
import SecureAvatar from "../../src/components/SecureAvatar";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const PAGE_SIZE = 50;

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams();
  const { user } = useAuthContext();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const [attachments, setAttachments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const flatListRef = useRef(null);
  const textInputRef = useRef(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // --- Permissions ---
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS !== "web") {
        const { status: mediaStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== "granted") {
          console.log("Media library permission not granted");
        }

        const { status: cameraStatus } =
          await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== "granted") {
          console.log("Camera permission not granted");
        }
      }
    };

    requestPermissions();
  }, []);

  // --- Keyboard handling ---
  useEffect(() => {
    const keyboardWillShow = (e) => {
      setIsKeyboardVisible(true);
      Animated.timing(keyboardHeight, {
        duration: e?.duration || 250,
        toValue: e?.endCoordinates?.height || 0,
        useNativeDriver: false,
      }).start();

      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const keyboardWillHide = (e) => {
      setIsKeyboardVisible(false);
      Animated.timing(keyboardHeight, {
        duration: e?.duration || 250,
        toValue: 0,
        useNativeDriver: false,
      }).start();
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      keyboardWillHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardHeight]);

  // --- Helpers ----------------------------------------------------------
  const buildMediaTypeFromUrl = (url) => {
    const ext = (url?.split(".").pop() || "").toLowerCase();

    if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
    if (["gif", "jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext))
      return "image";

    return "file";
  };

  const buildMediaTypeFromMime = (mimeType, fallbackHint = "image") => {
    if (!mimeType) return fallbackHint;

    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("image/")) return "image";

    return "file";
  };

  const normalizeMedia = (media = [], mediaUrls = []) => {
    if (Array.isArray(media) && media.length > 0) {
      return media
        .map((item) => {
          if (!item) return null;

          if (typeof item === "string") {
            return {
              url: item,
              type: buildMediaTypeFromUrl(item),
            };
          }

          const derivedType = item.type || buildMediaTypeFromUrl(item.url);

          return {
            ...item,
            url: item.url,
            type: derivedType,
          };
        })
        .filter(Boolean);
    }

    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      return mediaUrls
        .map((url) =>
          url
            ? {
                url,
                type: buildMediaTypeFromUrl(url),
              }
            : null
        )
        .filter(Boolean);
    }

    return [];
  };

  const normalizeMessage = (message) => {
    if (!message) return message;

    const media = normalizeMedia(message.media, message.mediaUrls);

    return {
      ...message,
      media,
      mediaUrls: media.map((m) => m.url),
    };
  };

  const openVideo = (url) => {
    if (!url) return;
    Linking.openURL(url).catch((e) =>
      console.warn("Failed to open video URL", e)
    );
  };

  const scrollToBottom = (animated = false) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 50);
  };

  // --- Load conversation + messages -------------------------------------
  const loadConversation = useCallback(
    async (pageToLoad = 1, append = false) => {
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        const res = await authedFetch(
          `/messages/conversations/${conversationId}?page=${pageToLoad}&pageSize=${PAGE_SIZE}`
        );
        const data = await res.json();
        const normalizedMessages = (data.messages || []).map(normalizeMessage);

        if (!append) {
          setConversation(data);
          setMessages(normalizedMessages);
          navigation.setOptions({
            title: data.conversationName || "Conversation",
            headerStyle: {
              backgroundColor: "#0d0d0d",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "600",
            },
          });
        } else {
          const newMessages = normalizedMessages;
          if (newMessages.length > 0) {
            setMessages((prev) => [...newMessages, ...prev]);
          }
        }

        setPage(pageToLoad);
        setHasMore((data.messages || []).length >= PAGE_SIZE);
      } catch (err) {
        console.warn("Failed to load conversation", err);
        Alert.alert("Error", "Failed to load conversation");
      } finally {
        if (!append) setLoading(false);
        setLoadingMore(false);
      }
    },
    [conversationId, navigation]
  );

  useEffect(() => {
    loadConversation(1, false);
  }, [loadConversation]);

  // --- Pagination: Load older messages (scroll up) ----------------------
  const loadOlderMessages = async () => {
    if (loadingMore || !hasMore) return;
    await loadConversation(page + 1, true);
  };

  // --- Attachment upload helpers ---------------------------------------
  const uploadToServer = async (
    uri,
    typeHint = "image",
    originalAsset = null
  ) => {
    try {
      const filename =
        originalAsset?.name ||
        originalAsset?.fileName ||
        uri.split("/").pop() ||
        "upload";
      const ext = (filename.split(".").pop() || "").toLowerCase();

      // Determine MIME type
      let mimeType = originalAsset?.mimeType;

      if (!mimeType) {
        if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
          mimeType =
            ext === "mov"
              ? "video/quicktime"
              : ext === "avi"
                ? "video/x-msvideo"
                : `video/${ext}`;
        } else if (["gif", "jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext)) {
          mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
        } else if (ext) {
          mimeType = `application/${ext}`;
        } else if (typeHint === "video") {
          mimeType = "video/mp4";
        } else if (typeHint === "file") {
          mimeType = "application/octet-stream";
        } else {
          mimeType = "image/jpeg";
        }
      }

      const formData = new FormData();
      formData.append("media", {
        uri,
        name: filename,
        type: mimeType,
      });

      console.log("Uploading file:", { uri, filename, mimeType });

      const res = await authedFetch("/messages/media/upload", {
        method: "POST",
        body: formData, // ❗ no Content-Type header; authedFetch must NOT set one for FormData
      });

      const data = await res.json();
      console.log("Upload response:", data);

      if (!res.ok || !data.success) {
        console.warn("Upload failed:", data);
        throw new Error(data.error || "Upload failed");
      }

      if (!data.files || data.files.length === 0) {
        throw new Error("No files returned from upload");
      }

      const uploadedUrl = data.files[0].url;
      console.log("Upload successful, URL:", uploadedUrl);
      return uploadedUrl;
    } catch (err) {
      console.warn("Upload error", err);
      Alert.alert("Upload failed", "Could not upload attachment.");
      throw err;
    }
  };

  const addAttachmentFromUri = async (uri, typeHint, originalAsset = null) => {
    try {
      console.log("Adding attachment from URI:", uri);
      const url = await uploadToServer(uri, typeHint, originalAsset);
      const type =
        buildMediaTypeFromMime(originalAsset?.mimeType, typeHint) ||
        buildMediaTypeFromUrl(url);

      console.log("Attachment added successfully:", { url, type });

      setAttachments((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-${Math.random()}`,
          url,
          type,
        },
      ]);
    } catch (err) {
      console.warn("Failed to add attachment:", err);
    }
  };

  // --- Attachment Picker -----------------------------------
  const handlePickAttachment = () => {
    console.log("Attachment picker triggered");

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Camera", "Photo Library", "Video", "File"],
          cancelButtonIndex: 0,
          tintColor: "#ff4655",
        },
        async (buttonIndex) => {
          try {
            if (buttonIndex === 1) {
              // Camera
              const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Permission required",
                  "Camera access is needed to take photos"
                );
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: false,
                aspect: [4, 3],
              });
              if (!result.canceled && result.assets?.[0]?.uri) {
                await addAttachmentFromUri(
                  result.assets[0].uri,
                  "image",
                  result.assets[0]
                );
              }
            } else if (buttonIndex === 2) {
              // Photo Library - Images only
              const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Permission required",
                  "Photo library access is needed to select photos"
                );
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                selectionLimit: 4,
                allowsMultipleSelection: true,
              });
              if (!result.canceled && Array.isArray(result.assets)) {
                for (const asset of result.assets) {
                  if (asset.uri) {
                    await addAttachmentFromUri(asset.uri, "image", asset);
                  }
                }
              }
            } else if (buttonIndex === 3) {
              // Video Library
              const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Permission required",
                  "Media library access is needed to select videos"
                );
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                quality: 0.8,
                allowsEditing: false,
                selectionLimit: 1,
              });
              if (!result.canceled && result.assets?.[0]?.uri) {
                await addAttachmentFromUri(
                  result.assets[0].uri,
                  "video",
                  result.assets[0]
                );
              }
            } else if (buttonIndex === 4) {
              // File - Any document type (server will still only accept image/video)
              const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                multiple: false,
                type: "*/*",
              });

              if (!result.canceled && result.assets?.[0]?.uri) {
                const asset = result.assets[0];
                await addAttachmentFromUri(asset.uri, "file", asset);
              }
            }
          } catch (err) {
            console.warn("Attachment pick error", err);
            Alert.alert("Error", "Failed to pick attachment: " + err.message);
          }
        }
      );
    } else {
      // Android
      Alert.alert(
        "Add attachment",
        "Choose attachment type",
        [
          {
            text: "Camera",
            onPress: async () => {
              try {
                const { status } =
                  await ImagePicker.requestCameraPermissionsAsync();
                if (status !== "granted") {
                  Alert.alert(
                    "Permission required",
                    "Camera access is needed to take photos"
                  );
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  quality: 0.8,
                  allowsEditing: false,
                  aspect: [4, 3],
                });
                if (!result.canceled && result.assets?.[0]?.uri) {
                  await addAttachmentFromUri(
                    result.assets[0].uri,
                    "image",
                    result.assets[0]
                  );
                }
              } catch (err) {
                console.warn("Camera error", err);
                Alert.alert(
                  "Error",
                  "Failed to take photo/video: " + err.message
                );
              }
            },
          },
          {
            text: "Gallery",
            onPress: async () => {
              try {
                const { status } =
                  await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                  Alert.alert(
                    "Permission required",
                    "Media library access is needed to select photos and videos"
                  );
                  return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  quality: 0.8,
                  selectionLimit: 4,
                  allowsMultipleSelection: true,
                  exif: false,
                });

                console.log("Gallery result:", result);

                if (!result.canceled && Array.isArray(result.assets)) {
                  for (const asset of result.assets) {
                    if (asset.uri) {
                      await addAttachmentFromUri(asset.uri, "image", asset);
                    }
                  }
                } else if (result.canceled) {
                  console.log("User canceled gallery picker");
                }
              } catch (err) {
                console.warn("Gallery error", err);
                Alert.alert(
                  "Error",
                  "Failed to pick from gallery: " + err.message
                );
              }
            },
          },
          {
            text: "Video",
            onPress: async () => {
              try {
                const { status } =
                  await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                  Alert.alert(
                    "Permission required",
                    "Media library access is needed to select videos"
                  );
                  return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                  quality: 0.8,
                  selectionLimit: 1,
                  allowsMultipleSelection: false,
                });

                if (!result.canceled && result.assets?.[0]?.uri) {
                  await addAttachmentFromUri(
                    result.assets[0].uri,
                    "video",
                    result.assets[0]
                  );
                }
              } catch (err) {
                console.warn("Video pick error", err);
                Alert.alert(
                  "Error",
                  "Failed to pick video: " + err.message
                );
              }
            },
          },
          {
            text: "File",
            onPress: async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  copyToCacheDirectory: true,
                  multiple: false,
                  type: "*/*",
                });

                if (!result.canceled && result.assets?.[0]?.uri) {
                  const asset = result.assets[0];
                  await addAttachmentFromUri(asset.uri, "file", asset);
                }
              } catch (err) {
                console.warn("File pick error", err);
                Alert.alert(
                  "Error",
                  "Failed to pick file: " + err.message
                );
              }
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    }
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // --- Send message -----------------------------------------------------
  const send = async () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || sending) return;

    setSending(true);

    const mediaUrls = attachments.map((a) => a.url);
    const optimisticMedia = normalizeMedia(attachments, mediaUrls);

    const optimistic = {
      id: `local-${Date.now()}`,
      message: trimmed,
      media: optimisticMedia,
      mediaUrls: optimisticMedia.map((m) => m.url),
      senderId: user.id,
      senderUsername: user.username,
      senderAvatar: user.avatar,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setAttachments([]);
    scrollToBottom(true);

    try {
      const res = await authedFetch("/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: trimmed,
          mediaUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        Alert.alert("Error", "Failed to send message");
        return;
      }

      const normalized = normalizeMessage(data);

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== optimistic.id)
          .concat(normalized)
      );
      scrollToBottom(true);
    } catch (err) {
      console.warn("Error sending message", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // --- Render messages --------------------------------------------------
  const renderMediaGrid = (item) => {
    if (!Array.isArray(item.media) || item.media.length === 0) {
      return null;
    }

    const total = item.media.length;

    return (
      <View style={styles.mediaGrid}>
        {item.media.map((m, idx) => {
          const isSingle = total === 1;

          if (m.type === "video") {
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.mediaItem,
                  isSingle && styles.mediaItemSingle,
                ]}
                onPress={() => openVideo(m.url)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: m.url }}
                  style={[styles.mediaItem, isSingle && styles.mediaItemSingle]}
                  resizeMode="cover"
                />
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoPlayIcon}>▶</Text>
                </View>
              </TouchableOpacity>
            );
          }

          if (m.type === "image") {
            return (
              <Image
                key={idx}
                source={{ uri: m.url }}
                style={[
                  styles.mediaItem,
                  isSingle && styles.mediaItemSingle,
                ]}
                resizeMode="cover"
              />
            );
          }

          return (
            <View
              key={idx}
              style={[
                styles.mediaItem,
                isSingle && styles.mediaItemSingle,
                styles.filePlaceholder,
              ]}
            >
              <Text style={styles.filePlaceholderText}>📎 File</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isMine = Number(item.senderId) === Number(user.id);

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowTheirs,
          item.pending && styles.pendingIndicator,
        ]}
      >
        {!isMine && (
          <SecureAvatar
            path={item.senderAvatar}
            size={34}
            style={styles.avatar}
          />
        )}

        <View style={styles.messageBubbleWrapper}>
          <View
            style={[
              styles.messageBubble,
              isMine && styles.messageBubbleMine,
            ]}
          >
            {item.message ? (
              <Text style={styles.messageText}>{item.message}</Text>
            ) : null}

            {renderMediaGrid(item)}
          </View>

          {!isMine && (
            <Text style={styles.messageMeta}>
              {item.senderUsername} •{" "}
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
          {isMine && (
            <Text
              style={[
                styles.messageMeta,
                { textAlign: "right", marginRight: 4 },
              ]}
            >
              {item.pending
                ? "Sending..."
                : new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // --- Render -----------------------------------------------------------
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#ff4655" />
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: "#fff" }}>Conversation not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <View style={styles.attachmentsPreview}>
            <FlatList
              horizontal
              data={attachments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isImage = item.type === "image";
                const isVideo = item.type === "video";

                return (
                  <View style={styles.attachmentThumbWrapper}>
                    {isImage ? (
                      <Image
                        source={{ uri: item.url }}
                        style={styles.attachmentThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.attachmentThumb, styles.filePlaceholder]}>
                        <Text style={styles.filePlaceholderText}>
                          {isVideo ? "🎥" : "📎"}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.attachmentRemove}
                      onPress={() => removeAttachment(item.id)}
                    >
                      <Text style={styles.attachmentRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.messagesContainer,
            { paddingBottom: isKeyboardVisible ? 20 : 40 },
          ]}
          ListHeaderComponent={
            hasMore ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadOlderMessages}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#ff4655" />
                ) : (
                  <Text style={styles.loadMoreText}>
                    Load previous messages
                  </Text>
                )}
              </TouchableOpacity>
            ) : null
          }
          onContentSizeChange={() => {
            if (isKeyboardVisible) {
              setTimeout(() => scrollToBottom(true), 150);
            }
          }}
          onLayout={() => {
            if (!isKeyboardVisible) {
              setTimeout(() => scrollToBottom(false), 100);
            }
          }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />

        {/* Input Bar - Animated with keyboard */}
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              transform: [
                { translateY: Animated.multiply(keyboardHeight, -1) },
              ],
            },
          ]}
        >
          <View style={styles.inputBar}>
            <TouchableOpacity
              onPress={handlePickAttachment}
              style={styles.attachButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.attachButtonText}>＋</Text>
            </TouchableOpacity>

            <TextInput
              ref={textInputRef}
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              multiline
              maxLength={1000}
              enablesReturnKeyAutomatically
              returnKeyType="default"
              blurOnSubmit={false}
              onSubmitEditing={send}
            />

            <TouchableOpacity
              onPress={send}
              disabled={sending || (!text.trim() && attachments.length === 0)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={[
                  styles.sendButton,
                  !text.trim() && attachments.length === 0
                    ? styles.sendButtonDisabled
                    : null,
                ]}
              >
                {sending ? "..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Safe area spacer for iOS */}
          {Platform.OS === "ios" && (
            <Animated.View style={{ height: keyboardHeight }} />
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
