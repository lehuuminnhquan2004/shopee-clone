import { useState, useEffect} from 'react'
import { products } from '../data/products'
import ProductCard  from '../components/ProductCard'
import '../App.css'

type Category={
  id:number,
  name:string,
}
type HomePageProps={
  searchTerm: string;
}

export default function HomePage({searchTerm}:HomePageProps){

  const[categories,setCategories]=useState<Category[]>([]);
  const [errCategories, setErrCategories]=useState<string|null>(null);
  const [loadingCategories, setLoadingCategories]=useState(true);

  const keyword=searchTerm.trim().toLowerCase();
  const filteredProducts=products.filter((product)=>product.name.trim().toLowerCase().includes(keyword));

  useEffect(()=>{
    let ignore:boolean=false;
    async function fetchCategories() {
      try{
        const response2=await fetch(`http://localhost:3000/api/categories`);
        if(!response2.ok){
          throw new Error(`Khong lay duoc res status=${response2.status}`);
        }
        const data: Category[]=await response2.json();
        if(!ignore){
          setCategories(data);
        }
      }catch(err){
        if(!ignore){
          console.error(err);
          setErrCategories(
            err instanceof Error ? err.message :`Lỗi không xác định`,
          );
        }
      }finally{
        if(!ignore){
          setLoadingCategories(false);
        }
      }  
    }

    fetchCategories();

    return()=>{
      ignore=true;
    };

  },[])

  return (
    <>
      <section>
        <h2>DANH MUC SAN PHAM</h2>
          {loadingCategories&&<p>Loading...</p>}
          {!loadingCategories && errCategories &&<p role="alert">{errCategories}</p>}
          {!loadingCategories && !errCategories && categories.length==0 &&<p>Danh muc dang rỗng</p>}
          {!loadingCategories && !errCategories && categories.length>0 &&(
            <div>
              <ul>
                {
                categories.map((category)=>(
                  <li key={category.id}>ID: {category.id} Name: {category.name}</li>
                ))
                }
              </ul>
            </div>
        )}
      </section>

      <section>
        {filteredProducts.length===0 ? (
          <p>Không tìm thấy sản phẩm</p>
        ):(
          <>
            <p>Tìm thấy{filteredProducts.length} sản phẩm</p>
            <div className="product-grid">
              {filteredProducts.map((product)=>{
                return(
                  <ProductCard key={product.id} product={product}/>
                )
            })}
            </div>
          </>
        )}
        
      </section>
    </>
    
  )
}