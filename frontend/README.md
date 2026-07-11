# Mates Frontend

Frontend for **Mates**, a real-time chat and community app.

This project provides the user interface for authentication, room browsing, and live chat, and connects to the Mates backend APIs and WebSocket endpoints.

## Stack

- React
- Vite
- React Router
- Axios
- Tailwind CSS

## Features

- Login and register pages
- Protected routes
- Home page and rooms flow
- Room details and room info pages
- User profile and public profile modal
- Real-time chat integration with backend
- Toast notifications
- Sidebar and navigation layout

## Project Structure

```bash
src/
  components/
  pages/
  api.js
  App.jsx
  main.jsx
  theme.css
```

## Getting Started

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Environment / Backend Connection

This frontend depends on the **Mates backend** for:
- authentication
- rooms data
- messages
- real-time chat

Make sure the backend is running and the API/WebSocket configuration is set correctly in the frontend.

## Available Pages

- `/login`
- `/register`
- `/forgot-password`
- `/home`
- `/room/:id`
- `/room/:id/info`
- `/profile`
- `/settings`
- `/updates`
- `/about`

## Notes

- This is an MVP frontend for the Mates project.
- The main focus of the overall project was backend development.
- The frontend was built rapidly, then refined and integrated with the backend to support the product flow.

## Related Repositories

- Backend: https://github.com/omar-mn/Mates_backend
- Frontend: https://github.com/omar-mn/Mates-Front
