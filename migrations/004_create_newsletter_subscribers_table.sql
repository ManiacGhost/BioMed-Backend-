-- Migration: Create newsletter_subscribers_biomed table
-- Description: Store email subscribers for newsletter

CREATE TABLE IF NOT EXISTS newsletter_subscribers_biomed (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status varchar(50)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_biomed_email ON newsletter_subscribers_biomed(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_biomed_status ON newsletter_subscribers_biomed(status);
