import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use absolute path to public directory
        const uploadPath = path.join(__dirname, '..', '..', 'public');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExtension);
        cb(null, `${baseName}-${uniqueSuffix}${fileExtension}`);
    }
});

// File filter for audio files only
const fileFilter = (req, file, cb) => {
    // Allowed audio MIME types
    const allowedTypes = [
        'audio/mpeg',
        'audio/mp3', 
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/m4a',
        'audio/aac',
        'audio/flac'
    ];

    // Also check file extension
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac', '.flac'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
        files: 1 // Only one file at a time
    },
    fileFilter: fileFilter
});