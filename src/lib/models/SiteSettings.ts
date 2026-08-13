import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISiteSettingsDocument extends Document {
  key: string;
  value: string;
  updated_at?: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettingsDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const SiteSettingsModel: Model<ISiteSettingsDocument> =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettingsDocument>('SiteSettings', SiteSettingsSchema);

export default SiteSettingsModel;
