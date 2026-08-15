import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderDocument extends Document {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  secondary_phone?: string;
  shipping_address: string;
  payment_method: string;
  shipping_method?: string;
  items: Schema.Types.Mixed[];
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  status: string;
  created_at?: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    id: { type: String, required: true, unique: true },
    customer_name: { type: String, required: true },
    customer_email: { type: String, required: true },
    customer_phone: { type: String, required: true },
    secondary_phone: { type: String },
    shipping_address: { type: String, required: true },
    payment_method: { type: String, required: true },
    shipping_method: { type: String, default: 'Trans Express' },
    items: { type: [Schema.Types.Mixed], default: [] },
    subtotal: { type: Number, default: 0 },
    shipping_fee: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    status: { type: String, default: 'Pending' },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const OrderModel: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default OrderModel;
