import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom'
import {Provider} from 'react-redux'

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import store from './store'
import {fetchTodos} from './features/todos/todosSlice'

store.dispatch(fetchTodos({}))

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  
);

reportWebVitals();