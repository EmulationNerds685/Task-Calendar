import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const verifyUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const names = ['Mohit', 'Ayush', 'Bhaskar', 'Prabhat', 'Sumit'];
    const users = await User.find({ name: { $in: names } });

    console.log('Found users:');
    users.forEach(u => console.log(`${u.name}: ${u._id}`));

    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log(`Admin (${admin.name}): ${admin._id}`);
    } else {
      console.log('No admin found!');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

verifyUsers();
