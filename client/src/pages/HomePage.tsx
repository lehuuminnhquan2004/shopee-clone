import CategorySection from '../components/categories/CategorySection'
import ProductSection from '../components/products/ProductSection'

type HomePageProps = {
  searchTerm: string;
}

export default function HomePage({ searchTerm }: HomePageProps) {
  return (
    <>
      <CategorySection />

      <ProductSection searchTerm={searchTerm} />
    </>

  )
}
