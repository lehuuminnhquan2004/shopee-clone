import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import type { CategoryChild } from '../types/category';
import ProductSection from '../components/ProductSection';


export default function CategoryPage() {
  const{categoryId}=useParams();
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState<string|null>(null);
  const[children,setChildren]=useState<CategoryChild[]|[]>([]);
  const[parent,setParent]=useState<CategoryChild|null>(null);

  useEffect(()=>{
    let ignore=false;
    if(!categoryId)return;

    setLoading(true);
    setError(null);
    setChildren([]);
    setParent(null)

    async function loadCategory() {
        try{
            const [parentReponse,childrenReponse]=await Promise.all([
                fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories/${categoryId}`),
                fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories/${categoryId}/children`)
            ])
            if(!parentReponse.ok||!childrenReponse.ok){
                throw new Error('Không lấy được data danh mục');
            }
            const [parentData, childrenData]:[CategoryChild,CategoryChild[]]=await Promise.all([
                parentReponse.json(),
                childrenReponse.json()
            ])
            if(!ignore){
                setParent(parentData)
                setChildren(childrenData)
            }
        }catch(error){
            if(!ignore){
                setError(error instanceof Error?error.message:"Có lỗi sảy ra");
            }
        }finally{
            if(!ignore) setLoading(false);
        }  
    }
    loadCategory();
    return ()=>{
        ignore=true;
    }
  },[categoryId])

  return (
    <div>
        <aside>
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {!loading && !error && children.length===0 && (
                <p>Danh mục trống</p>
            )}
            {!loading && !error && parent && children.length>0 && (
                <ul>
                    <li key={parent.id}>{parent.name}</li>
                    {children.map((category)=>(
                        <li key={category.id}>{category.name}</li>
                    ))}
                </ul>
            )}
        </aside>
        <section>
            <ProductSection categoryId={categoryId}/>
        </section>
    </div>
  )
}