-- Create users_biomed table
CREATE TABLE IF NOT EXISTS users_biomed (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Basic Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(150),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    address TEXT,
    profile_image_url TEXT,

    -- Professional Info
    biography TEXT,

    -- Social Links
    linkedin_url TEXT,
    github_url TEXT,

    -- Role & Status
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    is_instructor BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users_biomed(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users_biomed(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users_biomed(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users_biomed(status);
CREATE INDEX IF NOT EXISTS idx_users_is_instructor ON users_biomed(is_instructor);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users_biomed(created_at DESC);
