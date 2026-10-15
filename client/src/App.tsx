import Header from './components/Header'
import { Routes, Route } from 'react-router'
import { Link } from 'react-router'
import { useState } from 'react'


import './App.css'
import HomePage from './pages/HomePage'
import ProductDetailPage from './pages/ProductDetailPage'
import CategoryPage from './pages/CategoryPage'

function App() {
  const [searchTerm, setSearchTerm] = useState('');


  return (
    <>
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <main className="container page-content">
        <Routes>
          <Route path='/' element={<HomePage searchTerm={searchTerm} />} />
          <Route path='/products/:productId' element={<ProductDetailPage />} />
          <Route path="/categories/:categoryId" element={<CategoryPage />} />
          <Route
            path="*"
            element={
              <section>
                <h2>Trang không tồn tại</h2>
                <Link to="/">Về trang chủ</Link>
              </section>
            }
          />
        </Routes>
      </main>


    </>

  )
}

export default App;