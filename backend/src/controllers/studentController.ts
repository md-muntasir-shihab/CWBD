import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import StudentProfile from '../models/StudentProfile';
import StudentApplication from '../models/StudentApplication';
import ProfileUpdateRequest from '../models/ProfileUpdateRequest';
import { AuthRequest } from '../middlewares/auth';
import mongoose from 'mongoose';
import { getStudentDashboardHeader } from '../services/studentDashboardService';
import { broadcastStudentDashboardEvent } from '../realtime/studentDashboardStream';

// Ensure the profile exists, if not create a default one
const ensureProfile = async (userId: string) => {
    let profile = await StudentProfile.findOne({ user_id: userId });
    if (!profile) {
        // We'll need a full_name from the user object if it was there, but it's removed now.
        // During registration we create the profile, so this is just a safety.
        profile = await StudentProfile.create({
            user_id: userId,
            full_name: 'Student',
            profile_completion_percentage: 10,
        });
    }
    return profile;
};

const normalizeDepartment = (value: unknown): 'science' | 'arts' | 'commerce' | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    if (['science', 'sci'].includes(normalized)) return 'science';
    if (['arts', 'humanities', 'humanity'].includes(normalized)) return 'arts';
    if (['commerce', 'business', 'business studies'].includes(normalized)) return 'commerce';
    return undefined;
};

// @desc    Get current student profile
// @route   GET /api/student/profile
// @access  Private (Student)
export const getStudentProfile = async (req: AuthRequest, res: ExpressResponse) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Student access only' });
        const profile = await ensureProfile(req.user._id);
        const dashboardHeader = await getStudentDashboardHeader(req.user._id);
        res.json({
            ...profile.toObject(),
            date_of_birth: profile.dob,
            phone_number: profile.phone_number || profile.phone || '',
            profile_completion: profile.profile_completion_percentage,
            address: profile.present_address || '',
            preferred_stream: profile.department || '',
            guardian_phone_verification_status: (profile as any).guardianPhoneVerificationStatus || 'unverified',
            guardian_phone_verified_at: (profile as any).guardianPhoneVerifiedAt || null,
            welcome_message: dashboardHeader.welcomeMessage,
            overall_rank: dashboardHeader.overallRank,
            profile_completion_threshold: dashboardHeader.profileCompletionThreshold,
            profile_eligible_for_exam: dashboardHeader.isProfileEligible,
        });
    } catch (err: any) {
        res.status(500).json({ message: 'Failed to get profile', error: err.message });
    }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private (Student)
export const updateStudentProfile = async (req: AuthRequest, res: ExpressResponse) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Student access only' });

        // Fields that can be updated directly without approval
        const openFields = [
            'dob', 'gender', 'present_address', 'permanent_address', 'district', 'college_address', 'college_name'
        ];

        // Fields that require admin approval if they were already set
        const restrictedFields = [
            'full_name', 'phone_number', 'phone', 'guardian_name', 'guardian_phone',
            'ssc_batch', 'hsc_batch', 'department', 'roll_number', 'registration_id', 'institution_name'
        ];

        const aliasMap: Record<string, string> = {
            date_of_birth: 'dob',
            address: 'present_address',
            // REMOVED 'preferred_stream': 'department' to fix the clobbering bug
        };

        const profile = await ensureProfile(req.user._id);
        const profileObj = profile.toObject() as Record<string, any>;

        const directUpdates: Record<string, any> = {};
        const requestedUpdates: Record<string, any> = {};

        // 1. Process Open Fields
        for (const field of openFields) {
            if (req.body[field] !== undefined) {
                directUpdates[field] = req.body[field];
            }
        }

        // 2. Process Aliases for Open Fields
        for (const [alias, target] of Object.entries(aliasMap)) {
            if (req.body[alias] !== undefined && openFields.includes(target)) {
                directUpdates[target] = req.body[alias];
            }
        }

        // 3. Process Restricted Fields
        for (const field of restrictedFields) {
            let val = req.body[field];
            if (val === undefined) {
                // Check aliases (though none currently map to restricted fields, for future safety)
                const aliasKey = Object.keys(aliasMap).find(a => aliasMap[a] === field);
                if (aliasKey && req.body[aliasKey] !== undefined) {
                    val = req.body[aliasKey];
                }
            }

            if (val !== undefined) {
                // Check if current value exists and is different
                const currentVal = profileObj[field];
                const isSet = currentVal != null && String(currentVal).trim() !== '';

                if (!isSet) {
                    // If not set yet, allow direct update
                    directUpdates[field] = val;
                } else if (String(currentVal) !== String(val)) {
                    // If already set and changing, require approval
                    requestedUpdates[field] = val;
                }
            }
        }

        // Apply direct updates
        if (Object.keys(directUpdates).length > 0) {
            for (const [key, value] of Object.entries(directUpdates)) {
                if (key === 'department') {
                    const mapped = normalizeDepartment(value);
                    if (mapped) (profile as any)[key] = mapped;
                } else if (key === 'dob' && value === '') {
                    (profile as any)[key] = undefined;
                } else if (key === 'gender') {
                    const gender = typeof value === 'string' ? value.trim().toLowerCase() : '';
                    if (['male', 'female', 'other'].includes(gender)) (profile as any)[key] = gender;
                } else {
                    (profile as any)[key] = value;
                }
            }

            // Sync phone/phone_number
            if (directUpdates.phone_number && !directUpdates.phone) (profile as any).phone = directUpdates.phone_number;
            if (directUpdates.phone && !directUpdates.phone_number) (profile as any).phone_number = directUpdates.phone;

            // Compute completion
            const REQUIRED = ['full_name', 'phone', 'guardian_name', 'guardian_phone', 'ssc_batch', 'hsc_batch', 'department', 'college_name', 'dob'];
            const OPTIONAL = ['profile_photo_url', 'college_address', 'present_address', 'district'];
            const ALL = [...REQUIRED, ...OPTIONAL];
            const updatedObj = profile.toObject() as Record<string, any>;
            const filled = ALL.filter(f => updatedObj[f] != null && String(updatedObj[f]).trim() !== '').length;
            profile.profile_completion_percentage = Math.round((filled / ALL.length) * 100);

            await profile.save();
        }

        // Handle requested updates
        let requestMsg = '';
        if (Object.keys(requestedUpdates).length > 0) {
            // Delete existing pending request if any
            await ProfileUpdateRequest.deleteMany({ student_id: req.user._id, status: 'pending' });

            await ProfileUpdateRequest.create({
                student_id: req.user._id,
                requested_changes: requestedUpdates
            });
            requestMsg = ' Some changes require admin approval and have been sent for review.';
        }

        res.json({
            message: 'Profile update processed.' + requestMsg,
            profile: {
                ...profile.toObject(),
                date_of_birth: profile.dob,
                phone_number: profile.phone_number || profile.phone || '',
                profile_completion: profile.profile_completion_percentage,
                guardian_phone_verification_status: (profile as any).guardianPhoneVerificationStatus || 'unverified',
                guardian_phone_verified_at: (profile as any).guardianPhoneVerifiedAt || null,
            },
            pendingRequest: Object.keys(requestedUpdates).length > 0
        });

        broadcastStudentDashboardEvent({ type: 'profile_updated', meta: { studentId: req.user._id } });
    } catch (err: any) {
        console.error('updateStudentProfile Error:', err);
        res.status(500).json({ message: 'Failed to update profile', error: err.message });
    }
};

