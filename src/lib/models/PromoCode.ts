import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromoCodeDocument extends Document {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  expiresAt?: Date;
  created_at?: Date;
}

const PromoCodeSchema = new Schema<IPromoCodeDocument>(
  {
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0, min: 0 },
    maxUsage: { type: Number, min: 0 },
    expiresAt: { type: Date },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const PromoCodeModel: Model<IPromoCodeDocument> =
  mongoose.models.PromoCode || mongoose.model<IPromoCodeDocument>('PromoCode', PromoCodeSchema);

export default PromoCodeModel;
