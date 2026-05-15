# GymBro Client

A modern React client for the GymBro fitness tracking application.

## Features

- **User Authentication**: Register, login, email verification
- **Profile Management**: Update account settings, change profile photo
- **Food Search**: Search for nutritional information
- **Account Deletion**: Secure account deletion with confirmation
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Tech Stack

- React 18
- React Router DOM
- Axios for API calls
- Tailwind CSS for styling
- Lucide React for icons
- Vite for development and building

## Getting Started

### Prerequisites

Make sure you have Node.js installed on your machine.

### Installation

1. Install dependencies from the root directory:
   ```bash
   npm install
   ```

2. Start the backend server (make sure it's running on port 5000):
   ```bash
   npm run dev
   ```

3. Start the client development server:
   ```bash
   npm run client:dev
   ```

The client will be available at `http://localhost:3000`

## Available Scripts

- `npm run client:dev` - Start development server
- `npm run client:build` - Build for production
- `npm run client:preview` - Preview production build

## API Integration

The client is configured to proxy API requests to the backend running on `http://localhost:5000`. All API endpoints are available under the `/api` prefix.

### Authentication

- JWT tokens are stored in localStorage
- Protected routes require authentication
- Automatic token handling for API requests

### File Uploads

- Profile photo upload supported
- FormData used for multipart file uploads
- Image preview functionality

## Pages

- **Home** (`/`) - Landing page with app overview
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - User registration with photo upload
- **Verify Email** (`/verify-email`) - Email verification page
- **Food Search** (`/food-search`) - Search nutritional information
- **Account Settings** (`/account-settings`) - Update user profile
- **Delete Account** (`/delete-account`) - Account deletion with confirmation

## Styling

The application uses Tailwind CSS for styling with a modern, clean design. Color scheme focuses on blue as the primary color with proper contrast and accessibility considerations.

## Environment Variables

No additional environment variables are needed for the client. The backend API URL is configured in the Vite config file.
