import { useEffect, useState } from 'react';
import { CartIcon } from './cart/CartIcon';
import './Header.css'
import { UserMenu } from './HeaderAuth/UserMenu';
import { getCartItems } from '../api/cartApi';


type HeaderProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}


export default function Header({
    searchTerm,
    onSearchChange,
}: HeaderProps) {
    const [countCart, setCountCart] = useState(0);

    useEffect(() => {
        let ignore = false;

        async function loadCountCart() {
            try {
                const data = await getCartItems();
                if (!ignore) setCountCart(data.items.length);
            } catch (error) {
                console.error(error);
                if (!ignore) setCountCart(0);
            }
        }

        loadCountCart();

        return () => {
            ignore = true;
        };
    }, []);
    return (
        <header className="site-header">
            <UserMenu />
            <div className="container header-content">
                <h1 className="site-name">MiQ</h1>

                <input
                    className="search-input"
                    type="search"
                    placeholder="Tìm kiếm sản phẩm..."
                    aria-label="Tìm kiếm sản phẩm"
                    value={searchTerm}
                    onChange={(event) => onSearchChange(event.target.value)} />
                <CartIcon count={countCart} />
            </div>
        </header>
    );
}