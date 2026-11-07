import { useEffect, useState } from 'react';
import { CartIcon } from './cart/CartIcon';
import './Header.css'
import { UserMenu } from './HeaderAuth/UserMenu';
import { getCartItems } from '../api/cartApi';
import { useAuth } from '../auth/AuthContext';
import { Link, useLocation } from 'react-router';


type HeaderProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}



export default function Header({
    searchTerm,
    onSearchChange,
}: HeaderProps) {
    const { session } = useAuth();
    const userId = session?.user.id;

    const { pathname } = useLocation()
    const isCartPage = pathname.startsWith('/cart')

    // Ghi nhớ số lượng này thuộc tài khoản nào.
    const [cartCount, setCartCount] = useState<{
        userId: string;
        count: number;
    } | null>(null);

    // Đăng xuất hoặc đổi tài khoản thì không hiện số của người cũ.
    const countCart =
        userId && cartCount?.userId === userId
            ? cartCount.count
            : 0;

    useEffect(() => {
        // Chưa đăng nhập thì không gọi API giỏ hàng.
        if (!userId) return;

        let ignore = false;
        let latestRequest = 0;

        async function loadCountCart() {
            if (!userId) return;
            const requestId = ++latestRequest;

            try {
                const data = await getCartItems();

                // Chỉ nhận kết quả mới nhất của tài khoản hiện tại.
                if (ignore || requestId !== latestRequest) return;

                setCartCount({
                    userId,
                    count: data.summary.itemCount,
                });
            } catch (error) {
                if (ignore || requestId !== latestRequest) return;

                console.error("Không thể tải số lượng giỏ hàng:", error);
            }
        }

        function handleCartUpdated() {
            void loadCountCart();
        }

        // Lắng nghe thông báo từ nút thêm giỏ hàng.
        window.addEventListener("cart-updated", handleCartUpdated);

        // Tải lần đầu khi đăng nhập hoặc mở trang.
        void loadCountCart();

        return () => {
            ignore = true;
            window.removeEventListener(
                "cart-updated",
                handleCartUpdated,
            );
        };
    }, [userId]);
    return (
        <header className="site-header">
            <UserMenu />
            <div className="container header-content">
                <h1 className="site-name"><Link to='/'>MiQ</Link></h1>
                {isCartPage && <h1 className='name-page'>| Giỏ hàng</h1>}
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