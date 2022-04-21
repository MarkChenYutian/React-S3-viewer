import React from 'react';
import * as ReactDOMClient from 'react-dom/client';

import './index.css';

import App from './App';

import reportWebVitals from './reportWebVitals';


let container = document.getElementById('root');
if (container == null) {
  throw new Error("Can't initialize react");
}

const root = ReactDOMClient.createRoot(container);
root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
reportWebVitals();
