// src/utils/getNotificationMetadata.js
export default function getNotificationMetadata(notif) {
  const { type, data = {} } = notif;
  const id = notif.id;

  switch (type) {
    // ───────────────────────────────
    // Forum mentions
    case 'forum_mention': {
      const mentioner = data.mentioner || data.username || 'Someone';
      const topicId = data.topic_id;
      const postId = data.post_id;
      return {
        text: `${mentioner} mentioned you in ${data.topic_title || 'a thread'}`,
        // ✅ Updated mobile path
        target: postId
          ? `/forums/topic/${topicId}?highlight=${postId}`
          : `/forums/topic/${topicId}`,
      };
    }

    // ───────────────────────────────
    // Replies to your thread
    case 'forum_reply': {
      const usernames = data.usernames || [];
      let userText = 'Someone replied to your thread';

      if (usernames.length === 1) {
        userText = `${usernames[0]} replied to your thread`;
      } else if (usernames.length > 1) {
        userText = `${usernames.length} people replied to your thread`;
      }

      const topicId = data.topic_id;
      const postId = data.post_id;
      const target = postId
        ? `/forums/topic/${topicId}?highlight=${postId}`
        : `/forums/topic/${topicId}`;

      return {
        text: userText,
        target,
        excerpt: data.excerpt || '<p>New reply</p>',
        threadLink: target,
        threadTitle: data.topic_title || 'Thread',
        replierUsername: usernames.length > 0 ? usernames[0] : 'Someone',
      };
    }

    // ───────────────────────────────
    // Replies in watched threads
    case 'forum_thread_activity': {
      return {
        text: `${data.username || 'Someone'} replied in a thread you're watching: ${data.topic_title}`,
        target: `/forums/topic/${data.topic_id}`,
      };
    }

    // ───────────────────────────────
    // Match chat messages
    case 'match_chat':
      return {
        text: `New message in your match chat`,
        target: `/tournaments/matches/${data.matchId}`,
      };

    // ───────────────────────────────
    // Match reminders
    case 'match_reminder_soon':
      return {
        text: `Reminder: Your match is starting soon`,
        target: `/tournaments/matches/${data.matchId}`,
      };

    // ───────────────────────────────
    // Team invites
    case 'team_invite':
      return {
        text: `You've been invited to join ${data.team_name || 'a team'}`,
        target: `/user/manageteams`,
      };
// ───────────────────────────────
// Direct messages (MOBILE VERSION)
// ───────────────────────────────
case 'directmessage':
case 'direct_message':
case 'directMessage': {
  const sender =
    data.username ||
    data.senderUsername ||
    data.senderName ||
    (typeof data.senderId !== 'undefined' ? `User #${data.senderId}` : 'Someone');

  const preview = data.messagePreview || data.preview || '';
  const conversationId = data.conversationId || data.conversation_id;

  return {
    text: preview
      ? `New message from ${sender}: ${preview}`
      : `New message from ${sender}`,

    // ✅ MOBILE: route into the in-app conversation screen
    target: conversationId
      ? `/messages/${conversationId}`
      : `/messages`,
  };
}

    // ───────────────────────────────
    // PUG ready reminder
    case 'pug_ready_reminder': {
      const lobbyId = `${data.lobbyId || data.lobby_id || data.lobby || ''}`.trim();
      const msg = data.message || 'Your PUG is about to start! Please ready up.';
      return {
        text: msg,
        target: lobbyId ? `/lobby/${lobbyId}` : `/pugs`,
      };
    }

    // ───────────────────────────────
    // Fallback for match updates
    default: {
      if (String(type).startsWith('match_')) {
        return {
          text: `Match update: ${type.replace(/match_/, '').replace(/_/g, ' ')}`,
          target: `/matches/${data.matchId}`,
        };
      }
      return { text: 'You have a new notification.' };
    }
  }
}
