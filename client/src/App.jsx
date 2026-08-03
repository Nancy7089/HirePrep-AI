import React from "react";
import { Route } from "react-router";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>

      <div className="App">
        <h1>HirePrep AI</h1>
      </div>
    </>
  );
}
export default App;