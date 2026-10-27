import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import type { CategoryChild } from '../types/category';
import { getCategoryById, getCategoryChildren } from '../api/categoriesApi';
import { getApiErrorMessage } from '../lib/api';
import ProductSection from '../components/products/ProductSection';


export default function CategoryPage() {
  const{categoryId}=useParams();
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState<string|null>(null);
  const[children,setChildren]=useState<CategoryChild[]|[]>([]);
  const[parent,setParent]=useState<CategoryChild|null>(null);

  useEffect(()=>{
    let ignore=false;
    if(!categoryId)return;
    const id = categoryId;

    setLoading(true);
    setError(null);
    setChildren([]);
    setParent(null)

    async function loadCategory() {
        try{
            const [parentData, childrenData]=await Promise.all([
                getCategoryById(id),
                getCategoryChildren(id)
            ])
            if(!ignore){
                setParent(parentData)
                setChildren(childrenData)
            }
        }catch(error){
            if(!ignore){
                setError(getApiErrorMessage(error, 'Không lấy được danh mục'));
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
