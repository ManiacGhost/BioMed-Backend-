const Blog = require('../models/Blog');
const pool = require('../config/database');

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blogs_cw ORDER BY created_at DESC');
    const blogs = result.rows.map(blog => new Blog(blog));
    
    res.status(200).json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: blogs,
      count: blogs.length,
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
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM blogs_cw WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Blog not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Blog retrieved successfully',
      data: new Blog(result.rows[0]),
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
    const { slug } = req.params;
    const result = await pool.query('SELECT * FROM blogs_cw WHERE slug = $1', [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Blog not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Blog retrieved successfully',
      data: new Blog(result.rows[0]),
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

    let query = 'SELECT * FROM blogs_cw WHERE 1=1';
    let values = [];
    let valueIndex = 1;

    // Build dynamic WHERE clause
    if (category_id) {
      query += ` AND category_id = $${valueIndex}`;
      values.push(parseInt(category_id));
      valueIndex++;
    }
    if (author_id) {
      query += ` AND author_id = $${valueIndex}`;
      values.push(parseInt(author_id));
      valueIndex++;
    }
    if (status) {
      query += ` AND status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }
    if (visibility) {
      query += ` AND visibility = $${valueIndex}`;
      values.push(visibility);
      valueIndex++;
    }
    if (is_popular !== undefined) {
      query += ` AND is_popular = $${valueIndex}`;
      values.push(parseInt(is_popular));
      valueIndex++;
    }
    if (show_on_homepage !== undefined) {
      query += ` AND show_on_homepage = $${valueIndex}`;
      values.push(parseInt(show_on_homepage));
      valueIndex++;
    }
    if (search) {
      query += ` AND (title ILIKE $${valueIndex} OR short_description ILIKE $${valueIndex})`;
      values.push(`%${search}%`);
      values.push(`%${search}%`);
      valueIndex += 2;
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(parseInt(limit), offset);

    const result = await pool.query(query, values);
    const blogs = result.rows.map(blog => new Blog(blog));

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM blogs_cw WHERE 1=1';
    let countValues = [];
    let countIndex = 1;

    if (category_id) {
      countQuery += ` AND category_id = $${countIndex}`;
      countValues.push(parseInt(category_id));
      countIndex++;
    }
    if (author_id) {
      countQuery += ` AND author_id = $${countIndex}`;
      countValues.push(parseInt(author_id));
      countIndex++;
    }
    if (status) {
      countQuery += ` AND status = $${countIndex}`;
      countValues.push(status);
      countIndex++;
    }
    if (visibility) {
      countQuery += ` AND visibility = $${countIndex}`;
      countValues.push(visibility);
      countIndex++;
    }
    if (is_popular !== undefined) {
      countQuery += ` AND is_popular = $${countIndex}`;
      countValues.push(parseInt(is_popular));
      countIndex++;
    }
    if (show_on_homepage !== undefined) {
      countQuery += ` AND show_on_homepage = $${countIndex}`;
      countValues.push(parseInt(show_on_homepage));
      countIndex++;
    }

    const countResult = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: blogs,
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
    const {
      title,
      slug,
      category_id,
      author_id,
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
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Title, content, category_id, author_id, and slug are required'
      });
    }

    const query = `
      INSERT INTO blogs_cw (
        title, slug, category_id, author_id, keywords, content, thumbnail_url,
        banner_url, is_popular, status, short_description, reading_time,
        image_alt_text, image_caption, publish_date, visibility, seo_title,
        seo_description, focus_keyword, canonical_url, meta_robots,
        allow_comments, show_on_homepage, is_sticky, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW()
      ) RETURNING *
    `;

    const values = [
      title, slug, category_id, author_id, keywords, content, thumbnail_url,
      banner_url, is_popular, status, short_description, reading_time,
      image_alt_text, image_caption, publish_date, visibility, seo_title,
      seo_description, focus_keyword, canonical_url, meta_robots,
      allow_comments, show_on_homepage, is_sticky
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: new Blog(result.rows[0]),
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
    const { id } = req.params;
    const updates = req.body;

    // Check if blog exists
    const existingBlog = await pool.query('SELECT * FROM blogs_cw WHERE id = $1', [id]);
    if (existingBlog.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Blog not found'
      });
    }

    // Build dynamic UPDATE query
    const allowedFields = [
      'title', 'slug', 'category_id', 'author_id', 'keywords', 'content',
      'thumbnail_url', 'banner_url', 'is_popular', 'status', 'short_description',
      'reading_time', 'image_alt_text', 'image_caption', 'publish_date',
      'visibility', 'seo_title', 'seo_description', 'focus_keyword',
      'canonical_url', 'meta_robots', 'allow_comments', 'show_on_homepage',
      'is_sticky'
    ];

    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;

    for (const field of allowedFields) {
      if (field in updates) {
        updateFields.push(`${field} = $${valueIndex}`);
        updateValues.push(updates[field]);
        valueIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No valid fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const query = `UPDATE blogs_cw SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;

    const result = await pool.query(query, updateValues);

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: new Blog(result.rows[0]),
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
    const { id } = req.params;

    // Check if blog exists
    const existingBlog = await pool.query('SELECT * FROM blogs_cw WHERE id = $1', [id]);
    if (existingBlog.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Blog not found'
      });
    }

    await pool.query('DELETE FROM blogs_cw WHERE id = $1', [id]);

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
