import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authedFetch } from '../../src/api/client';

export default function NewsScreen() {
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { width } = Dimensions.get('window');

const fetchArticles = async () => {
  try {
    const [resAll, resFeatured] = await Promise.all([
      authedFetch('/news'),
      authedFetch('/news/featured')
    ]);

    const allData = await resAll.json();
    const featuredData = await resFeatured.json();

    if (allData.success) setArticles(allData.articles);
    if (featuredData.success) setFeatured(featuredData.featured);
  } catch (err) {
    console.error('❌ Failed to fetch news:', err);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => { fetchArticles(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchArticles();
  }, []);

  const renderFeatured = (item) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => router.push(`/news/${item.slug}`)}
      style={{
        width: width * 0.8,
        marginRight: 14,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#111',
      }}
    >
      {item.feature_image ? (
        <Image
          source={{ uri: item.feature_image }}
          style={{ width: '100%', height: 200 }}
          resizeMode="cover"
        />
      ) : null}
      <View style={{ padding: 12 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={{ color: '#777', fontSize: 12, marginTop: 6 }}>
          {new Date(item.published_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderArticle = ({ item }) => (
    <TouchableOpacity
      style={{
        marginBottom: 14,
        backgroundColor: '#111',
        borderRadius: 10,
        overflow: 'hidden',
      }}
      onPress={() => router.push(`/news/${item.slug}`)}
    >
      {item.feature_image ? (
        <Image
          source={{ uri: item.feature_image }}
          style={{ width: '100%', height: 180 }}
          resizeMode="cover"
        />
      ) : null}
      <View style={{ padding: 12 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {item.title}
        </Text>
        {item.summary ? (
          <Text
            style={{ color: '#aaa', marginTop: 6 }}
            numberOfLines={3}
          >
            {item.summary}
          </Text>
        ) : null}
        <Text style={{ color: '#777', fontSize: 12, marginTop: 8 }}>
          {new Date(item.published_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>News</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#ff4655" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            featured.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 16, marginBottom: 10 }}>
                  Featured
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {featured.map(renderFeatured)}
                </ScrollView>
                <View
                  style={{
                    height: 1,
                    backgroundColor: '#222',
                    marginHorizontal: 16,
                    marginTop: 16,
                  }}
                />
              </View>
            ) : null
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff4655']}
              tintColor="#ff4655"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
