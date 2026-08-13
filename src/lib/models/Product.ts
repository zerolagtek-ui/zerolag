import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductDocument extends Document {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  image2_url?: string;
  image3_url?: string;
  image4_url?: string;
  gallery_images?: string[];
  specs?: Record<string, string>;
  description?: string;
  features?: string[];
  tags?: string[];
  stock?: number;
  in_stock?: boolean;
  rating?: number;
  reviews_count?: number;
  featured?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  badge?: string;
  warranty?: string;
  created_at?: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    title: { type: String },
    slug: { type: String },
    brand: { type: String, default: 'ZeroLag' },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    originalPrice: { type: Number },
    image: { type: String, required: true },
    images: [{ type: String }],
    image2_url: { type: String },
    image3_url: { type: String },
    image4_url: { type: String },
    gallery_images: [{ type: String }],
    specs: { type: Schema.Types.Mixed, default: {} },
    description: { type: String, default: '' },
    features: [{ type: String }],
    tags: [{ type: String }],
    stock: { type: Number, default: 10 },
    in_stock: { type: Boolean, default: true },
    rating: { type: Number, default: 5.0 },
    reviews_count: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    is_new: { type: Boolean, default: false },
    badge: { type: String },
    warranty: { type: String, default: '1 Year Official Warranty' },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ProductModel: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);

export default ProductModel;
