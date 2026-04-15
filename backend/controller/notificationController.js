import Notification from "../models/Notification.js";

/*
 Helper — create notifications for a list of recipient IDs.
 Skips the actor (you don't notify yourself).
*/
export async function createNotifications({ recipientIds, actorId, type, taskId, message }) {
  const filtered = recipientIds
    .map(id => id.toString())
    .filter(id => id !== actorId.toString());

  if (filtered.length === 0) return;

  const docs = filtered.map(recipientId => ({
    recipient: recipientId,
    actor: actorId,
    type,
    task: taskId,
    message
  }));

  await Notification.insertMany(docs);
}

/*
 GET /notifications
 Returns the 30 most recent notifications for the logged-in user.
*/
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("actor", "name")
      .populate("task", "title");

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

/*
 GET /notifications/unread-count
 Lightweight count-only endpoint — polled every 30s from the client.
*/
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Failed to count notifications", error: error.message });
  }
};

/*
 PATCH /notifications/:id/read
 Mark a single notification as read.
*/
export const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true }
    );
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notification", error: error.message });
  }
};

/*
 PATCH /notifications/read-all
 Mark ALL unread notifications for this user as read.
*/
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark all notifications", error: error.message });
  }
};
