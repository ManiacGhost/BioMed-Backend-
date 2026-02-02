const ContactMessage = require('../models/ContactMessage');
const pool = require('../config/database');
const { sendContactConfirmationEmail, sendContactAdminNotificationEmail } = require('../config/email');

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    const connection = await pool.getConnection();
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
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Full name, email, and message are required'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Valid email address is required'
      });
    }

    // Validate terms agreement
    if (agreed_to_terms !== 'true' && agreed_to_terms !== true) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'You must agree to the terms and conditions'
      });
    }

    // Insert contact message
    const [result] = await connection.query(
      `INSERT INTO contact_messages 
       (full_name, email, country_code, phone_number, interest_topic, message, agreed_to_terms, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new')`,
      [full_name, email, country_code, phone_number, interest_topic, message, agreed_to_terms]
    );

    // Fetch created message
    const [createdMessage] = await connection.query(
      'SELECT * FROM contact_messages WHERE id = ?',
      [result.insertId]
    );

    await connection.release();
    const contactMessage = new ContactMessage(createdMessage[0]);

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
    const connection = await pool.getConnection();
    const { page = 1, limit = 10, status } = req.query;

    let query = 'SELECT * FROM contact_messages WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as count FROM contact_messages WHERE 1=1';
    let values = [];

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      values.push(status);
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    values.push(parseInt(limit), offset);

    const [messages] = await connection.query(query, values);

    // Get total count
    let countValues = [];
    if (status) countValues.push(status);
    const [countResult] = await connection.query(countQuery, countValues);
    const totalCount = countResult[0].count;

    await connection.release();

    const messageData = messages.map(msg => new ContactMessage(msg));

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: messageData,
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
    const connection = await pool.getConnection();
    const { id } = req.params;
    const [result] = await connection.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    await connection.release();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message retrieved successfully',
      data: new ContactMessage(result[0]),
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
    const connection = await pool.getConnection();
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Status is required'
      });
    }

    // Check if message exists
    const [existingMessage] = await connection.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    if (existingMessage.length === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Message not found'
      });
    }

    await connection.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);

    // Fetch updated message
    const [updatedMessage] = await connection.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    await connection.release();

    res.status(200).json({
      success: true,
      message: 'Message status updated successfully',
      data: new ContactMessage(updatedMessage[0]),
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
    const connection = await pool.getConnection();
    const { id } = req.params;

    // Check if message exists
    const [existingMessage] = await connection.query('SELECT * FROM contact_messages WHERE id = ?', [id]);

    if (existingMessage.length === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Message not found'
      });
    }

    await connection.query('DELETE FROM contact_messages WHERE id = ?', [id]);
    await connection.release();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: new ContactMessage(existingMessage[0]),
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
    const connection = await pool.getConnection();
    
    const [totalResult] = await connection.query('SELECT COUNT(*) as count FROM contact_messages');
    const [newResult] = await connection.query("SELECT COUNT(*) as count FROM contact_messages WHERE status = 'new'");
    const [respondedResult] = await connection.query("SELECT COUNT(*) as count FROM contact_messages WHERE status = 'responded'");
    const [resolvedResult] = await connection.query("SELECT COUNT(*) as count FROM contact_messages WHERE status = 'resolved'");

    await connection.release();

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        total: totalResult[0].count,
        new: newResult[0].count,
        responded: respondedResult[0].count,
        resolved: resolvedResult[0].count
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
