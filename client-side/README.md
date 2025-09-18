# WHERE IS MY BUS - Client Side

A React application built with Vite, Redux Toolkit, and React Router DOM.

## Features

- ⚡️ **Vite** - Fast build tool and development server
- ⚛️ **React 18** - Latest React with modern features
- 🔄 **Redux Toolkit** - Efficient Redux logic
- 🧭 **React Router DOM** - Client-side routing
- 📝 **React Hook Form** - Form handling (ready for integration)
- 🎨 **Ready for UI Libraries** - Prepared for custom UI components

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   └── LandingPage.jsx # Main landing page
├── store/              # Redux store configuration
│   ├── index.js        # Store setup
│   └── slices/         # Redux slices
│       └── appSlice.js # Main app slice
├── App.jsx             # Main app component with routing
└── main.jsx            # Entry point with providers
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Redux Store

The Redux store is configured with Redux Toolkit and includes:
- Pre-configured store setup
- Sample app slice (ready for customization)
- Connected to React app via Provider

## Routing

Basic routing is set up with React Router DOM:
- `/` - Landing Page

Add more routes in `App.jsx` as needed.

## Future Integrations

The project is prepared for:
- Custom UI component libraries
- Additional Redux slices
- Form handling with React Hook Form
- API integration
- Authentication

## Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
