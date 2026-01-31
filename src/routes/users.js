const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const userController = require('../controllers/UserController');

// Add user
router.post('/', userController.addUser);

// Get all users with filtering and pagination
router.get('/', userController.getAllUsers);

// Get instructors
router.get('/instructors', userController.getInstructors);

// Get user by ID
router.get('/:id', userController.getUserById);

// Get user by email
router.get('/email/:email', userController.getUserByEmail);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

// Change user status
router.patch('/:id/status', userController.changeUserStatus);

// Upload profile image
router.post('/:id/profile-image', upload.single('image'), userController.uploadProfileImage);

module.exports = router;
