import mongoose, { Schema, Document } from 'mongoose';

interface IExamCenter {
    city: string;
    address: string;
}

interface IUnit {
    name: string;
    seats: number;
    examDates: Date[];
    applicationStart: Date;
    applicationEnd: Date;
    examCenters: IExamCenter[];
    notes?: string;
}

export interface IUniversity extends Document {
    name: string;
    shortForm: string;
    category: string;
    categoryId?: mongoose.Types.ObjectId | null;
    established: number;
    address: string;
    contactNumber: string;
    email: string;
    website: string;
    admissionWebsite: string;
    totalSeats: string;
    scienceSeats: string;
    artsSeats: string;
    businessSeats: string;
    shortDescription: string;
    description?: string;
    logoUrl?: string;
    clusterId?: mongoose.Types.ObjectId | null;
    clusterName?: string;
    clusterCount?: number;
    clusterDateOverrides?: {
        applicationStartDate?: Date | null;
        applicationEndDate?: Date | null;
        scienceExamDate?: string;
        artsExamDate?: string;
        businessExamDate?: string;
    };
    clusterSyncLocked?: boolean;
    // Top-level application & exam dates
    applicationStartDate?: Date;
    applicationEndDate?: Date;
    scienceExamDate?: string;
    artsExamDate?: string;
    businessExamDate?: string;
    units: IUnit[];
    examCenters: IExamCenter[];
    socialLinks: { platform: string; url: string; icon?: string }[];
    unitLayout: 'compact' | 'stacked' | 'carousel';
    isActive: boolean;
    featured?: boolean;
    featuredOrder?: number;
    verificationStatus?: string;
    remarks?: string;
    isArchived?: boolean;
    archivedAt?: Date | null;
    archivedBy?: mongoose.Types.ObjectId | null;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExamCenterSchema = new Schema<IExamCenter>({
    city: { type: String, required: true },
    address: { type: String, required: true },
}, { _id: false });

const UnitSchema = new Schema<IUnit>({
    name: { type: String, required: true },
    seats: { type: Number, default: 0 },
    examDates: [Date],
    applicationStart: Date,
    applicationEnd: Date,
    examCenters: [ExamCenterSchema],
    notes: String,
}, { _id: true });

const ClusterDateOverridesSchema = new Schema({
    applicationStartDate: { type: Date, default: null },
    applicationEndDate: { type: Date, default: null },
    scienceExamDate: { type: String, default: '' },
    artsExamDate: { type: String, default: '' },
    businessExamDate: { type: String, default: '' },
}, { _id: false });

const UniversitySchema = new Schema<IUniversity>({
    name: { type: String, required: true, trim: true },
    shortForm: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'UniversityCategory', default: null },
    established: { type: Number },
    address: { type: String },
    contactNumber: { type: String },
    email: { type: String },
    website: { type: String },
    admissionWebsite: { type: String },
    totalSeats: { type: String, default: 'N/A' },
    scienceSeats: { type: String, default: 'N/A' },
    artsSeats: { type: String, default: 'N/A' },
    businessSeats: { type: String, default: 'N/A' },
    shortDescription: { type: String },
    description: { type: String, default: '' },
    logoUrl: String,
    clusterId: { type: Schema.Types.ObjectId, ref: 'UniversityCluster', default: null },
    clusterName: String,
    clusterCount: Number,
    clusterDateOverrides: { type: ClusterDateOverridesSchema, default: () => ({}) },
    clusterSyncLocked: { type: Boolean, default: false },
    applicationStartDate: Date,
    applicationEndDate: Date,
    scienceExamDate: { type: String, default: 'N/A' },
    artsExamDate: { type: String, default: 'N/A' },
    businessExamDate: { type: String, default: 'N/A' },
    units: [UnitSchema],
    examCenters: [ExamCenterSchema],
    socialLinks: [{ platform: String, url: String, icon: String }],
    unitLayout: { type: String, enum: ['compact', 'stacked', 'carousel'], default: 'compact' },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0 },
    verificationStatus: { type: String, default: 'Pending' },
    remarks: { type: String, default: '' },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    slug: { type: String, required: true, unique: true },
}, { timestamps: true });

UniversitySchema.index({ category: 1 });
UniversitySchema.index({ categoryId: 1, isActive: 1, isArchived: 1 });
UniversitySchema.index({ category: 1, isActive: 1, isArchived: 1 });
UniversitySchema.index({ clusterId: 1 });
UniversitySchema.index({ name: 'text', shortForm: 'text' });

export default mongoose.model<IUniversity>('University', UniversitySchema);
