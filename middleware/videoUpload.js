import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'course_videos',
        resource_type: 'video'
    }
});

const videoUpload = multer({ storage });

export default videoUpload;
