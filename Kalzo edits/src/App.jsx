import { useState } from 'react'
import './App.css'
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

const Home = lazy(() => import("./pages/HomePage"));

function App() {

  return (
    <>
      <Routes>
          <Route path="/" element={<Home/>} />
      </Routes>
    </>
  )
}

export default App
