-- Create images table for storing image metadata
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY,
  cloudinary_id VARCHAR(255) UNIQUE NOT NULL,
  url TEXT,
  secure_url TEXT NOT NULL,
  public_id VARCHAR(255) NOT NULL,
  width INTEGER,
  height INTEGER,
  format VARCHAR(50),
  size BIGINT,
  folder VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on cloudinary_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_images_cloudinary_id ON images(cloudinary_id);

-- Create index on folder for filtering
CREATE INDEX IF NOT EXISTS idx_images_folder ON images(folder);

-- Create index on uploaded_at for sorting
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images(uploaded_at DESC);
