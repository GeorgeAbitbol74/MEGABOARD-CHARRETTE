import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Laravel Integration: Read props from data attributes
// Blade usage: <div id="root" data-props="{{ json_encode(['projectId' => 123, 'embedded' => true]) }}"></div>
const props = rootElement.dataset.props ? JSON.parse(rootElement.dataset.props) : {};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App {...props} />
  </React.StrictMode>
);