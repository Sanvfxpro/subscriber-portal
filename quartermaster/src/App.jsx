
import React from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import Hero from './components/Hero';
import CapabilitiesGrid from './components/CapabilitiesGrid';
import Footer from './components/Footer';

function App() {
  return (
    <Layout>
      <Header />
      <Hero />
      <CapabilitiesGrid />
      <Footer />
    </Layout>
  );
}

export default App;
