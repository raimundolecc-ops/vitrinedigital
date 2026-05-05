/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  image: string;
  isOrganic?: boolean;
  isLocal?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  status: 'EM ESTOQUE' | 'ESTOQUE BAIXO' | 'FORA DE ESTOQUE';
}

export interface Merchant {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewsCount: number;
  banner: string;
  logo: string;
  categories: string[];
  tags: string[];
}

export type ViewState = 'EXPLORER' | 'MERCHANT' | 'DASHBOARD' | 'LOGIN' | 'ADD_PRODUCT';
