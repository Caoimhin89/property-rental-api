
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum AreaUnit {
    SQUARE_METERS = "SQUARE_METERS",
    SQUARE_FEET = "SQUARE_FEET",
    ACRES = "ACRES"
}

export enum PropertyType {
    APARTMENT = "APARTMENT",
    HOUSE = "HOUSE",
    CONDO = "CONDO",
    VILLA = "VILLA",
    OTHER = "OTHER"
}

export enum AvailabilityStatus {
    AVAILABLE = "AVAILABLE",
    BOOKED = "BOOKED",
    UNAVAILABLE = "UNAVAILABLE"
}

export enum OrganizationType {
    COMPANY = "COMPANY",
    SOLE_PROPRIETORSHIP = "SOLE_PROPRIETORSHIP",
    PARTNERSHIP = "PARTNERSHIP",
    OTHER = "OTHER"
}

export enum OrganizationRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MEMBER = "MEMBER"
}

export enum MaintenanceRequestStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}

export enum MaintenanceRequestUrgency {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}

export enum BedType {
    BED = "BED",
    SOFA_BED = "SOFA_BED",
    COT = "COT",
    OTHER = "OTHER"
}

export enum BedSize {
    SINGLE = "SINGLE",
    DOUBLE = "DOUBLE",
    QUEEN = "QUEEN",
    KING = "KING",
    CALIFORNIA_KING = "CALIFORNIA_KING",
    CALIFORNIA_QUEEN = "CALIFORNIA_QUEEN",
    OTHER = "OTHER"
}

export enum NotificationType {
    ADMIN_BOOKING_CONFIRMATION_REQUESTED = "ADMIN_BOOKING_CONFIRMATION_REQUESTED",
    ADMIN_PROPERTY_APPROVAL_REQUIRED = "ADMIN_PROPERTY_APPROVAL_REQUIRED",
    ADMIN_REVIEW_APPROVAL_REQUIRED = "ADMIN_REVIEW_APPROVAL_REQUIRED",
    BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
    BOOKING_REJECTED = "BOOKING_REJECTED",
    BOOKING_CANCELLED = "BOOKING_CANCELLED",
    BOOKING_PAYMENT = "BOOKING_PAYMENT",
    BOOKING_CHECKIN = "BOOKING_CHECKIN",
    BOOKING_CHECKOUT = "BOOKING_CHECKOUT",
    REVIEW_REQUESTED = "REVIEW_REQUESTED",
    REVIEW_PUBLISHED = "REVIEW_PUBLISHED",
    REVIEW_REJECTED = "REVIEW_REJECTED",
    PROPERTY_CREATED = "PROPERTY_CREATED",
    PROPERTY_APPROVED = "PROPERTY_APPROVED",
    PROPERTY_REJECTED = "PROPERTY_REJECTED",
    MAINTENANCE_REQUEST_CREATED = "MAINTENANCE_REQUEST_CREATED",
    MAINTENANCE_REQUEST_UPDATED = "MAINTENANCE_REQUEST_UPDATED",
    MAINTENANCE_REQUEST_COMPLETED = "MAINTENANCE_REQUEST_COMPLETED",
    MAINTENANCE_REQUEST_CANCELLED = "MAINTENANCE_REQUEST_CANCELLED",
    ORGANIZATION_INVITATION = "ORGANIZATION_INVITATION",
    ORGANIZATION_MEMBER_ADDED = "ORGANIZATION_MEMBER_ADDED",
    ORGANIZATION_MEMBER_REMOVED = "ORGANIZATION_MEMBER_REMOVED",
    OTHER = "OTHER"
}

export enum BookingStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    REJECTED = "REJECTED"
}

export enum YearBuiltOperator {
    EQUALS = "EQUALS",
    GREATER_THAN = "GREATER_THAN",
    LESS_THAN = "LESS_THAN",
    BETWEEN = "BETWEEN"
}

export enum SortOrder {
    ASC = "ASC",
    DESC = "DESC"
}

