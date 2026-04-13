import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/enterprise', '/api/'],
    },
    sitemap: 'https://bencao.town/sitemap.xml',
  }
}
