import app from './app';
import { connectDB } from './config/database';
import User from './models/User';
import Business from './models/Business';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const PORT = process.env.PORT || 5000;

const seedDemo = async (): Promise<void> => {
  const email = 'demo@smartbizai.com';
  let user = await User.findOne({ email });
  if (!user) {
    const hashedPassword = await bcrypt.hash('Demo12345', 12);
    user = new User({ email, password: hashedPassword, name: 'Demo User' });
    await user.save();
  }
  const businessCount = await Business.countDocuments({ owner: user._id });
  if (businessCount === 0) {
    const business = new Business({ name: 'Demo Business', owner: user._id, type: 'Retail', industry: 'E-commerce' });
    await business.save();
    console.log('Demo business created for existing user');
  }
};

const startServer = async (): Promise<void> => {
  await connectDB();
  await seedDemo();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
