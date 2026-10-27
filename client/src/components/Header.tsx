import './Header.css'
import { UserMenu } from './HeaderAuth/UserMenu';


type HeaderProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}


export default function Header({
    searchTerm,
    onSearchChange,
}: HeaderProps) {
    return (
        <header className="site-header">
            <UserMenu/>
            <div className="container header-content">
                <h1 className="site-name">Sàn thương mại điện tử MiQ</h1>

                <input
                    className="search-input"
                    type="search"
                    placeholder="Tìm kiếm sản phẩm..."
                    aria-label="Tìm kiếm sản phẩm"
                    value={searchTerm}
                    onChange={(event) => onSearchChange(event.target.value)} />
            </div>
        </header>
    );
}