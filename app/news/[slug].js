import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RenderHTML from 'react-native-render-html';
import { authedFetch } from '../../src/api/client';

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const { width } = Dimensions.get('window');
  const router = useRouter();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await authedFetch(`/news/${slug}`);
        const data = await res.json();
        if (data.success) setArticle(data.article);
      } catch (err) {
        console.error('❌ Failed to load article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (loading)
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator color="#ff4655" />
      </SafeAreaView>
    );

  if (!article) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ color: '#fff' }}>Article not found</Text>
      </SafeAreaView>
    );
  }

  const imageHeight = width * 0.56; // 16:9 aspect ratio

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Featured Image */}
        {article.feature_image ? (
          <Image
            source={{ uri: article.feature_image }}
            style={{ width: '100%', height: imageHeight }}
            resizeMode="cover"
          />
        ) : null}

        <View style={{ padding: 16 }}>
          {/* Title */}
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
            {article.title}
          </Text>

          {/* Date */}
          <Text style={{ color: '#777', marginTop: 6 }}>
            {new Date(article.published_at).toLocaleDateString()}
          </Text>

          {/* Author */}
          {article.author_id && (
            <TouchableOpacity
              onPress={() => router.push(`/profile/${article.author_id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 14,
                paddingVertical: 6,
              }}
            >
              <Image
                source={{
                  uri:
                    article.author_avatar ||
                    'https://invid.au/static/default-avatar.png',
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 10,
                  backgroundColor: '#222',
                }}
              />
              <View>
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {article.author_username}
                </Text>
                <Text style={{ color: '#888', fontSize: 12 }}>View Profile</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Summary */}
          {article.summary ? (
            <Text style={{ color: '#aaa', marginTop: 12 }}>{article.summary}</Text>
          ) : null}

          {/* Content */}
          {article.content ? (
            <RenderHTML
              contentWidth={width - 32}
              source={{ html: article.content }}
              baseStyle={{ color: '#ddd', marginTop: 16, lineHeight: 22 }}
              tagsStyles={{
                p: { color: '#ddd', marginBottom: 12 },
                h2: { color: '#fff', fontSize: 20, marginTop: 18 },
                a: { color: '#ff4655' },
              }}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