export enum PropertySortField {
    PRICE = "PRICE",
    CREATED_AT = "CREATED_AT",
    YEAR_BUILT = "YEAR_BUILT",
    AREA = "AREA",
    LOT_SIZE = "LOT_SIZE",
    NUM_BEDROOMS = "NUM_BEDROOMS",
    NUM_BATHROOMS = "NUM_BATHROOMS"
}

export enum SearchResultType {
    PROPERTY = "PROPERTY",
    LOCATION = "LOCATION"
}

export class LoginInput {
    email: string;
    password: string;
}

export class SignupInput {
    email: string;
    password: string;
    name: string;
}

export class CreateOrganizationInput {
    name: string;
    organizationType: OrganizationType;
    primaryUserId?: Nullable<string>;
}

export class UpdateOrganizationInput {
    name?: Nullable<string>;
    organizationType?: Nullable<OrganizationType>;
}

export class CreateUserInput {
    email: string;
    password: string;
    name: string;
}

export class CreateBedInput {
    bedType: BedType;
    bedSize: BedSize;
    room: string;
}

export class CreatePropertyInput {
    name: string;
    description?: Nullable<string>;
    maxOccupancy: number;
    propertyType: PropertyType;
    basePrice: number;
    numBathrooms: number;
    numBedrooms: number;
    numStories: number;
    garageSpaces: number;
    yearBuilt?: Nullable<number>;
    area: number;
    areaUnit: AreaUnit;
    lotSize: number;
    lotSizeUnit: AreaUnit;
    organizationId: string;
    location: CreateLocationInput;
    amenities?: Nullable<CreateAmenityInput[]>;
    images?: Nullable<CreateImageInput[]>;
    beds?: Nullable<CreateBedInput[]>;
}

export class UpdatePropertyInput {
    name?: Nullable<string>;
    description?: Nullable<string>;
    maxOccupancy?: Nullable<number>;
    propertyType?: Nullable<PropertyType>;
    basePrice?: Nullable<number>;
    numBathrooms?: Nullable<number>;
    numBedrooms?: Nullable<number>;
    numStories?: Nullable<number>;
    garageSpaces?: Nullable<number>;
    yearBuilt?: Nullable<number>;
    area?: Nullable<number>;
    areaUnit?: Nullable<AreaUnit>;
    lotSize?: Nullable<number>;
    lotSizeUnit?: Nullable<AreaUnit>;
    organizationId?: Nullable<string>;
    location?: Nullable<UpdateLocationInput>;
    images?: Nullable<UpdateImageInput[]>;
    blockedDates?: Nullable<UpdateBlockedDateInput[]>;
    priceRules?: Nullable<UpdatePriceRuleInput[]>;
}

export class UpdateLocationInput {
    address?: Nullable<string>;
    postalCode?: Nullable<string>;
    postalCodeSuffix?: Nullable<string>;
    city?: Nullable<string>;
    county?: Nullable<string>;
    state?: Nullable<string>;
    country?: Nullable<string>;
    latitude?: Nullable<number>;
    longitude?: Nullable<number>;
    radiusInKm?: Nullable<number>;
    radiusInMiles?: Nullable<number>;
}

export class UpdateBlockedDateInput {
    id?: Nullable<string>;
    startDate?: Nullable<DateTime>;
    endDate?: Nullable<DateTime>;
    reason?: Nullable<string>;
}

export class UpdatePriceRuleInput {
    id?: Nullable<string>;
    startDate?: Nullable<DateTime>;
    endDate?: Nullable<DateTime>;
    price?: Nullable<number>;
    description?: Nullable<string>;
}

export class UpdateImageInput {
    url?: Nullable<string>;
    caption?: Nullable<string>;
}

export class CreateLocationInput {
    address: string;
    postalCode: string;
    postalCodeSuffix?: Nullable<string>;
    city: string;
    county?: Nullable<string>;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
}

export class CreateNearbyPlaceInput {
    name: string;
    type: string;
    location: CreateLocationInput;
}

