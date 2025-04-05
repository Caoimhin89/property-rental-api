import { UserRole } from "user/entities/user.entity";
import { Connection } from "./types/types";
import { OrganizationRole } from "../graphql";
import { User as UserEntity } from "user/entities/user.entity";
export function formatCurrency(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: (locale === 'en-US') ? 'USD' : 'RUB'
  }).format(amount);
}

export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function toCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

export function fromCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf8');
}

/**
 * Converts miles to kilometers
 * @param miles Distance in miles
 * @returns Distance in kilometers
 */
export function milesToKilometers(miles: number): number {
  return miles * 1.60934;
}

/**
 * Converts kilometers to miles
 * @param kilometers Distance in kilometers
 * @returns Distance in miles
 */
export function kilometersToMiles(kilometers: number): number {
  return kilometers / 1.60934;
}

/**
 * Converts square meters to square feet
 * @param squareMeters Area in square meters
 * @returns Area in square feet
 */
export function squareMetersToSquareFeet(squareMeters: number): number {
  return squareMeters * 10.7639;
}

/**
 * Converts square feet to square meters
 */
export function squareFeetToSquareMeters(squareFeet: number): number {
  return squareFeet / 10.7639;
}

/**
 * Converts acres to square meters
 */
export function acresToSquareMeters(acres: number): number {
  return acres * 4046.86;
}

/**
 * Converts square meters to acres
 */
export function squareMetersToAcres(squareMeters: number): number {
  return squareMeters / 4046.86;
}

/**
 * Converts square feet to acres
 */
export function squareFeetToAcres(squareFeet: number): number {
  return squareFeet / 43560;
}

/**
 * Converts acres to square feet
 */
export function acresToSquareFeet(acres: number): number {
  return acres * 43560;
}

/**
 * Builds a paginated response
 * @param items
 * @param limit 
 * @param getCursor 
 */
export function buildPaginatedResponse<T>(
  items: T[],
  totalCount: number,
  limit: number,
  getCursor: (item: T) => string): Connection<T> {
  const edges = items.map((item) => ({
    cursor: getCursor(item),
    node: item
  }));

  const hasNextPage = edges.length > limit;
  if (hasNextPage) {
    edges.pop();
  }

  const hasPreviousPage = edges.length > 0;

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges?.[0]?.cursor,
      endCursor: edges?.[edges?.length - 1]?.cursor
    },
    totalCount
  };
}

export async function userHasAccessToResource(user: UserEntity, resource: any) {
  if (user.role === UserRole.ADMIN) {
    return true;
  }
  if (resource.userId === user.id) {
    return true;
  }
  if (user.organizationMembership.role === OrganizationRole.OWNER || user.organizationMembership.role === OrganizationRole.MEMBER) {
    if (resource.organizationId === user.organizationMembership.organizationId) {
      return true;
    }
    if (resource.property?.organizationId === user.organizationMembership.organizationId) {
      return true;
    }
  }
  return false;
}
