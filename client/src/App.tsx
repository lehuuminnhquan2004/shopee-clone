import Header from './components/Header'
import {Routes, Route} from 'react-router'
import { Link } from 'react-router'


import './App.css'
import HomePage from './pages/HomePage'
import ProductDetailPage from './pages/ProductDetailPage'

function App(){
  return(
    <>
      <Header/>

      <main className="container page-content">
        <Routes>
          <Route path='/' element={<HomePage/>}/>

          <Route path='/products/:productId' element={<ProductDetailPage/>}/>

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