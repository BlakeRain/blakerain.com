import React from 'react';
import { Root, Routes, addPrefetchExcludes, useLocation } from 'react-static';
import { Link, Router } from 'components/Router';

import Navigation from 'components/Navigation';
import Footer from 'components/Footer';

import Dynamic from 'containers/Dynamic';

import 'normalize.css';
import './App.less';

// Any routes that start with 'dynamic' will be treated as non-static routes
addPrefetchExcludes(['dynamic'])

function App() {
  return (
    <Root>
      <Navigation />
      <div className="content">
        <div className="inner">
          <React.Suspense fallback={<em>Loading...</em>}>
            <Router>
              <Dynamic path="dynamic" />
              <Routes path="*" />
            </Router>
          </React.Suspense>
        </div>
      </div>
      <Footer />
    </Root>
  )
}

export default App
