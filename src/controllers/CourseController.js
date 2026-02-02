const Course = require('../models/Course');
const pool = require('../config/database');

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [courses] = await connection.query('SELECT * FROM course ORDER BY id DESC');
    await connection.release();
    
    const courseData = courses.map(course => new Course(course));
    
    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: courseData,
      count: courseData.length,
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
    const connection = await pool.getConnection();
    const { id } = req.params;
    const [result] = await connection.query('SELECT * FROM course WHERE id = ?', [id]);
    await connection.release();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Course not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Course retrieved successfully',
      data: new Course(result[0]),
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
    const connection = await pool.getConnection();
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
    let countQuery = 'SELECT COUNT(*) as count FROM course WHERE 1=1';
    let values = [];

    // Build dynamic WHERE clause
    if (category_id) {
      query += ' AND category_id = ?';
      countQuery += ' AND category_id = ?';
      values.push(parseInt(category_id));
    }
    if (level) {
      query += ' AND level = ?';
      countQuery += ' AND level = ?';
      values.push(level);
    }
    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      values.push(status);
    }
    if (is_free_course !== undefined) {
      query += ' AND is_free_course = ?';
      countQuery += ' AND is_free_course = ?';
      values.push(parseInt(is_free_course));
    }
    if (is_top_course !== undefined) {
      query += ' AND is_top_course = ?';
      countQuery += ' AND is_top_course = ?';
      values.push(parseInt(is_top_course));
    }

    // Get total count
    let countValues = [];
    if (category_id) countValues.push(parseInt(category_id));
    if (level) countValues.push(level);
    if (status) countValues.push(status);
    if (is_free_course !== undefined) countValues.push(parseInt(is_free_course));
    if (is_top_course !== undefined) countValues.push(parseInt(is_top_course));

    const [countResult] = await connection.query(countQuery, countValues);
    const totalRecords = countResult[0].count;

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    values.push(limitNum, offset);

    const [courses] = await connection.query(query, values);
    await connection.release();

    const courseData = courses.map(course => new Course(course));

    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: courseData,
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

// Get courses by category ID
exports.getCoursesByCategory = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { category_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!category_id) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Category ID is required'
      });
    }

    // Get total count
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM course WHERE category_id = ?',
      [parseInt(category_id)]
    );
    const totalRecords = countResult[0].count;

    // Get paginated results
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const [courses] = await connection.query(
      'SELECT * FROM course WHERE category_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
      [parseInt(category_id), limitNum, offset]
    );

    await connection.release();

    const courseData = courses.map(course => new Course(course));

    res.status(200).json({
      success: true,
      message: `Courses retrieved successfully for category ${category_id}`,
      data: courseData,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        pageSize: limitNum,
        totalRecords: totalRecords,
        categoryId: parseInt(category_id)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching courses by category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve courses by category'
    });
  }
};