export class CreateAmenityInput {
    name: string;
    category?: Nullable<string>;
    icon?: Nullable<string>;
    iconUrl?: Nullable<string>;
}

export class CreateImageInput {
    url: string;
    caption?: Nullable<string>;
    propertyId: string;
}

export class CreateReviewInput {
    rating: number;
    text?: Nullable<string>;
}

export class CreateBookingInput {
    userId?: Nullable<string>;
    startDate: DateTime;
    endDate: DateTime;
    numberOfGuests: number;
}

export class CreateBlockedDateInput {
    startDate: DateTime;
    endDate: DateTime;
    reason?: Nullable<string>;
}

export class CreatePriceRuleInput {
    startDate: DateTime;
    endDate: DateTime;
    price: number;
    description?: Nullable<string>;
}

export class UpdateAmenityInput {
    name?: Nullable<string>;
    category?: Nullable<string>;
    icon?: Nullable<string>;
    iconUrl?: Nullable<string>;
}

export class CreateMaintenanceRequestInput {
    propertyId: string;
    urgency: MaintenanceRequestUrgency;
    description: string;
}

export class UpdateMaintenanceRequestInput {
    urgency?: Nullable<MaintenanceRequestUrgency>;
    description?: Nullable<string>;
    status?: Nullable<MaintenanceRequestStatus>;
}

export class CreateMaintenanceCommentInput {
    maintenanceRequestId: string;
    comment: string;
}

export class CreateMaintenanceImageInput {
    maintenanceRequestId: string;
    url: string;
}

export class NotificationFilter {
    read?: Nullable<boolean>;
}

export class PropertyFilter {
    propertyType?: Nullable<PropertyType[]>;
    price?: Nullable<PriceFilter>;
    maxOccupancy?: Nullable<number>;
    numBedrooms?: Nullable<IntRangeFilter>;
    numBathrooms?: Nullable<FloatRangeFilter>;
    numStories?: Nullable<IntRangeFilter>;
    garageSpaces?: Nullable<IntRangeFilter>;
    area?: Nullable<AreaFilter>;
    lotSize?: Nullable<AreaFilter>;
    yearBuilt?: Nullable<YearBuiltFilter>;
    location?: Nullable<LocationFilter>;
    amenities?: Nullable<AmenitiesFilter>;
    searchTerm?: Nullable<string>;
    createdAfter?: Nullable<DateTime>;
    createdBefore?: Nullable<DateTime>;
    updatedAfter?: Nullable<DateTime>;
    updatedBefore?: Nullable<DateTime>;
    availability?: Nullable<DateRangeInput>;
    organizationIds?: Nullable<string[]>;
    sort?: Nullable<PropertySort[]>;
}

export class PaginationInput {
    after?: Nullable<string>;
    before?: Nullable<string>;
    first?: Nullable<number>;
    last?: Nullable<number>;
}

export class LocationFilter {
    latitude?: Nullable<number>;
    longitude?: Nullable<number>;
    maxDistance?: Nullable<number>;
    radiusInKm?: Nullable<number>;
    radiusInMiles?: Nullable<number>;
    postalCode?: Nullable<string>;
    postalCodeSuffix?: Nullable<string>;
    city?: Nullable<string>;
    county?: Nullable<string>;
    state?: Nullable<string>;
    country?: Nullable<string>;
    boundingBox?: Nullable<BoundingBoxInput>;
}

export class AmenityFilter {
    name?: Nullable<string>;
}

export class DateRangeInput {
    startDate: DateTime;
    endDate: DateTime;
}

export class OrganizationFilter {
    type?: Nullable<OrganizationType>;
    search?: Nullable<string>;
}

export class YearBuiltFilter {
    operator: YearBuiltOperator;
    value?: Nullable<number>;
    minValue?: Nullable<number>;
    maxValue?: Nullable<number>;
}

export class PriceFilter {
    min?: Nullable<number>;
    max?: Nullable<number>;
    currency?: Nullable<string>;
}

export class AmenitiesFilter {
    includeAll?: Nullable<string[]>;
    includeAny?: Nullable<string[]>;
    exclude?: Nullable<string[]>;
}

