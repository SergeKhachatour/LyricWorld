# LyricWorld

A global platform for sharing and discovering Christian songs from different cultures and languages. Built with Node.js, Express, MongoDB, and React.

## Features

- 🌍 Interactive world map showing Christian songs by location
- 🎵 Upload and share songs (audio files)
- 🌐 Support for multiple languages and translations
- 🎨 Multiple map themes for different viewing preferences
- 🔍 Advanced search and filtering capabilities
- 👥 User authentication and profiles
- 📱 Responsive design for all devices

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Multer (for file uploads)
- JWT Authentication

### Frontend
- React.js
- Material-UI (MUI)
- Mapbox GL JS
- React Router
- Axios

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Mapbox access token

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Backend
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
UPLOAD_DIR=uploads

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lyricworld.git
cd lyricworld
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Start the backend server:
```bash
# From the root directory
npm start
```

5. Start the frontend development server:
```bash
# From the frontend directory
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api

## Project Structure

```
lyricworld/
├── frontend/                 # React frontend
│   ├── public/              # Static files
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── package.json
├── src/                     # Backend source code
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── utils/             # Utility functions
├── uploads/                # Uploaded files directory
├── .env                    # Environment variables
├── .gitignore             # Git ignore file
├── package.json           # Backend dependencies
└── README.md              # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Mapbox for the mapping functionality
- Material-UI for the component library
- All contributors and users of the platform 