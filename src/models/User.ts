import mongoose, { Schema, Document, IndexOptions } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: 'owner' | 'admin';
  avatar?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['owner', 'admin'], required: true, default: 'owner' },
    avatar: { type: String },
    googleId: { type: String },
  },
  { timestamps: true }
);

UserSchema.index({ googleId: 1 });

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('id', false);

export default mongoose.model<IUser>('User', UserSchema);