export class PropertySort {
    field: PropertySortField;
    order: SortOrder;
}

export class IntRangeFilter {
    equals?: Nullable<number>;
    min?: Nullable<number>;
    max?: Nullable<number>;
}

export class FloatRangeFilter {
    equals?: Nullable<number>;
    min?: Nullable<number>;
    max?: Nullable<number>;
}

export class AreaFilter {
    min?: Nullable<number>;
    max?: Nullable<number>;
    unit: AreaUnit;
}

export class BoundingBoxInput {
    southWestLat: number;
    southWestLng: number;
    northEastLat: number;
    northEastLng: number;
}

export class SearchFilter {
    types?: Nullable<SearchResultType[]>;
    nearLocation?: Nullable<LocationFilter>;
    propertyTypes?: Nullable<PropertyType[]>;
    priceRange?: Nullable<PriceFilter>;
    minSimilarity?: Nullable<number>;
}

export class Error {
    __typename?: 'Error';
    code: string;
    message: string;
    details?: Nullable<string>;
}

export class AuthResponse {
    __typename?: 'AuthResponse';
    accessToken: string;
    refreshToken: string;
    user: User;
}

export abstract class IMutation {
    __typename?: 'IMutation';

    abstract login(input: LoginInput): AuthResponse | Promise<AuthResponse>;

    abstract signup(input: SignupInput): AuthResponse | Promise<AuthResponse>;

    abstract refreshToken(token: string): AuthResponse | Promise<AuthResponse>;

    abstract createUser(input: CreateUserInput): User | Promise<User>;

    abstract removeUser(id: string): boolean | Promise<boolean>;

    abstract createProperty(input: CreatePropertyInput): Property | Promise<Property>;

    abstract updateProperty(id: string, input: UpdatePropertyInput): PropertyResult | Promise<PropertyResult>;

    abstract removeProperty(id: string): boolean | Promise<boolean>;

    abstract blockDates(propertyId: string, input: CreateBlockedDateInput): BlockedDate | Promise<BlockedDate>;

    abstract setPriceRule(propertyId: string, input: CreatePriceRuleInput): PriceRule | Promise<PriceRule>;

    abstract createLocation(input: CreateLocationInput): Location | Promise<Location>;

    abstract removeLocation(id: string): boolean | Promise<boolean>;

    abstract createNearbyPlace(input: CreateNearbyPlaceInput): NearbyPlace | Promise<NearbyPlace>;

    abstract removeNearbyPlace(id: string): boolean | Promise<boolean>;

    abstract createAmenity(input: CreateAmenityInput): Amenity | Promise<Amenity>;

    abstract removeAmenity(id: string): boolean | Promise<boolean>;

    abstract updateAmenity(id: string, input: UpdateAmenityInput): Amenity | Promise<Amenity>;

    abstract addAmenityToProperty(propertyId: string, amenityId: string): Property | Promise<Property>;

    abstract removeAmenityFromProperty(propertyId: string, amenityId: string): Property | Promise<Property>;

    abstract createImage(input: CreateImageInput): Image | Promise<Image>;

    abstract removeImage(id: string): boolean | Promise<boolean>;

    abstract addReview(propertyId: string, input: CreateReviewInput): Review | Promise<Review>;

    abstract createBooking(propertyId: string, input: CreateBookingInput): BookingResponse | Promise<BookingResponse>;

    abstract createOrganization(input: CreateOrganizationInput): Organization | Promise<Organization>;

    abstract updateOrganization(id: string, input: UpdateOrganizationInput): Organization | Promise<Organization>;

    abstract addOrganizationMember(organizationId: string, userId: string, role: OrganizationRole): OrganizationMember | Promise<OrganizationMember>;

    abstract removeOrganizationMember(organizationId: string, userId: string): boolean | Promise<boolean>;

    abstract updateOrganizationMemberRole(organizationId: string, userId: string, role: OrganizationRole): OrganizationMember | Promise<OrganizationMember>;

