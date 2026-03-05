import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getFirebaseStorageBucket } from '../config/firebaseAdmin';

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
]);

// Configure multer storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        // Generate a unique filename: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Create the upload middleware (limit 10MB)
export const uploadMiddleware = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())) {
            cb(new Error('Unsupported file type'));
            return;
        }
        cb(null, true);
    },
});

/* ─────── UPLOAD MEDIA ─────── */
/**
 * POST /api/admin/media/upload
 * Expects form-data with a 'file' field.
 */
export async function uploadMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded.' });
            return;
        }

        if (!ALLOWED_MIME_TYPES.has(String(req.file.mimetype || '').toLowerCase())) {
            res.status(400).json({ message: 'Unsupported file type.' });
            return;
        }

        const firebaseBucket = getFirebaseStorageBucket();
        if (firebaseBucket) {
            const ext = path.extname(req.file.originalname || '').toLowerCase() || path.extname(req.file.filename || '');
            const safeExt = ext && ext.length <= 10 ? ext : '';
            const objectKey = `media/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
            const fileRef = firebaseBucket.file(objectKey);
            await fileRef.save(fs.readFileSync(req.file.path), {
                metadata: {
                    contentType: req.file.mimetype,
                },
                resumable: false,
                public: true,
            });

            const publicUrl = `https://storage.googleapis.com/${firebaseBucket.name}/${objectKey}`;
            fs.unlink(req.file.path, () => { /* ignore */ });
            res.status(201).json({
                message: 'File uploaded successfully.',
                url: publicUrl,
                filename: objectKey,
                mimetype: req.file.mimetype,
                size: req.file.size,
                provider: 'firebase',
            });
            return;
        }

        // Construct the public URL for the uploaded file
        // For development, it will be served from the local Node server e.g. /uploads/filename.ext
        const fileUrl = `/uploads/${req.file.filename}`;

        res.status(201).json({
            message: 'File uploaded successfully.',
            url: fileUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (err) {
        console.error('[uploadMedia]', err);
        res.status(500).json({ message: 'Server error during file upload.' });
    }
}
