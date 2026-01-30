const express = require('express');
const router = express.Router();
const courseController = require('../controllers/CourseController');

// Get all courses
router.get('/', courseController.getAllCourses);

// Get courses with filters and pagination
router.get('/filtered', courseController.getFilteredCourses);

// Get course by ID
router.get('/:id', courseController.getCourseById);

module.exports = router;
