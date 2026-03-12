# Meeting Hub

An interactive website for inviting people to meetings and transcribing meeting audio.

## Features

### 1. Invite People to Meetings
- Create meeting invitations with title, date, and time
- Add optional meeting links (Zoom, Teams, Google Meet, etc.)
- Manage multiple invitees by email
- Send invitations to all participants

### 2. Transcribe Meeting Audio
- Record meeting audio directly in the browser
- Real-time recording timer
- Save and manage recordings
- Transcribe audio to text
- Download transcriptions as text files

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- VS Code (recommended)

### Installation

1. Open the project folder in VS Code
2. Open the integrated terminal (Ctrl+` or Cmd+`)
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

3. The application should now be running!

### Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist` folder.

To preview the production build:
```bash
npm run preview
```

## Project Structure

```
meeting-hub-project/
├── src/
│   ├── App.jsx          # Main Meeting Hub component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles with Tailwind
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── postcss.config.js    # PostCSS configuration
```

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **MediaRecorder API** - Audio recording

## Production Integration

### Transcription API Integration

The transcription feature currently uses simulated data. To integrate real transcription, you can use:

1. **OpenAI Whisper API**
   ```javascript
   const formData = new FormData();
   formData.append('file', audioBlob, 'recording.wav');
   formData.append('model', 'whisper-1');
   
   const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${YOUR_API_KEY}`
     },
     body: formData
   });
   ```

2. **Google Speech-to-Text**
3. **Assembly AI**
4. **Azure Speech Services**

### Email Integration

For sending actual meeting invitations, integrate with:
- SendGrid
- Mailgun
- AWS SES
- Nodemailer with SMTP

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Requires microphone permissions for audio recording

## Support

For issues or questions, please contact your development team.
