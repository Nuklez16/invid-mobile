// src/api/user.js
import { getTokens } from '../storage/authStorage';
import { authedFetch } from './client';

export async function getUserProfile() {
  try {
    // Try authedFetch first
    const response = await authedFetch('/user/profile', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('📱 API Response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch profile');
    }
    
    return data.profile;
  } catch (error) {
    console.error('Failed to fetch user profile with authedFetch, trying direct:', error);
    
    // Fallback to direct fetch if authedFetch fails
    const { accessToken } = await getTokens();
    const response = await fetch('https://invid.au/mobile/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.profile;
  }
}