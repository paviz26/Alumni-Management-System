# Setup Guide

## PostgreSQL
1. Install PostgreSQL and pgAdmin.
2. Create the database using `database/00_create_database.sql`.
3. Connect to `alumni_management`.
4. Run scripts in order:
   - 01_schema.sql
   - 02_sample_data.sql
   - 04_views.sql
   - 05_functions.sql
   - 06_triggers.sql

## Backend
1. Open a terminal in `backend`.
2. Copy `.env.example` to `.env`.
3. Enter PostgreSQL credentials.
4. Run `npm install`.
5. Run `npm run dev`.

## Frontend
Open `frontend/index.html` or serve the folder using a local web server.
