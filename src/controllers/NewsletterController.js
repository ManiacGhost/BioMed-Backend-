const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const pool = require('../config/database');
const { sendConfirmationEmail, sendWelcomeEmail, sendUnsubscribeEmail } = require('../config/email');
const crypto = require('crypto');

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get all subscribers
exports.getAllSubscribers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [subscribers] = await connection.query('SELECT * FROM newsletter_subscribers_biomed ORDER BY created_at DESC');
    await connection.release();
    
    const subscriberData = subscribers.map(sub => new NewsletterSubscriber(sub));
    
    res.status(200).json({
      success: true,
      message: 'Subscribers retrieved successfully',
      data: subscriberData,
      count: subscriberData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve subscribers'
    });
  }
};

// Get subscriber by email
exports.getSubscriberByEmail = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { email } = req.params;
    const [result] = await connection.query('SELECT * FROM newsletter_subscribers_biomed WHERE email = ?', [email]);
    await connection.release();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Subscriber not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Subscriber retrieved successfully',
      data: new NewsletterSubscriber(result[0]),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve subscriber'
    });
  }
};

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Valid email is required'
      });
    }

    // Insert new subscriber with 'active' status
    try {
      const [result] = await connection.query(
        'INSERT INTO newsletter_subscribers_biomed (email, status) VALUES (?, ?)',
        [email, 'active']
      );

      // Fetch created subscriber
      const [createdSubscriber] = await connection.query(
        'SELECT * FROM newsletter_subscribers_biomed WHERE id = ?',
        [result.insertId]
      );

      await connection.release();
      const subscriber = new NewsletterSubscriber(createdSubscriber[0]);

      // Send welcome email immediately
      try {
        await sendWelcomeEmail(email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Still return success but log the email error
      }

      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to newsletter!',
        data: subscriber,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await connection.release();
      
      // Handle unique constraint error - MySQL error code 1062
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'This email is already subscribed'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to subscribe to newsletter'
    });
  }
};

// Confirm subscription (optional - kept for compatibility, subscriber already active)
exports.confirmSubscription = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { email } = req.body;

    if (!email) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email is required'
      });
    }

    // Check if subscriber exists
    const [result] = await connection.query(
      'SELECT * FROM newsletter_subscribers_biomed WHERE email = ?',
      [email]
    );

    await connection.release();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Subscriber not found'
      });
    }

    const subscriber = new NewsletterSubscriber(result[0]);

    res.status(200).json({
      success: true,
      message: 'You are already subscribed to our newsletter!',
      data: subscriber,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error confirming subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to confirm subscription'
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { email } = req.body;

    if (!email) {
      await connection.release();
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email is required'
      });
    }

    // Check if exists first
    const [existing] = await connection.query(
      'SELECT * FROM newsletter_subscribers_biomed WHERE email = ?',
      [email]
    );

    if (existing.length === 0) {
      await connection.release();
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Subscriber not found'
      });
    }

    // Update subscriber status to unsubscribed
    await connection.query(
      'UPDATE newsletter_subscribers_biomed SET status = ? WHERE email = ?',
      ['unsubscribed', email]
    );

    // Fetch updated subscriber
    const [result] = await connection.query(
      'SELECT * FROM newsletter_subscribers_biomed WHERE email = ?',
      [email]
    );

    await connection.release();
    const subscriber = new NewsletterSubscriber(result[0]);

    // Send unsubscribe confirmation email
    try {
      await sendUnsubscribeEmail(email);
    } catch (emailError) {
      console.error('Failed to send unsubscribe email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: subscriber,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to unsubscribe'
    });
  }
};

// Get subscriber statistics
exports.getStatistics = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [totalResult] = await connection.query('SELECT COUNT(*) as count FROM newsletter_subscribers_biomed');
    const [activeResult] = await connection.query(
      "SELECT COUNT(*) as count FROM newsletter_subscribers_biomed WHERE status = 'active'"
    );
    const [pendingResult] = await connection.query(
      "SELECT COUNT(*) as count FROM newsletter_subscribers_biomed WHERE status = 'pending'"
    );
    const [unsubscribedResult] = await connection.query(
      "SELECT COUNT(*) as count FROM newsletter_subscribers_biomed WHERE status = 'unsubscribed'"
    );

    await connection.release();

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        total: totalResult[0].count,
        active: activeResult[0].count,
        pending: pendingResult[0].count,
        unsubscribed: unsubscribedResult[0].count
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