// @desc    Get student applications
// @route   GET /api/student/applications
// @access  Private (Student)
export const getStudentApplications = async (req: AuthRequest, res: ExpressResponse) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Student access only' });
        const apps = await StudentApplication.find({ student_id: req.user._id })
            .populate('university_id', 'name slug logo')
            .sort({ createdAt: -1 });
        res.json(apps);
    } catch (err: any) {
        res.status(500).json({ message: 'Failed to get profile', error: err.message });
    }
};

// @desc    Submit new application
// @route   POST /api/student/applications
// @access  Private (Student)
export const createStudentApplication = async (req: AuthRequest, res: ExpressResponse) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Student access only' });

        const { university_id, program } = req.body;

        if (!university_id || !program) {
            return res.status(400).json({ message: 'University and program are required' });
        }

        // Check profile completion first
        const profile = await ensureProfile(req.user._id);
        if (profile.profile_completion_percentage < 60) {
            return res.status(400).json({ message: 'Please complete at least 60% of your profile before applying.' });
        }

        // Prevent duplicate applications for the same program in draft/submitted
        const existing = await StudentApplication.findOne({
            student_id: req.user._id,
            university_id,
            program,
            status: { $in: ['draft', 'submitted', 'under_review'] }
        });

        if (existing) {
            return res.status(400).json({ message: 'You already have an active application for this program.' });
        }

        const application = await StudentApplication.create({
            student_id: req.user._id,
            university_id,
            program,
            status: 'draft',
            applied_at: new Date()
        });

        res.status(201).json({ message: 'Application draft created successfully', application });
    } catch (err: any) {
        res.status(500).json({ message: 'Failed to create application', error: err.message });
    }
};

// @desc    Upload student document
export const uploadStudentDocument = async (req: AuthRequest, res: ExpressResponse) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Student access only' });
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const document_type = req.body.document_type || req.body.type;
        if (!document_type) return res.status(400).json({ message: 'Document type is required' });

        const profile = await ensureProfile(req.user._id);

        const docUrl = `/uploads/${req.file.filename}`;

        // Persist profile photo immediately so the student sees it without a second save action.
        if (document_type === 'profile_photo') {
            profile.profile_photo_url = docUrl;
            await profile.save();
            broadcastStudentDashboardEvent({ type: 'profile_updated', meta: { studentId: req.user._id } });
        }

        res.json({
            message: 'Document uploaded successfully',
            url: docUrl,
            document_type
        });
    } catch (err: any) {
        res.status(500).json({ message: 'Failed to upload document', error: err.message });
    }
};
