const cloudinary = require('../config/cloudinary');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

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
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({
            success: false,
            error: 'Upload Failed',
            message: 'Failed to upload image to Cloudinary'
          });
        }

        try {
          // Save image metadata to database
          const imageId = uuidv4();
          const query = `
            INSERT INTO images (id, cloudinary_id, url, secure_url, public_id, width, height, format, size, folder, uploaded_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING *
          `;

          const values = [
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
          ];

          const dbResult = await pool.query(query, values);

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
          console.error('Database error:', dbError);
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
    console.error('Upload error:', error);
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
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM images WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Image not found'
      });
    }

    const image = result.rows[0];

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
    const { page = 1, limit = 20, folder } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM images';
    let countQuery = 'SELECT COUNT(*) FROM images';
    const params = [];

    if (folder) {
      query += ' WHERE folder = $1';
      countQuery += ' WHERE folder = $1';
      params.push(folder);
    }

    query += ' ORDER BY uploaded_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

    const [imagesResult, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, folder ? [folder] : [])
    ]);

    const images = imagesResult.rows.map(img => ({
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

    const totalCount = parseInt(countResult.rows[0].count);
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
    console.error('Error fetching images:', error);
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
    const { id } = req.params;

    // Get image from database
    const result = await pool.query(
      'SELECT cloudinary_id FROM images WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Image not found'
      });
    }

    const cloudinaryId = result.rows[0].cloudinary_id;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(cloudinaryId);

    // Delete from database
    await pool.query('DELETE FROM images WHERE id = $1', [id]);

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
    console.error('Error deleting image:', error);
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
    const { cloudinaryId } = req.params;

    const result = await pool.query(
      'SELECT * FROM images WHERE cloudinary_id = $1',
      [cloudinaryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Image not found'
      });
    }

    const image = result.rows[0];

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
