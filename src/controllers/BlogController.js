const Blog = require('../models/Blog');
const pool = require('../config/database');

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [blogs] = await connection.query('SELECT * FROM blogs_biomed ORDER BY created_at DESC');
    await connection.release();
    
    const blogData = blogs.map(blog => new Blog(blog));
    
    res.status(200).json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: blogData,
      count: blogData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve blogs'
    });
  }
};

// Get blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const [result] = await connection.query('SELECT * FROM blogs_biomed WHERE id = ?', [id]);
    await connection.release();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Blog not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Blog retrieved successfully',
      data: new Blog(result[0]),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve blog'
    });
  }
};

// Get blog by slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { slug } = req.params;
    const [result] = await connection.query('SELECT * FROM blogs_biomed WHERE slug = ?', [slug]);
    await connection.release();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Blog not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Blog retrieved successfully',
      data: new Blog(result[0]),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve blog'
    });
  }
};

// Get blogs with filters and pagination
exports.getFilteredBlogs = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { 
      page = 1, 
      limit = 10, 
      category_id, 
      author_id,
      status,
      visibility,
      is_popular,
      show_on_homepage,
      search
    } = req.query;

    let query = 'SELECT * FROM blogs_biomed WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as count FROM blogs_biomed WHERE 1=1';
    let values = [];

    // Build dynamic WHERE clause
    if (category_id) {
      query += ' AND category_id = ?';
      countQuery += ' AND category_id = ?';
      values.push(parseInt(category_id));
    }
    if (author_id) {
      query += ' AND author_id = ?';
      countQuery += ' AND author_id = ?';
      values.push(parseInt(author_id));
    }
    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      values.push(status);
    }
    if (visibility) {
      query += ' AND visibility = ?';
      countQuery += ' AND visibility = ?';
      values.push(visibility);
    }
    if (is_popular !== undefined) {
      query += ' AND is_popular = ?';
      countQuery += ' AND is_popular = ?';
      values.push(parseInt(is_popular));
    }
    if (show_on_homepage !== undefined) {
      query += ' AND show_on_homepage = ?';
      countQuery += ' AND show_on_homepage = ?';
      values.push(parseInt(show_on_homepage));
    }
    if (search) {
      query += ' AND (title LIKE ? OR short_description LIKE ?)';
      countQuery += ' AND (title LIKE ? OR short_description LIKE ?)';
      values.push(`%${search}%`);
      values.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    values.push(parseInt(limit), offset);

    const [blogs] = await connection.query(query, values);
    
    // Get total count - rebuild count query values
    let countValues = [];
    if (category_id) countValues.push(parseInt(category_id));
    if (author_id) countValues.push(parseInt(author_id));
    if (status) countValues.push(status);
    if (visibility) countValues.push(visibility);
    if (is_popular !== undefined) countValues.push(parseInt(is_popular));
    if (show_on_homepage !== undefined) countValues.push(parseInt(show_on_homepage));
    if (search) {
      countValues.push(`%${search}%`);
      countValues.push(`%${search}%`);
    }

    const [countResult] = await connection.query(countQuery, countValues);
    const totalCount = countResult[0].count;

    await connection.release();

    const blogData = blogs.map(blog => new Blog(blog));

    res.status(200).json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: blogData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching filtered blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve blogs'
    });
  }
};

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const {
      title,
      slug,
      category_id,
      author_id,
      author_name,
      author_email,
      keywords,
      content,
      thumbnail_url,
      banner_url,
      is_popular = false,
      status = 'draft',
      short_description,
      reading_time,
      image_alt_text,
      image_caption,
      publish_date,
      visibility = 'private',
      seo_title,
      seo_description,
      focus_keyword,
      canonical_url,
      meta_robots,
      allow_comments = true,
      show_on_homepage = false,
      is_sticky = false
    } = req.body;

    // Validate required fields
    if (!title || !content || !category_id || !author_id || !slug) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Title, content, category_id, author_id, and slug are required'
      });
    }

    const query = `
      INSERT INTO blogs_biomed (
        title, slug, category_id, author_id, author_name, author_email, keywords, content, thumbnail_url,
        banner_url, is_popular, status, short_description, reading_time,
        image_alt_text, image_caption, publish_date, visibility, seo_title,
        seo_description, focus_keyword, canonical_url, meta_robots,
        allow_comments, show_on_homepage, is_sticky
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      title, slug, category_id, author_id, author_name, author_email, keywords, content, thumbnail_url,
      banner_url, is_popular, status, short_description, reading_time,
      image_alt_text, image_caption, publish_date, visibility, seo_title,
      seo_description, focus_keyword, canonical_url, meta_robots,
      allow_comments, show_on_homepage, is_sticky
    ];

    const [result] = await connection.query(query, values);

    // Fetch created blog
    const [createdBlog] = await connection.query('SELECT * FROM blogs_biomed WHERE id = ?', [result.insertId]);
    await connection.release();

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: new Blog(createdBlog[0]),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create blog'
    });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const updates = req.body;

    // Check if blog exists
    const [existingBlog] = await connection.query('SELECT * FROM blogs_biomed WHERE id = ?', [id]);
    if (existingBlog.length === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Blog not found'
      });
    }

    // Build dynamic UPDATE query
    const allowedFields = [
      'title', 'slug', 'category_id', 'author_id', 'author_name', 'author_email', 'keywords', 'content',
      'thumbnail_url', 'banner_url', 'is_popular', 'status', 'short_description',
      'reading_time', 'image_alt_text', 'image_caption', 'publish_date',
      'visibility', 'seo_title', 'seo_description', 'focus_keyword',
      'canonical_url', 'meta_robots', 'allow_comments', 'show_on_homepage',
      'is_sticky'
    ];

    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (field in updates) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No valid fields to update'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const query = `UPDATE blogs_biomed SET ${updateFields.join(', ')} WHERE id = ?`;

    await connection.query(query, updateValues);

    // Fetch updated blog
    const [updatedBlog] = await connection.query('SELECT * FROM blogs_biomed WHERE id = ?', [id]);
    await connection.release();

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: new Blog(updatedBlog[0]),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update blog'
    });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;

    // Check if blog exists
    const [existingBlog] = await connection.query('SELECT * FROM blogs_biomed WHERE id = ?', [id]);
    if (existingBlog.length === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Blog not found'
      });
    }

    await connection.query('DELETE FROM blogs_biomed WHERE id = ?', [id]);
    await connection.release();

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete blog'
    });
  }
};
