-- Migration: Create contact_messages table
-- Description: Store contact form submissions

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    country_code VARCHAR(10),      
    phone_number VARCHAR(20),
    interest_topic VARCHAR(150),   
    message VARCHAR(5000) NOT NULL, 
    agreed_to_terms VARCHAR(5) DEFAULT 'true',  
    created_at VARCHAR(50) DEFAULT CURRENT_TIMESTAMP::text,
    status VARCHAR(20)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