    abstract createMaintenanceRequest(input: CreateMaintenanceRequestInput): MaintenanceRequest | Promise<MaintenanceRequest>;

    abstract updateMaintenanceRequest(id: string, input: UpdateMaintenanceRequestInput): MaintenanceRequest | Promise<MaintenanceRequest>;

    abstract addMaintenanceComment(input: CreateMaintenanceCommentInput): MaintenanceComment | Promise<MaintenanceComment>;

    abstract addMaintenanceImage(input: CreateMaintenanceImageInput): MaintenanceImage | Promise<MaintenanceImage>;

    abstract markNotificationAsRead(id: string): Notification | Promise<Notification>;

    abstract markAllNotificationsAsRead(userId: string): boolean | Promise<boolean>;
}

export abstract class IQuery {
    __typename?: 'IQuery';

    abstract propertyById(id: string): Nullable<Property> | Promise<Nullable<Property>>;

    abstract properties(filter?: Nullable<PropertyFilter>, pagination?: Nullable<PaginationInput>): Nullable<PropertyConnection> | Promise<Nullable<PropertyConnection>>;

    abstract propertyAmenities(propertyId: string): Amenity[] | Promise<Amenity[]>;

    abstract propertyImages(propertyId: string): ImageConnection | Promise<ImageConnection>;

    abstract propertyLocation(propertyId: string): Nullable<Location> | Promise<Nullable<Location>>;

    abstract propertyReviews(propertyId: string, pagination?: Nullable<PaginationInput>): Nullable<ReviewConnection> | Promise<Nullable<ReviewConnection>>;

    abstract booking(id: string): Nullable<Booking> | Promise<Nullable<Booking>>;

    abstract bookings(pagination?: Nullable<PaginationInput>): BookingConnection | Promise<BookingConnection>;

    abstract organization(id: string): Organization | Promise<Organization>;

    abstract organizations(filter?: Nullable<OrganizationFilter>, pagination?: Nullable<PaginationInput>): OrganizationConnection | Promise<OrganizationConnection>;

    abstract myOrganizations(): Organization[] | Promise<Organization[]>;

    abstract image(id: string): Nullable<Image> | Promise<Nullable<Image>>;

    abstract images(pagination?: Nullable<PaginationInput>): ImageConnection | Promise<ImageConnection>;

    abstract amenity(id: string): Nullable<Amenity> | Promise<Nullable<Amenity>>;

    abstract amenities(pagination?: Nullable<PaginationInput>): AmenityConnection | Promise<AmenityConnection>;

    abstract user(id: string): Nullable<User> | Promise<Nullable<User>>;

    abstract users(pagination?: Nullable<PaginationInput>): UserConnection | Promise<UserConnection>;

    abstract maintenanceRequest(id: string): Nullable<MaintenanceRequest> | Promise<Nullable<MaintenanceRequest>>;

    abstract maintenanceRequests(propertyId?: Nullable<string>, status?: Nullable<MaintenanceRequestStatus>, pagination?: Nullable<PaginationInput>): MaintenanceRequestConnection | Promise<MaintenanceRequestConnection>;

    abstract search(term: string, pagination?: Nullable<PaginationInput>, filters?: Nullable<SearchFilter>): SearchResultConnection | Promise<SearchResultConnection>;

    abstract notification(id: string): Nullable<Notification> | Promise<Nullable<Notification>>;

    abstract notifications(userId: string, filter?: Nullable<NotificationFilter>, pagination?: Nullable<PaginationInput>): NotificationConnection | Promise<NotificationConnection>;
}

