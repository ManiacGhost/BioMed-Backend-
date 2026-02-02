const cloudinary = require('../config/cloudinary');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

// Upload image to Cloudinary
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No image file provided'
      });
    }

    const { folder = 'biomed' } = req.body;

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
          logger.error('Cloudinary upload error', error);
          return res.status(500).json({
            success: false,
            error: 'Upload Failed',
            message: 'Failed to upload image to Cloudinary'
          });
        }

        let connection;
        try {
          connection = await pool.getConnection();
          
          // Save image metadata to database
          const imageId = uuidv4();
          
          await connection.query(
            `INSERT INTO images (id, cloudinary_id, url, secure_url, public_id, width, height, format, size, folder)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              imageId,
              result.public_id,
              result.url,
              result.secure_url,
              result.public_id,
              result.width,
              result.height,
              result.format,
              result.bytes,
              folder
            ]
          );

          await connection.release();

          res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
              id: imageId,
              cloudinary_id: result.public_id,
              url: result.secure_url,
              width: result.width,
              height: result.height,
              size: result.bytes,
              format: result.format,
              folder: folder,
              uploaded_at: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          });
        } catch (dbError) {
          if (connection) await connection.release();
          if (connection) await connection.release();
          logger.error('Database error', dbError);
          // Image uploaded to Cloudinary but DB save failed
          res.status(201).json({
            success: true,
            message: 'Image uploaded successfully (metadata not saved)',
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
      }
    );

    // Pipe the file buffer to the upload stream
    uploadStream.end(req.file.buffer);
  } catch (error) {
    logger.error('Upload error', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process image upload'
    });
  }
};

// Get image by ID
exports.getImage = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;

    const [result] = await connection.query(
      'SELECT * FROM images WHERE id = ?',
      [id]
    );

    await connection.release();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Image not found'
      });
    }

    const image = result[0];

    res.status(200).json({
      success: true,
      message: 'Image retrieved successfully',
      data: {
        id: image.id,
        cloudinary_id: image.cloudinary_id,
        url: image.secure_url,
        width: image.width,
        height: image.height,
        size: image.size,
        format: image.format,
        folder: image.folder,
        uploaded_at: image.uploaded_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve image'
    });
  }
};

// Get all images with pagination
exports.getAllImages = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { page = 1, limit = 20, folder } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM images';
    let countQuery = 'SELECT COUNT(*) as count FROM images';
    let params = [];

    if (folder) {
      query += ' WHERE folder = ?';
      countQuery += ' WHERE folder = ?';
      params.push(folder);
    }

    query += ' ORDER BY uploaded_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [imagesResult] = await connection.query(query, params);
    
    let countParams = [];
    if (folder) countParams.push(folder);
    const [countResult] = await connection.query(countQuery, countParams);

    await connection.release();

    const images = imagesResult.map(img => ({
      id: img.id,
      cloudinary_id: img.cloudinary_id,
      url: img.secure_url,
      width: img.width,
      height: img.height,
      size: img.size,
      format: img.format,
      folder: img.folder,
      uploaded_at: img.uploaded_at
    }));

    const totalCount = countResult[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      message: 'Images retrieved successfully',
      data: images,
      pagination: {
        current_page: parseInt(page),
        limit: parseInt(limit),
        total_count: totalCount,
        total_pages: totalPages
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching images', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve images'
    });
  }
};

// Delete image
exports.deleteImage = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;

    // Get image from database
    const [result] = await connection.query(
      'SELECT cloudinary_id FROM images WHERE id = ?',
      [id]
    );

    if (result.length === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Image not found'
      });
    }

    const cloudinaryId = result[0].cloudinary_id;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(cloudinaryId);

    // Delete from database
    await connection.query('DELETE FROM images WHERE id = ?', [id]);
    await connection.release();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        id: id,
        deleted_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error deleting image', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete image'
    });
  }
};

// Get image by Cloudinary ID
exports.getImageByCloudinaryId = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { cloudinaryId } = req.params;

    const [result] = await connection.query(
      'SELECT * FROM images WHERE cloudinary_id = ?',
      [cloudinaryId]
    );

    await connection.release();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Image not found'
      });
    }

    const image = result[0];

    res.status(200).json({
      success: true,
      message: 'Image retrieved successfully',
      data: {
        id: image.id,
        cloudinary_id: image.cloudinary_id,
        url: image.secure_url,
        width: image.width,
        height: image.height,
        size: image.size,
        format: image.format,
        folder: image.folder,
        uploaded_at: image.uploaded_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve image'
    });
  }
};
