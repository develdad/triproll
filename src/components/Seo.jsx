import { useEffect } from 'react'
import { site } from '../data/site.js'

export default function Seo({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} · ${site.name}` : `${site.name} · ${site.tagline}`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description || site.description)
  }, [title, description])
  return null
}
