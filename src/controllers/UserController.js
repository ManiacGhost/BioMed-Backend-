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
    const connection = await pool.getConnection();
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
    const [existingUser] = await connection.query(
      'SELECT id FROM users_biomed WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existingUser.length > 0) {
      await connection.release();
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email or phone already exists'
      });
    }

    // Hash password
    const password_hash = hashPassword(password);

    // Insert user
    const [result] = await connection.query(
      `INSERT INTO users_biomed (
        first_name, last_name, title, email, phone, password_hash,
        address, profile_image_url, biography, linkedin_url, github_url,
        role, is_instructor, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name, last_name, title, email, phone, password_hash,
        address, profile_image_url, biography, linkedin_url, github_url,
        role, is_instructor, status
      ]
    );

    // Fetch the created user
    const [createdUser] = await connection.query(
      'SELECT * FROM users_biomed WHERE id = ?',
      [result.insertId]
    );

    await connection.release();
    const user = new User(createdUser[0]);

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
    const connection = await pool.getConnection();
    const { page = 1, limit = 20, role, status, is_instructor } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, first_name, last_name, title, email, phone, address, profile_image_url, biography, linkedin_url, github_url, role, is_instructor, status, created_at, updated_at FROM users_biomed WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as count FROM users_biomed WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    if (is_instructor !== undefined) {
      query += ' AND is_instructor = ?';
      countQuery += ' AND is_instructor = ?';
      params.push(is_instructor === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const [usersResult] = await connection.query(query, [...params, parseInt(limit), offset]);
    const [countResult] = await connection.query(countQuery, params);

    await connection.release();

    const users = usersResult.map(user => new User(user));
    const totalCount = countResult[0].count;
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
    const connection = await pool.getConnection();
    const { id } = req.params;

    const [result] = await connection.query(
      'SELECT id, first_name, last_name, title, email, phone, address, profile_image_url, biography, linkedin_url, github_url, role, is_instructor, status, created_at, updated_at FROM users_biomed WHERE id = ?',
      [id]
    );

    await connection.release();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const user = new User(result[0]);

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
    const connection = await pool.getConnection();
    const { email } = req.params;

    const [result] = await connection.query(
      'SELECT id, first_name, last_name, title, email, phone, address, profile_image_url, biography, linkedin_url, github_url, role, is_instructor, status, created_at, updated_at FROM users_biomed WHERE email = ?',
      [email]
    );

    await connection.release();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const user = new User(result[0]);

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
    const connection = await pool.getConnection();
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
    const [currentUser] = await connection.query(
      'SELECT * FROM users_biomed WHERE id = ?',
      [id]
    );

    if (currentUser.length === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name);
    }

    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name);
    }

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }

    if (profile_image_url !== undefined) {
      updates.push('profile_image_url = ?');
      values.push(profile_image_url);
    }

    if (biography !== undefined) {
      updates.push('biography = ?');
      values.push(biography);
    }

    if (linkedin_url !== undefined) {
      updates.push('linkedin_url = ?');
      values.push(linkedin_url);
    }

    if (github_url !== undefined) {
      updates.push('github_url = ?');
      values.push(github_url);
    }

    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    if (is_instructor !== undefined) {
      updates.push('is_instructor = ?');
      values.push(is_instructor);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE users_biomed SET ${updates.join(', ')} WHERE id = ?`;

    await connection.query(query, values);

    // Fetch updated user
    const [updatedUser] = await connection.query(
      'SELECT * FROM users_biomed WHERE id = ?',
      [id]
    );

    await connection.release();
    const user = new User(updatedUser[0]);

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
    const connection = await pool.getConnection();
    const { id } = req.params;

    // Check if user exists
    const [user] = await connection.query('SELECT id FROM users_biomed WHERE id = ?', [id]);

    if (user.length === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    await connection.query('DELETE FROM users_biomed WHERE id = ?', [id]);
    await connection.release();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: id,
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
    const connection = await pool.getConnection();
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, first_name, last_name, title, email, phone, address, profile_image_url, biography, linkedin_url, github_url, role, is_instructor, status, created_at, updated_at FROM users_biomed WHERE (role = ? OR is_instructor = true)';
    let countQuery = 'SELECT COUNT(*) as count FROM users_biomed WHERE (role = ? OR is_instructor = true)';
    const params = ['INSTRUCTOR'];

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const [usersResult] = await connection.query(query, [...params, parseInt(limit), offset]);
    const [countResult] = await connection.query(countQuery, ['INSTRUCTOR'].concat(status ? [status] : []));

    await connection.release();

    const users = usersResult.map(user => new User(user));
    const totalCount = countResult[0].count;
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
    const connection = await pool.getConnection();
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid status. Must be ACTIVE or INACTIVE'
      });
    }

    // Check if user exists and update
    const [result] = await connection.query(
      'UPDATE users_biomed SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Fetch updated user
    const [updatedUser] = await connection.query('SELECT * FROM users_biomed WHERE id = ?', [id]);

    await connection.release();
    const user = new User(updatedUser[0]);

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
