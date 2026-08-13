import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHeroSlideDocument extends Document {
  id: string;
  badgeText?: string;
  badge?: string;
  titleFirstLine?: string;
  titleHighlight?: string;
  title?: string;
  description?: string;
  subtitle?: string;
  tagline?: string;
  primaryButtonText?: string;
  primary_button_text?: string;
  primaryButtonLink?: string;
  primary_button_link?: string;
  featuredProductId?: string;
  featured_product_id?: string;
  customImageUrl?: string;
  custom_image_url?: string;
  image_url?: string;
  cta_text?: string;
  cta_link?: string;
  isActive: boolean;
  is_active: boolean;
  display_order?: number;
  created_at?: Date;
}

const HeroSlideSchema = new Schema<IHeroSlideDocument>(
  {
    id: { type: String, required: true, unique: true },
    badgeText: { type: String },
    badge: { type: String },
    titleFirstLine: { type: String },
    titleHighlight: { type: String },
    title: { type: String },
    description: { type: String },
    subtitle: { type: String },
    tagline: { type: String },
    primaryButtonText: { type: String },
    primary_button_text: { type: String },
    primaryButtonLink: { type: String },
    primary_button_link: { type: String },
    featuredProductId: { type: String },
    featured_product_id: { type: String },
    customImageUrl: { type: String },
    custom_image_url: { type: String },
    image_url: { type: String },
    cta_text: { type: String },
    cta_link: { type: String },
    isActive: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
    display_order: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const HeroSlideModel: Model<IHeroSlideDocument> =
  mongoose.models.HeroSlide || mongoose.model<IHeroSlideDocument>('HeroSlide', HeroSlideSchema);

export default HeroSlideModel;
