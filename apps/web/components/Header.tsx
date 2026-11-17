import { HeaderCart } from '@/components/HeaderCart'

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <span className="site-header__logo">saatva</span>
        <HeaderCart />
      </div>
    </header>
  )
}
