export default function Header(){
    return(
        <header className="site-header">
            <div className="container header-content">
                <h1 className="site-name">Sàn thương mại điện tử MiQ</h1>

                <input
                className="search-input"
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                aria-label="Tìm kiếm sản phẩm"></input>
            </div>
        </header>
    );
}