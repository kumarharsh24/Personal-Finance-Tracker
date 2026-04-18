const db = require('../config/db');

async function createNotification(userId, type, message) {
  const [notification] = await db('notifications')
    .insert({ user_id: userId, type, message })
    .returning('*');

  // Attempt to send email notification
  await sendEmailNotification(userId, type, message);

  return notification;
}

async function getNotifications(userId, unreadOnly = false) {
  const query = db('notifications')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(50);

  if (unreadOnly) {
    query.andWhere({ is_read: false });
  }

  return query;
}

async function markAsRead(userId, id) {
  const [notification] = await db('notifications')
    .where({ id, user_id: userId })
    .update({ is_read: true })
    .returning('*');
  return notification;
}

async function markAllAsRead(userId) {
  await db('notifications')
    .where({ user_id: userId, is_read: false })
    .update({ is_read: true });
}

async function getUnreadCount(userId) {
  const [result] = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .count('id as count');
  return parseInt(result.count);
}

async function sendEmailNotification(userId, type, message) {
  try {
    const user = await db('users').where({ id: userId }).first();
    if (!user || !user.notification_email) return;

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey || apiKey === 'your-sendgrid-api-key') {
      console.log(`[Email Notification] To: ${user.email} | Type: ${type} | ${message}`);
      return;
    }

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(apiKey);

    await sgMail.send({
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@financetracker.com',
      subject: `Finance Tracker Alert: ${type.replace(/_/g, ' ').toUpperCase()}`,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #e74c3c;">⚠️ ${type.replace(/_/g, ' ').toUpperCase()}</h2>
        <p>${message}</p>
        <hr>
        <p style="color: #999; font-size: 12px;">Personal Finance Tracker</p>
      </div>`,
    });

    // Mark that email was sent
    await db('notifications')
      .where({ user_id: userId, type, message })
      .orderBy('created_at', 'desc')
      .limit(1)
      .update({ sent_email: true });
  } catch (err) {
    console.error('Failed to send email notification:', err.message);
  }
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
