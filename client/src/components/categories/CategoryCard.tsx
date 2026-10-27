import type { CategoryCardData } from '../../types/category'
import { Link } from "react-router";
import './CategoryCard.css'

type CategoryCardProps = {
    category: CategoryCardData;
}
export default function CategoryCard({category }: CategoryCardProps) {
    return (
        <Link
            to={`/categories/${category.id}`}
            className="category-card"
        >
            {category.iconUrl ? (
                <img
                    className="category-icon"
                    src={category.iconUrl}
                    alt=""
                />
            ) : (
                <span className="category-icon category-icon-fallback">
                    {category.name.charAt(0)}
                </span>
            )}

            <span className="category-name">
                {category.name}
            </span>
        </Link>
    )
}