const express = require('express');
const router = express.Router();
const blogController = require('../controllers/BlogController');

// Get all blogs
router.get('/', blogController.getAllBlogs);

// Get blogs with filters and pagination
router.get('/filtered', blogController.getFilteredBlogs);

// Get blog by ID
router.get('/:id', blogController.getBlogById);

// Get blog by slug
router.get('/slug/:slug', blogController.getBlogBySlug);

// Create a new blog
router.post('/create', blogController.createBlog);

// Update blog
router.put('/:id', blogController.updateBlog);

// Delete blog
router.delete('/:id', blogController.deleteBlog);

module.exports = router;