export class Bed {
    __typename?: 'Bed';
    id: string;
    propertyId: string;
    bedType: BedType;
    bedSize: BedSize;
    room: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class Property {
    __typename?: 'Property';
    id: string;
    name: string;
    description?: Nullable<string>;
    propertyType: PropertyType;
    basePrice: number;
    maxOccupancy: number;
    numStories: number;
    numBathrooms: number;
    numBedrooms: number;
    garageSpaces: number;
    yearBuilt?: Nullable<number>;
    areaInSquareMeters: number;
    lotSizeInSquareMeters: number;
    beds: Bed[];
    organization: Organization;
    location: Location;
    amenities: Amenity[];
    images?: Nullable<ImageConnection>;
    reviews?: Nullable<ReviewConnection>;
    blockedDates: BlockedDate[];
    priceRules: PriceRule[];
    maintenanceRequests?: MaintenanceRequestConnection;
    nearbyPlaces?: NearbyPlaceConnection;
    createdAt: DateTime;
    updatedAt: DateTime;
    isAvailable?: boolean;
    priceForDates?: number;
}

export class PropertyConnection {
    __typename?: 'PropertyConnection';
    edges: PropertyEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class PropertyEdge {
    __typename?: 'PropertyEdge';
    cursor: string;
    node: Property;
}

export class MaintenanceRequest {
    __typename?: 'MaintenanceRequest';
    id: string;
    property: Property;
    user: User;
    urgency: MaintenanceRequestUrgency;
    description: string;
    status: MaintenanceRequestStatus;
    comments: MaintenanceCommentConnection;
    photos: MaintenanceImageConnection;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class MaintenanceRequestConnection {
    __typename?: 'MaintenanceRequestConnection';
    edges: MaintenanceRequestEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class MaintenanceRequestEdge {
    __typename?: 'MaintenanceRequestEdge';
    cursor: string;
    node: MaintenanceRequest;
}

export class MaintenanceComment {
    __typename?: 'MaintenanceComment';
    id: string;
    maintenanceRequest: MaintenanceRequest;
    user: User;
    comment: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class MaintenanceCommentConnection {
    __typename?: 'MaintenanceCommentConnection';
    edges: MaintenanceCommentEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class MaintenanceCommentEdge {
    __typename?: 'MaintenanceCommentEdge';
    cursor: string;
    node: MaintenanceComment;
}

export class MaintenanceImage {
    __typename?: 'MaintenanceImage';
    id: string;
    maintenanceRequest: MaintenanceRequest;
    url: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class MaintenanceImageConnection {
    __typename?: 'MaintenanceImageConnection';
    edges: MaintenanceImageEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class MaintenanceImageEdge {
    __typename?: 'MaintenanceImageEdge';
    cursor: string;
    node: MaintenanceImage;
}

export class Price {
    __typename?: 'Price';
    id: string;
    propertyId: string;
    amount: Money;
    currency: string;
}

export class Amenity {
    __typename?: 'Amenity';
    id: string;
    name: string;
    category?: Nullable<string>;
    icon?: Nullable<string>;
    iconUrl?: Nullable<string>;
    properties: Property[];
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class AmenityConnection {
    __typename?: 'AmenityConnection';
    edges: AmenityEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class AmenityEdge {
    __typename?: 'AmenityEdge';
    cursor: string;
    node: Amenity;
}

export class Image {
    __typename?: 'Image';
    id: string;
    url: string;
    caption?: Nullable<string>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class ImageConnection {
    __typename?: 'ImageConnection';
    edges: ImageEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class ImageEdge {
    __typename?: 'ImageEdge';
    cursor: string;
    node: Image;
}

export class Location {
    __typename?: 'Location';
    id: string;
    address?: Nullable<string>;
    postalCode?: Nullable<string>;
    postalCodeSuffix?: Nullable<string>;
    city?: Nullable<string>;
    county?: Nullable<string>;
    state?: Nullable<string>;
    country?: Nullable<string>;
    coordinates: Coordinates;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class Coordinates {
    __typename?: 'Coordinates';
    latitude: number;
    longitude: number;
}

export class NearbyPlace {
    __typename?: 'NearbyPlace';
    id: string;
    name: string;
    type: string;
    distance: number;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class NearbyPlaceConnection {
    __typename?: 'NearbyPlaceConnection';
    edges: Nullable<NearbyPlaceEdge>[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class NearbyPlaceEdge {
    __typename?: 'NearbyPlaceEdge';
    cursor: string;
    node: NearbyPlace;
}

export class Review {
    __typename?: 'Review';
    id: string;
    rating: number;
    text?: Nullable<string>;
    user: User;
    property: Property;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class ReviewConnection {
    __typename?: 'ReviewConnection';
    edges: Nullable<ReviewEdge>[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class ReviewEdge {
    __typename?: 'ReviewEdge';
    cursor: string;
    node: Review;
}

export class Notification {
    __typename?: 'Notification';
    id: string;
    title: string;
    description: string;
    type: NotificationType;
    link: string;
    linkText: string;
    isRead: boolean;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class NotificationConnection {
    __typename?: 'NotificationConnection';
    edges: NotificationEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class NotificationEdge {
    __typename?: 'NotificationEdge';
    cursor: string;
    node: Notification;
}

export class User {
    __typename?: 'User';
    id: string;
    name: string;
    email: string;
    avatar?: Nullable<string>;
    bookings?: BookingConnection;
    maintenanceRequests?: MaintenanceRequestConnection;
    organization?: Nullable<Organization>;
    notifications?: NotificationConnection;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class UserEdge {
    __typename?: 'UserEdge';
    cursor: string;
    node: User;
}

export class UserConnection {
    __typename?: 'UserConnection';
    edges: UserEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class Booking {
    __typename?: 'Booking';
    id: string;
    confirmationCode: string;
    property: Property;
    user: User;
    startDate: DateTime;
    endDate: DateTime;
    numberOfGuests: number;
    totalPrice: Money;
    status: BookingStatus;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export class BookingConnection {
    __typename?: 'BookingConnection';
    edges: Nullable<BookingEdge>[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class BookingEdge {
    __typename?: 'BookingEdge';
    node: Booking;
    cursor: string;
}

export class PageInfo {
    __typename?: 'PageInfo';
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: Nullable<string>;
    endCursor?: Nullable<string>;
}

export class BookingResponse {
    __typename?: 'BookingResponse';
    success: boolean;
    message?: Nullable<string>;
    bookingId?: Nullable<string>;
    confirmationCode?: Nullable<string>;
}

export class BlockedDate {
    __typename?: 'BlockedDate';
    id: string;
    propertyId: string;
    startDate: DateTime;
    endDate: DateTime;
    reason?: Nullable<string>;
}

export class PriceRule {
    __typename?: 'PriceRule';
    id: string;
    propertyId: string;
    startDate: DateTime;
    endDate: DateTime;
    price: number;
    description?: Nullable<string>;
}

export class Organization {
    __typename?: 'Organization';
    id: string;
    name: string;
    organizationType: OrganizationType;
    primaryUser?: Nullable<OrganizationMember>;
    members: OrganizationMember[];
    properties: PropertyConnection;
    createdAt: DateTime;
}

export class OrganizationConnection {
    __typename?: 'OrganizationConnection';
    edges: OrganizationEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class OrganizationEdge {
    __typename?: 'OrganizationEdge';
    cursor: string;
    node: Organization;
}

export class OrganizationMember {
    __typename?: 'OrganizationMember';
    id: string;
    organization: Organization;
    user: User;
    role: OrganizationRole;
    createdAt: DateTime;
}

export class OrganizationMemberConnection {
    __typename?: 'OrganizationMemberConnection';
    edges: Nullable<OrganizationMemberEdge>[];
    pageInfo: PageInfo;
    totalCount: number;
}

export class OrganizationMemberEdge {
    __typename?: 'OrganizationMemberEdge';
    cursor: string;
    node: OrganizationMember;
}

export class SearchResult {
    __typename?: 'SearchResult';
    property: Property;
    similarity: number;
    highlights?: Nullable<string[]>;
}

export class SearchResultEdge {
    __typename?: 'SearchResultEdge';
    cursor: string;
    node: SearchResult;
}

export class SearchResultConnection {
    __typename?: 'SearchResultConnection';
    edges: SearchResultEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export type DateTime = any;
export type Money = any;
export type PropertyResult = Property | Error;
type Nullable<T> = T | null;
