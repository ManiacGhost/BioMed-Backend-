const Course = require('../models/Course');
const pool = require('../config/database');

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM course ORDER BY id DESC');
    const courses = result.rows.map(course => new Course(course));
    
    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: courses,
      count: courses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve courses'
    });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM course WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Course not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Course retrieved successfully',
      data: new Course(result.rows[0]),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve course'
    });
  }
};

// Get courses with filters and pagination
exports.getFilteredCourses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category_id, 
      level, 
      status,
      is_free_course,
      is_top_course 
    } = req.query;

    let query = 'SELECT * FROM course WHERE 1=1';
    let values = [];
    let valueIndex = 1;

    // Build dynamic WHERE clause
    if (category_id) {
      query += ` AND category_id = $${valueIndex}`;
      values.push(parseInt(category_id));
      valueIndex++;
    }
    if (level) {
      query += ` AND level = $${valueIndex}`;
      values.push(level);
      valueIndex++;
    }
    if (status) {
      query += ` AND status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }
    if (is_free_course !== undefined) {
      query += ` AND is_free_course = $${valueIndex}`;
      values.push(parseInt(is_free_course));
      valueIndex++;
    }
    if (is_top_course !== undefined) {
      query += ` AND is_top_course = $${valueIndex}`;
      values.push(parseInt(is_top_course));
      valueIndex++;
    }

    // Get total count
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*) as count'),
      values
    );
    const totalRecords = parseInt(countResult.rows[0].count);

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    query += ` ORDER BY id DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limitNum, offset);

    const result = await pool.query(query, values);
    const courses = result.rows.map(course => new Course(course));

    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: courses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        pageSize: limitNum,
        totalRecords: totalRecords
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching filtered courses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve courses'
    });
  }
};
