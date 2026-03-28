import mongoose from 'mongoose';
import User from './models/User.js';
import Task from './models/Task.js';
import CalendarEvent from './models/CalendarEvent.js';
import Settings from './models/Settings.js';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Get Users
    const names = ['Mohit', 'Ayush', 'Bhaskar', 'Prabhat', 'Sumit'];
    const users = await User.find({ name: { $in: names } });
    if (users.length === 0) {
      console.error('No members found. Please ensure they are created first.');
      process.exit(1);
    }
    const admin = await User.findOne({ role: 'admin' });
    const adminId = admin ? admin._id : users[0]._id;

    console.log(`Found ${users.length} members and ${admin ? 'an admin' : 'no admin (using first member)'}.`);

    // 2. Clear existing sample data (optional, but safer for repeatable testing)
    // await Task.deleteMany({});
    // await CalendarEvent.deleteMany({});

    // 3. Define Categories and Allocated Hours
    const categories = ["Research", "Admin", "Development", "Design", "Operations"];
    const settings = await Settings.getSingleton();
    settings.categories = categories;
    settings.allocatedHours = new Map([
      ["Research", 10],
      ["Admin", 5],
      ["Development", 20],
      ["Design", 15],
      ["Operations", 10]
    ]);
    await settings.save();
    console.log('Settings updated with categories and allocated hours.');

    // 4. Create Tasks and Calendar Events for this week
    const today = dayjs();
    const startOfWeek = today.startOf('week'); // Usually Sunday

    const tasksData = [
      { title: 'Market Research', category: 'Research', estimatedTime: 120, priority: 'High' },
      { title: 'Code Review', category: 'Development', estimatedTime: 90, priority: 'Medium' },
      { title: 'Project Planning', category: 'Admin', estimatedTime: 60, priority: 'Low' },
      { title: 'UI Design Refactor', category: 'Design', estimatedTime: 180, priority: 'High' },
      { title: 'Database Migration', category: 'Development', estimatedTime: 150, priority: 'Medium' },
      { title: 'Client Meeting', category: 'Operations', estimatedTime: 120, priority: 'High' },
      { title: 'Bug Fixing', category: 'Development', estimatedTime: 240, priority: 'High' },
      { title: 'Documentation', category: 'Admin', estimatedTime: 60, priority: 'Low' },
      { title: 'A/B Testing Analysis', category: 'Research', estimatedTime: 180, priority: 'Medium' },
      { title: 'Sprint Retrospective', category: 'Operations', estimatedTime: 90, priority: 'Medium' },
    ];

    console.log('Creating tasks and scheduling events...');

    for (let i = 0; i < tasksData.length; i++) {
        const data = tasksData[i];
        const task = await Task.create({
            ...data,
            createdBy: adminId,
            assignedTo: [users[i % users.length]._id],
            dueDate: today.add(2, 'day').toDate(),
            status: 'In Progress'
        });

        // Schedule event for a day this week (distributed)
        const dayOffset = i % 6; // Spread over 6 days
        const eventDate = startOfWeek.add(dayOffset, 'day').toDate();
        
        await CalendarEvent.create({
            task: task._id,
            user: users[i % users.length]._id,
            date: eventDate,
            startTime: '09:00',
            endTime: '11:00',
            isAutoScheduled: true,
            notes: `Seeded event for ${data.title}`
        });
    }

    console.log('Successfully seeded 10 tasks and 10 calendar events.');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
