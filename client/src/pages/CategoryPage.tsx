import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import type { CategoryChild } from '../types/category';
import ProductSection from '../components/ProductSection';


export default function CategoryPage() {
  const{categoryId}=useParams();
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState<string|null>(null);
  const[children,setChildren]=useState<CategoryChild[]|[]>([]);

  useEffect(()=>{
    let ignore=false;
    if(!categoryId)return;

    setLoading(true);
    setError(null);
    setChildren([]);
    async function loadParent() {
        try{
            const reponse=await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories/${categoryId}`)
            if(!reponse.ok){
                throw new Error('Không lấy được data danh mục');
            }
            const data:CategoryChild[]=await reponse.json();
            if(!ignore)setChildren(data);
        }catch(error){
            if(!ignore){
                setError(error instanceof Error?error.message:"Có lỗi sảy ra");
            }
        }finally{
            if(!ignore) setLoading(false);
        }  
    }

    async function loadChildren() {
        try{
            const reponse=await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories/${categoryId}/children`)
            if(!reponse.ok){
                throw new Error('Không lấy được data danh mục');
            }
            const data:CategoryChild[]=await reponse.json();
            if(!ignore)setChildren(data);
        }catch(error){
            if(!ignore){
                setError(error instanceof Error?error.message:"Có lỗi sảy ra");
            }
        }finally{
            if(!ignore) setLoading(false);
        }  
    }
    loadChildren();
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
            {!loading && !error && children.length>0 && (
                <ul>
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