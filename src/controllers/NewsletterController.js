const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const pool = require('../config/database');
const { sendConfirmationEmail, sendWelcomeEmail, sendUnsubscribeEmail } = require('../config/email');
const crypto = require('crypto');

// Get all subscribers
exports.getAllSubscribers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
    const subscribers = result.rows.map(sub => new NewsletterSubscriber(sub));
    
    res.status(200).json({
      success: true,
      message: 'Subscribers retrieved successfully',
      data: subscribers,
      count: subscribers.length,
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
    const { email } = req.params;
    const result = await pool.query('SELECT * FROM newsletter_subscribers WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Subscriber not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Subscriber retrieved successfully',
      data: new NewsletterSubscriber(result.rows[0]),
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
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Valid email is required'
      });
    }

    // Insert new subscriber with 'active' status
    const result = await pool.query(
      `INSERT INTO newsletter_subscribers (email, status, created_at)
       VALUES ($1, 'active', NOW())
       RETURNING *`,
      [email]
    );

    const subscriber = new NewsletterSubscriber(result.rows[0]);

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
    console.error('Error subscribing:', error);
    
    // Handle unique constraint error
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'This email is already subscribed'
      });
    }

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email is required'
      });
    }

    // Check if subscriber exists
    const result = await pool.query(
      `SELECT * FROM newsletter_subscribers 
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Subscriber not found'
      });
    }

    const subscriber = new NewsletterSubscriber(result.rows[0]);

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email is required'
      });
    }

    // Update subscriber status to unsubscribed
    const result = await pool.query(
      `UPDATE newsletter_subscribers 
       SET status = 'unsubscribed'
       WHERE email = $1
       RETURNING *`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Subscriber not found'
      });
    }

    const subscriber = new NewsletterSubscriber(result.rows[0]);

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
    const totalResult = await pool.query('SELECT COUNT(*) FROM newsletter_subscribers');
    const activeResult = await pool.query(
      "SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'active'"
    );
    const pendingResult = await pool.query(
      "SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'pending'"
    );
    const unsubscribedResult = await pool.query(
      "SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'unsubscribed'"
    );

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        total: parseInt(totalResult.rows[0].count),
        active: parseInt(activeResult.rows[0].count),
        pending: parseInt(pendingResult.rows[0].count),
        unsubscribed: parseInt(unsubscribedResult.rows[0].count)
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
