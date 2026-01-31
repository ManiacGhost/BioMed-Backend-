const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const imageController = require('../controllers/ImageController');

// Upload image
router.post('/upload', upload.single('image'), imageController.uploadImage);

// Get all images with pagination and filtering
router.get('/', imageController.getAllImages);

// Get image by ID
router.get('/:id', imageController.getImage);

// Get image by Cloudinary ID
router.get('/cloudinary/:cloudinaryId', imageController.getImageByCloudinaryId);

// Delete image
router.delete('/:id', imageController.deleteImage);

module.exports = router;
