const crypto = require('crypto');
const User = require('../models/User');
const pool = require('../config/database');
const cloudinary = require('../config/cloudinary');

// Hash password
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Verify password
const verifyPassword = (password, hash) => {
  return hashPassword(password) === hash;
};

// Add user
exports.addUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      title,
      email,
      phone,
      password,
      address,
      profile_image_url,
      biography,
      linkedin_url,
      github_url,
      role = 'STUDENT',
      is_instructor = false,
      status = 'ACTIVE'
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required fields: first_name, last_name, email, phone, password'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users_biomed WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email or phone already exists'
      });
    }

    // Hash password
    const password_hash = hashPassword(password);

    // Insert user
    const query = `
      INSERT INTO users_biomed (
        first_name, last_name, title, email, phone, password_hash,
        address, profile_image_url, biography, linkedin_url, github_url,
        role, is_instructor, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, first_name, last_name, title, email, phone, address,
                profile_image_url, biography, linkedin_url, github_url,
                role, is_instructor, status, created_at, updated_at
    `;

    const values = [
      first_name, last_name, title, email, phone, password_hash,
      address, profile_image_url, biography, linkedin_url, github_url,
      role, is_instructor, status
    ];

    const result = await pool.query(query, values);
    const user = new User(result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create user'
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, is_instructor } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, first_name, last_name, title, email, phone, address, profile_image_url, biography, linkedin_url, github_url, role, is_instructor, status, created_at, updated_at FROM users_biomed WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM users_biomed WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = $' + (params.length + 1);
      countQuery += ' AND role = $' + (params.length + 1);
      params.push(role);
    }

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      countQuery += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    if (is_instructor !== undefined) {
      query += ' AND is_instructor = $' + (params.length + 1);
      countQuery += ' AND is_instructor = $' + (params.length + 1);
      params.push(is_instructor === 'true');
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    const users = usersResult.rows.map(user => new User(user));
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        current_page: parseInt(page),
        limit: parseInt(limit),
        total_count: totalCount,
        total_pages: totalPages
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve users'
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, first_name, last_name, title, email, phone, address, profile_image_url, biography, linkedin_url, github_url, role, is_instructor, status, created_at, updated_at FROM users_biomed WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const user = new User(result.rows[0]);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve user'
    });
  }
};

// Get user by email
exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      'SELECT id, first_name, last_name, title, email, phone, address, profile_image_url, biography, linkedin_url, github_url, role, is_instructor, status, created_at, updated_at FROM users_biomed WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const user = new User(result.rows[0]);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve user'
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      title,
      address,
      profile_image_url,
      biography,
      linkedin_url,
      github_url,
      role,
      is_instructor,
      status
    } = req.body;

    // Get current user
    const currentUser = await pool.query(
      'SELECT * FROM users_biomed WHERE id = $1',
      [id]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      updates.push(`first_name = $${paramCount}`);
      values.push(first_name);
      paramCount++;
    }

    if (last_name !== undefined) {
      updates.push(`last_name = $${paramCount}`);
      values.push(last_name);
      paramCount++;
    }

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      values.push(address);
      paramCount++;
    }

    if (profile_image_url !== undefined) {
      updates.push(`profile_image_url = $${paramCount}`);
      values.push(profile_image_url);
      paramCount++;
    }

    if (biography !== undefined) {
      updates.push(`biography = $${paramCount}`);
      values.push(biography);
      paramCount++;
    }

    if (linkedin_url !== undefined) {
      updates.push(`linkedin_url = $${paramCount}`);
      values.push(linkedin_url);
      paramCount++;
    }

    if (github_url !== undefined) {
      updates.push(`github_url = $${paramCount}`);
      values.push(github_url);
      paramCount++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (is_instructor !== undefined) {
      updates.push(`is_instructor = $${paramCount}`);
      values.push(is_instructor);
      paramCount++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users_biomed
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, first_name, last_name, title, email, phone, address,
                profile_image_url, biography, linkedin_url, github_url,
                role, is_instructor, status, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    const user = new User(result.rows[0]);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update user'
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM users_biomed WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: result.rows[0].id,
        deleted_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete user'
    });
  }
};

// Get instructors
exports.getInstructors = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, first_name, last_name, title, email, phone, address, profile_image_url, biography, linkedin_url, github_url, role, is_instructor, status, created_at, updated_at FROM users_biomed WHERE (role = $1 OR is_instructor = true)';
    let countQuery = 'SELECT COUNT(*) FROM users_biomed WHERE (role = $1 OR is_instructor = true)';
    const params = ['INSTRUCTOR'];

    if (status) {
      query += ' AND status = $2';
      countQuery += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    const users = usersResult.rows.map(user => new User(user));
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      message: 'Instructors retrieved successfully',
      data: users,
      pagination: {
        current_page: parseInt(page),
        limit: parseInt(limit),
        total_count: totalCount,
        total_pages: totalPages
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve instructors'
    });
  }
};

// Change user status
exports.changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid status. Must be ACTIVE or INACTIVE'
      });
    }

    const result = await pool.query(
      `UPDATE users_biomed
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, first_name, last_name, title, email, phone, address,
                 profile_image_url, biography, linkedin_url, github_url,
                 role, is_instructor, status, created_at, updated_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const user = new User(result.rows[0]);

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update user status'
    });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No image file provided'
      });
    }

    const folder = 'biomed/profiles';

    // Upload to Cloudinary from buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto'
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({
            success: false,
            error: 'Upload Failed',
            message: 'Failed to upload image to Cloudinary'
          });
        }

        res.status(201).json({
          success: true,
          message: 'Profile image uploaded successfully',
          data: {
            cloudinary_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            size: result.bytes,
            format: result.format
          },
          timestamp: new Date().toISOString()
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process profile image upload'
    });
  }
};
