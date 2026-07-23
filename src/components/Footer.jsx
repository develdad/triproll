import { Link } from 'react-router-dom'
import { site } from '../data/site.js'

export default function Footer() {
  return (
    <footer className="border-t border-deep/10 bg-deep text-sand/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <img src="/logo-light.png" alt="TripRoll" width="2712" height="695" className="h-8 w-auto opacity-90" />
            <p className="mt-2 text-sm leading-relaxed">{site.tagline} Surprise travel built around your Travel DNA.</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            {site.nav.map((item) => (
              <Link key={item.href} to={item.href} className="hover:text-sand">{item.label}</Link>
            ))}
          </nav>
        </div>
        <p className="mt-10 border-t border-sand/10 pt-6 text-xs text-sand/50">
          © {new Date().getFullYear()} TripRoll. A venture under CKB Global LLC ·{' '}
          <a href="https://chrisblaser.me" className="underline hover:text-sand" target="_blank" rel="noreferrer">chrisblaser.me</a>
        </p>
      </div>
    </footer>
  )
}
