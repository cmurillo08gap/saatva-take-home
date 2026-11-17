import Link from 'next/link'
import { HeaderCart } from '@/components/HeaderCart'

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__logo" href="/">
          saatva
        </Link>
        <HeaderCart />
      </div>
    </header>
  )
}
