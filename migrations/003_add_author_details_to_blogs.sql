-- Migration: Add author details to blogs_biomed table
-- Description: Add author_name and author_email columns to store author information

ALTER TABLE public.blogs_biomed
ADD COLUMN author_name varchar(200) NULL,
ADD COLUMN author_email varchar(255) NULL;

-- Create index on author_email for faster queries
CREATE INDEX idx_blogs_author_email ON blogs_biomed(author_email);
