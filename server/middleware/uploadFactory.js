const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

function getFileExtension(filename) {
    return path.extname(filename).toLowerCase().replace('.', '');
}

function getFileKind(file) {
    const extension = getFileExtension(file.originalname);

    if (file.mimetype.startsWith('image/')) {
        return 'image';
    }

    if (file.mimetype.startsWith('video/')) {
        return 'video';
    }

    if (file.mimetype === 'application/octet-stream') {
        if (IMAGE_EXTENSIONS.includes(extension)) {
            return 'image';
        }

        if (VIDEO_EXTENSIONS.includes(extension)) {
            return 'video';
        }
    }

    return null;
}

function uploadFactory({
    baseFolder,
    fieldName = 'media',
    maxCount = 10,
    maxFileSize = 100 * 1024 * 1024,
    imageWidth = 1280,
    imageQuality = 85
}) {
    if (!baseFolder) {
        throw new Error('baseFolder is required for uploadFactory');
    }

    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
        if (getFileKind(file)) {
            cb(null, true);
            return;
        }

        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    };

    const upload = multer({
        storage,
        fileFilter,
        limits: { fileSize: maxFileSize }
    });

    const processMedia = async (req, res, next) => {
        if (req.file && !req.files) {
            req.files = [req.file];
        }

        if (!req.files || req.files.length === 0) {
            next();
            return;
        }

        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const dir = path.join(__dirname, `../uploads/${baseFolder}/${year}/${month}`);

            await fs.promises.mkdir(dir, { recursive: true });

            await Promise.all(req.files.map(async (file) => {
                const fileKind = getFileKind(file);
                const savedPathPrefix = `uploads/${baseFolder}/${year}/${month}`;

                if (fileKind === 'video') {
                    const ext = path.extname(file.originalname) || '.mp4';
                    const filename = `${uuidv4()}${ext}`;
                    const filepath = path.join(dir, filename);

                    await fs.promises.writeFile(filepath, file.buffer);

                    file.filename = filename;
                    file.savedPath = `${savedPathPrefix}/${filename}`;
                    return;
                }

                if (fileKind === 'image') {
                    const filename = `${uuidv4()}.webp`;
                    const filepath = path.join(dir, filename);

                    await sharp(file.buffer)
                        .rotate()
                        .resize({ width: imageWidth, withoutEnlargement: true })
                        .webp({ quality: imageQuality })
                        .toFile(filepath);

                    file.filename = filename;
                    file.savedPath = `${savedPathPrefix}/${filename}`;
                    return;
                }

                throw new Error(`Unsupported file type: ${file.mimetype}`);
            }));

            next();
        } catch (error) {
            next(error);
        }
    };

    const uploadMiddleware = maxCount === 1
        ? upload.single(fieldName)
        : upload.array(fieldName, maxCount);

    return [uploadMiddleware, processMedia];
}

module.exports = uploadFactory;
