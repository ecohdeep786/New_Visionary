-- Runs only when the new local PostgreSQL volume is first initialized.
CREATE DATABASE visionary_rag;
\connect visionary_rag
CREATE EXTENSION IF NOT EXISTS vector;
