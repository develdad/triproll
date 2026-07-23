import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Globe2 } from 'lucide-react'
import { site } from '../data/site.js'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-deep/10 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-lagoon text-sand">
            <Globe2 size={20} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink">TripRoll</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {site.nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-lagoon' : 'text-body hover:text-ink'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/quiz"
            className="rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-sand transition hover:bg-deep"
          >
            Find your Travel DNA
          </Link>
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-deep/10 bg-sand px-4 pb-5 pt-3 md:hidden">
          {site.nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-base font-medium text-body"
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/quiz"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-full bg-lagoon px-5 py-3 text-center text-sm font-semibold text-sand"
          >
            Find your Travel DNA
          </Link>
        </nav>
      )}
    </header>
  )
}
