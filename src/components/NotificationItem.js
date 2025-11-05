// src/components/NotificationItem.js
import React, { useState } from 'react';
import { Pressable, Text, View, Linking, Alert } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import getNotificationMetadata from '../utils/getNotificationMetadata';
import { DateTime } from 'luxon';

const API_BASE = 'https://invid.au';

export default function NotificationItem({ note }) {
  const [isRead, setIsRead] = useState(note.is_read);
  const { accessToken } = useAuthContext();
  const { text, target } = getNotificationMetadata(note);

  const markAsRead = async () => {
    if (isRead || !note.id) return;
    try {
      const response = await fetch(`${API_BASE}/mobile/notifications/${note.id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setIsRead(true);
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  };

  const handlePress = async () => {
    try {
      await markAsRead();
      if (target) {
        Linking.openURL(`https://invid.au${target}`);
      }
    } catch (error) {
      console.warn('Error handling notification press:', error);
    }
  };

  const getRelativeTime = (timestamp) => {
    try {
      const dt = DateTime.fromISO(timestamp);
      const now = DateTime.local();
      
      if (!dt.isValid) {
        return 'Unknown time';
      }

      const diff = now.diff(dt, ['days', 'hours', 'minutes']).toObject();

      if (diff.days >= 7) return dt.toFormat('dd/MM/yy – h:mm a');
      if (diff.days >= 2) return dt.toFormat('cccc'); // e.g. "Monday"
      if (diff.days >= 1) return 'Yesterday';
      if (diff.hours >= 1) return `${Math.floor(diff.hours)} hour${Math.floor(diff.hours) > 1 ? 's' : ''} ago`;
      if (diff.minutes >= 1) return `${Math.floor(diff.minutes)} min ago`;
      return 'Just now';
    } catch (error) {
      console.warn('Error parsing time:', error);
      return 'Unknown time';
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <View style={{
        padding: 16,
        backgroundColor: isRead ? '#1a1a1a' : '#2a1a2a',
        borderRadius: 8,
        marginBottom: 8,
        marginHorizontal: 12,
        borderLeftWidth: 4,
        borderLeftColor: isRead ? '#333' : '#ff4655',
      }}>
        <Text style={{ 
          color: '#fff', 
          fontWeight: isRead ? 'normal' : '600',
          fontSize: 14,
          lineHeight: 20,
        }}>
          {text || note.message || 'No message'}
        </Text>
        <Text style={{ 
          fontSize: 12, 
          color: '#888', 
          marginTop: 6,
          fontWeight: '500'
        }}>
          {getRelativeTime(note.created_at)}
        </Text>
        {note.type && (
          <Text style={{
            fontSize: 11,
            color: '#666',
            marginTop: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {note.type}
          </Text>
        )}
      </View>
    </Pressable>
  );
}