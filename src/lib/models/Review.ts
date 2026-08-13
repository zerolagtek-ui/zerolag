import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReviewDocument extends Document {
  product_id: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  status: string;
  created_at?: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    product_id: { type: String, required: true, index: true },
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    rating: { type: Number, required: true, default: 5 },
    comment: { type: String, required: true },
    status: { type: String, default: 'approved' },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ReviewModel: Model<IReviewDocument> =
  mongoose.models.Review || mongoose.model<IReviewDocument>('Review', ReviewSchema);

export default ReviewModel;
