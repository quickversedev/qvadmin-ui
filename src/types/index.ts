export type OrderStatus =
  | 'PENDING'
  | 'CANCELLED'
  | 'PACKED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'SHIPPED';

export interface ShopAddress {
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface Order {
  orderId: string;
  customerName: string;
  state: string;
  totalAmount: number;
  creationTime: string;
}

export interface Shop {
  shopId: string;
  shopName: string;
  shopImage?: string;
  shopDetails: Vendor;
  orders: Order[];
}

export interface Vendor {
  shopId: string;
  name: string;
  address: ShopAddress;
  logo: string;
  banner: string;
  owner: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  preparationTime: string;
  description: string;
  category: string;
  coordinates: Coordinates;
  storeActive: boolean;
  featured: boolean;
}

export interface PromotionBanner {
  id?: string | number;
  promotionId?: string | number;
  promoId?: string | number;
  bannerId?: string | number;
  promoBannerId?: string | number;
  promotionBannerId?: string | number;
  sequence?: string | number;
  shopId: string;
  title: string;
  subtitle: string;
  size: string;
  backgroundColor: string;
  imageURL: string;
  isBannerImage?: boolean;
  bannerImage: boolean;
}

export interface PageItem {
  pageId?: string | number;
  pageName: string;
  posterLink: string;
  promotion: PromotionBanner[];
}
