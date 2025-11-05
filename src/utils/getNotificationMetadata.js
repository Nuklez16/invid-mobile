// src/utils/getNotificationMetadata.js
export default function getNotificationMetadata(notif) {
  const { type, data = {} } = notif;
  const id = notif.id;

  switch (type) {
    case 'forum_mention': {
      const mentioner = data.mentioner || data.username || 'Someone';
      const topicId = data.topic_id;
      const postId = data.post_id;
      return {
        text: `${mentioner} mentioned you in ${data.topic_title || 'a thread'}`,
        target: `/forum/thread/${topicId}#post-${postId}`,
      };
    }

    case 'forum_reply': {
      const usernames = data.usernames || [];
      let userText = 'Someone replied to your thread';

      if (usernames.length === 1) {
        userText = `${usernames[0]} replied to your thread`;
      } else if (usernames.length > 1) {
        userText = `${usernames.length} people replied to your thread`;
      }

      // Handle missing post_id gracefully
      const topicId = data.topic_id;
      const postId = data.post_id;
      const target = postId 
        ? `/forum/thread/${topicId}#post-${postId}`
        : `/forum/thread/${topicId}`;

      return {
        text: userText,
        target: target,
        excerpt: data.excerpt || '<p>New reply</p>',
        threadLink: target,
        threadTitle: data.topic_title || 'Thread',
        replierUsername: usernames.length > 0 ? usernames[0] : 'Someone'
      };
    }

    case 'forum_thread_activity': {
      return {
        text: `${data.username || 'Someone'} replied in a thread you're watching: ${data.topic_title}`,
        target: `/forum/thread/${data.topic_id}`,
      };
    }

    case 'match_chat':
      return {
        text: `New message in your match chat`,
        target: `/tournaments/matches/${data.matchId}`,
      };

    case 'match_reminder_soon':
      return {
        text: `Reminder: Your match is starting soon`,
        target: `/tournaments/matches/${data.matchId}`,
      };

    case 'team_invite':
      return {
        text: `You've been invited to join ${data.team_name || 'a team'}`,
        target: `/user/manageteams`,
      };

    // ──────────────────────────────────────────────────────────────
    // NEW: Direct message notifications
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
        target: conversationId ? `/user/discussion/${conversationId}` : `/messages`,
      };
    }

    // NEW: PUG ready reminder notifications
    case 'pug_ready_reminder': {
      const lobbyId = `${data.lobbyId || data.lobby_id || data.lobby || ''}`.trim();
      const msg = data.message || 'Your PUG is about to start! Please ready up.';
      return {
        text: msg,
        target: lobbyId ? `/lobby/${lobbyId}` : `/pugs`,
      };
    }
    // ──────────────────────────────────────────────────────────────

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