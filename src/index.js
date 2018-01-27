import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App txt="This is the prop test" />, document.getElementById('root'));
registerServiceWorker();
