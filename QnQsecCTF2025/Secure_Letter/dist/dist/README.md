# Final Challenge - Letter Writer

A sophisticated letter writing application built with TypeScript, Express, and React that demonstrates iframe functionality with data:text URIs and Content Security Policy (CSP) implementation.

## Features

### 🎯 Core Functionality
- **Letter Writing Interface**: Clean, modern UI for writing letters
- **Iframe Preview**: Real-time preview of letters using data:text URIs
- **{Letter} Placeholder**: Dynamic content replacement system
- **Strong CSP Implementation**: Apply the strongest Content Security Policy

### 🔒 Security Features
- **Strongest CSP Policy**: Implements the most restrictive CSP possible
- **XSS Protection**: HTML escaping and sanitization
- **Secure Data Handling**: Safe content processing and storage

### 🎨 User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Preview**: See your letter as you type
- **Save/Load Letters**: Persistent storage of letter content
- **Beautiful UI**: Modern gradient design with smooth animations

## Technical Architecture

### Backend (TypeScript + Express)
- **server.js**: Main server file with API endpoints
- **Letter Storage**: In-memory storage with Map-based persistence
- **API Endpoints**:
  - `POST /api/letter` - Save a new letter
  - `GET /api/letter/:id` - Retrieve specific letter
  - `GET /api/letters` - Get all saved letters
  - `GET /api/health` - Health check endpoint

### Frontend (React + TypeScript)
- **LetterWriter Component**: Main application component
- **Iframe Integration**: Dynamic data:text URI generation
- **CSP Management**: Real-time CSP policy application
- **State Management**: React hooks for component state

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Development Mode**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   npm run serve
   ```

4. **Access Application**:
   - Open http://localhost:3001 in your browser

## Usage Instructions

### Writing Letters
1. **Enter Content**: Type your letter in the text area
2. **Use Placeholders**: Include `{Letter}` for dynamic content
3. **Update Preview**: Click "Update Letter" to see changes
4. **Apply Security**: Click "Apply Strong CSP" for maximum security
5. **Save Letter**: Use "Save Letter" to persist your content

### CSP Implementation
The application implements the strongest possible CSP policy:
```
default-src 'none'; 
script-src 'none'; 
style-src 'none'; 
img-src 'none'; 
font-src 'none'; 
connect-src 'none'; 
media-src 'none'; 
object-src 'none'; 
child-src 'none'; 
frame-src 'none'; 
worker-src 'none'; 
frame-ancestors 'none'; 
form-action 'none'; 
base-uri 'none'; 
manifest-src 'none';
```

### Iframe Data URI
Letters are rendered using data:text URIs with the following structure:
```
data:text/html;charset=utf-8,<encoded-html-content>
```

## Security Considerations

- **XSS Prevention**: All user input is properly escaped
- **CSP Enforcement**: Strongest possible Content Security Policy
- **Data Sanitization**: HTML content is sanitized before rendering
- **Secure Headers**: Proper security headers implementation

## File Structure

```
finalChall/
├── src/
│   ├── components/
│   │   └── LetterWriter.tsx    # Main component
│   ├── App.tsx                 # App component
│   ├── App.css                 # App styles
│   ├── index.tsx               # Entry point
│   └── index.css               # Global styles
├── public/
│   ├── index.html              # HTML template
│   └── manifest.json           # PWA manifest
├── server.ts                   # Express server
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind config
└── README.md                   # This file
```

## API Endpoints

### POST /api/letter
Save a new letter to the system.

**Request Body**:
```json
{
  "content": "Your letter content here"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Letter saved successfully",
  "data": {
    "letterId": "1234567890",
    "timestamp": 1234567890
  }
}
```

### GET /api/letters
Retrieve all saved letters.

**Response**:
```json
{
  "success": true,
  "message": "Letters retrieved successfully",
  "data": [
    {
      "id": "1234567890",
      "content": "Letter content",
      "timestamp": 1234567890
    }
  ]
}
```

## Development Notes

- The application uses TypeScript for type safety
- React hooks manage component state
- Express handles API routing and static file serving
- Tailwind CSS provides responsive styling
- CSP is applied dynamically via JavaScript

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project is created for educational and demonstration purposes.
