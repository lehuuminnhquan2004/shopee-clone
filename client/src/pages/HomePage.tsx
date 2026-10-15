import { useState, useEffect } from 'react'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import { Link } from 'react-router'
import '../App.css'
import CategoryCard from '../components/CategoryCard'

type Category = {
  id: string,
  name: string,
  iconUrl: string,
}
type HomePageProps = {
  searchTerm: string;
}

export default function HomePage({ searchTerm }: HomePageProps) {

  const [categories, setCategories] = useState<Category[]>([]);
  const [errCategories, setErrCategories] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);



  const [retryCount, setRetryCount] = useState(0);

  const keyword = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((product) => product.name.trim().toLowerCase().includes(keyword));

  useEffect(() => {
    let ignore: boolean = false;
    async function fetchCategories() {
      setLoadingCategories(true);
      setErrCategories(null);
      try {
        const response = await fetch(`http://localhost:3000/api/categories`);
        if (!response.ok) {
          throw new Error(`Khong lay duoc res status=${response.status}`);
        }
        const data: Category[] = await response.json();
        if (!ignore) {
          setCategories(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setErrCategories(
            err instanceof Error ? err.message : `Lỗi không xác định`,
          );
        }
      } finally {
        if (!ignore) {
          setLoadingCategories(false);
        }
      }
    }

    fetchCategories();

    return () => {
      ignore = true;
    };

  }, [retryCount])

  return (
    <>
      {/* Hien thi danh muc cha */}
      <section className="category-section">
        <h2 className="category-section-title">DANH MỤC</h2>

        <div className="category-section-content">
          {loadingCategories && <p>Đang tải danh mục...</p>}
          {!loadingCategories && errCategories && (
            <div>
              <p role="alert">{errCategories}</p>
              <button
                type="button"
                onClick={() =>
                  setRetryCount((previousCount) => previousCount + 1)
                }
              >
                Thử lại
              </button>
            </div>
          )}

          {!loadingCategories && !errCategories && categories.length === 0 && (<p>Danh mục đang trống</p>)}

          {!loadingCategories && !errCategories && categories.length > 0 && (
            <div className="category-grid-wrapper">
              <div className="category-grid">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        {filteredProducts.length === 0 ? (
          <p>Không tìm thấy sản phẩm</p>
        ) : (
          <>
            <p>Tìm thấy {filteredProducts.length} sản phẩm</p>
            <div className="product-grid">
              {filteredProducts.map((product) => {
                return (
                  <ProductCard key={product.id} product={product} />
                )
              })}
            </div>
          </>
        )}

      </section>
    </>

  )
}