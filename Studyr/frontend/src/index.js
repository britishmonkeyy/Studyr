/*
Module Name: Application Entry Point
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: React application initialization with root rendering, strict mode configuration, and performance monitoring setup for production deployment
*/
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
