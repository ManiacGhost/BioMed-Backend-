-- Migration: Add author details to blogs_cw table
-- Description: Add author_name and author_email columns to store author information

ALTER TABLE public.blogs_cw
ADD COLUMN author_name varchar(200) NULL,
ADD COLUMN author_email varchar(255) NULL;

-- Create index on author_email for faster queries
CREATE INDEX idx_blogs_author_email ON blogs_cw(author_email);
