const ContactMessage = require('../models/ContactMessage');
const pool = require('../config/database');
const { sendContactConfirmationEmail, sendContactAdminNotificationEmail } = require('../config/email');

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    const {
      full_name,
      email,
      country_code,
      phone_number,
      interest_topic,
      message,
      agreed_to_terms = 'true'
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Full name, email, and message are required'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Valid email address is required'
      });
    }

    // Validate terms agreement
    if (agreed_to_terms !== 'true' && agreed_to_terms !== true) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'You must agree to the terms and conditions'
      });
    }

    // Insert contact message
    const result = await pool.query(
      `INSERT INTO contact_messages 
       (full_name, email, country_code, phone_number, interest_topic, message, agreed_to_terms, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', NOW()::text)
       RETURNING *`,
      [full_name, email, country_code, phone_number, interest_topic, message, agreed_to_terms]
    );

    const contactMessage = new ContactMessage(result.rows[0]);

    // Send confirmation email to user
    try {
      await sendContactConfirmationEmail(email, full_name);
    } catch (emailError) {
      console.error('Failed to send user confirmation email:', emailError);
    }

    // Send admin notification
    try {
      await sendContactAdminNotificationEmail({
        full_name,
        email,
        country_code,
        phone_number,
        interest_topic,
        message
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: contactMessage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to submit contact form'
    });
  }
};

// Get all contact messages (admin)
exports.getAllMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = 'SELECT * FROM contact_messages WHERE 1=1';
    let values = [];
    let valueIndex = 1;

    if (status) {
      query += ` AND status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(parseInt(limit), offset);

    const result = await pool.query(query, values);
    const messages = result.rows.map(msg => new ContactMessage(msg));

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM contact_messages WHERE 1=1';
    let countValues = [];

    if (status) {
      countQuery += ` AND status = $1`;
      countValues.push(status);
    }

    const countResult = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve messages'
    });
  }
};

// Get contact message by ID
exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message retrieved successfully',
      data: new ContactMessage(result.rows[0]),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve message'
    });
  }
};

// Update message status
exports.updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Status is required'
      });
    }

    // Check if message exists
    const existingMessage = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [id]);
    if (existingMessage.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Message not found'
      });
    }

    const result = await pool.query(
      'UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.status(200).json({
      success: true,
      message: 'Message status updated successfully',
      data: new ContactMessage(result.rows[0]),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update message status'
    });
  }
};

// Delete contact message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM contact_messages WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: new ContactMessage(result.rows[0]),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete message'
    });
  }
};

// Get contact statistics
exports.getStatistics = async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM contact_messages');
    const newResult = await pool.query("SELECT COUNT(*) FROM contact_messages WHERE status = 'new'");
    const respondedResult = await pool.query("SELECT COUNT(*) FROM contact_messages WHERE status = 'responded'");
    const resolvedResult = await pool.query("SELECT COUNT(*) FROM contact_messages WHERE status = 'resolved'");

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        total: parseInt(totalResult.rows[0].count),
        new: parseInt(newResult.rows[0].count),
        responded: parseInt(respondedResult.rows[0].count),
        resolved: parseInt(resolvedResult.rows[0].count)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve statistics'
    });
  }
};

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
