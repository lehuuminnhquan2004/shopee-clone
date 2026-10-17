import CategorySection from '../components/CategorySection'
import ProductSection from '../components/ProductSection'

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
