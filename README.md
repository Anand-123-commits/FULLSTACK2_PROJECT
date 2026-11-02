# Smart Parking System

A fully functional full-stack system built with Node.js, Express, a MySQL database, and a beautiful premium frontend dashboard using Vanilla HTML, CSS and JS.

## Features
- **Real-time Dashboard**: Dynamic tracking of available and occupied slots.
- **Vehicle Entry System**: Register new vehicles and assign them to an available slot.
- **Automated Billing Engine**: End a parking session to automatically generate a parking bill (minimum ₹20, scalable by hour).
- **Beautiful UX**: Premium light-mode interface with dynamic glassmorphic elements and neon status indicators.

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript (Vanilla - no modern framework required for running, keeping it light)
- Backend: Node.js, Express.js
- Database: MySQL
- Data Fetching: Native Fetch API

## Prerequisites
- Node.js (v14 or higher)
- MySQL Server running locally configured with your database `SmartParking1`

## Database Setup
1. Open your MySQL client (e.g., MySQL Workbench, phpMyAdmin, or terminal).
2. Execute the provided SQL queries to create the database, tables, and seed initial data.

## Installation & Running

1. **Configure Environment Variables**  
   Copy `.env.example` to `.env` in the project directory and update `DB_PASSWORD` with your MySQL password. You can also modify `DB_USER` if needed. Do not commit `.env`; it contains local credentials.

2. **Install Dependencies** *(Already done automatically!)*  
   If you ever need to re-install them in the future open a terminal in the project directory and run:
   ```bash
   npm install
   ```
   *Libraries Installed:*
   - `express`: Web server to host the API and Frontend.
   - `mysql2`: Database driver to connect to MySQL backend gracefully.
   - `cors`: Handles Cross-Origin Resource Sharing.
   - `dotenv`: Handles local environment configuration.

3. **Start the Required Services**  
   Open a terminal inside the project directory and run:
   ```bash
   node server.js
   ```
   *(For development mode with automatic restart, you can use `npm run dev` if you have Node's new watch mode or nodemon).*

4. **Access the Application**  
   Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

Enjoy managing your smart parking layout!
