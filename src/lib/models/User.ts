import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  email: string;
  password_hash: string;
  name?: string;
  role: string;
  is_admin: boolean;
  is_verified: boolean;
  created_at?: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, default: 'ZeroLag Admin' },
    role: { type: String, default: 'admin' },
    is_admin: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default UserModel;
