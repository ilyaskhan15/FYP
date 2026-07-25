import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  await db.product.update({ where: { slug: 'wireless-nc-headphones' }, data: { images: '["/products/headphones.png","https://picsum.photos/seed/wireless-nc-headphones-2/800/800","https://picsum.photos/seed/wireless-nc-headphones-3/800/800","https://picsum.photos/seed/wireless-nc-headphones-4/800/800"]' }})
  await db.product.update({ where: { slug: 'vitamin-c-serum' }, data: { images: '["/products/serum.png","https://picsum.photos/seed/vitamin-c-serum-2/800/800","https://picsum.photos/seed/vitamin-c-serum-3/800/800","https://picsum.photos/seed/vitamin-c-serum-4/800/800"]' }})
  await db.product.update({ where: { slug: 'massage-gun-pro' }, data: { images: '["/products/massage-gun.png","https://picsum.photos/seed/massage-gun-pro-2/800/800","https://picsum.photos/seed/massage-gun-pro-3/800/800","https://picsum.photos/seed/massage-gun-pro-4/800/800"]' }})
  console.log('Done - updated 3 products with real AI images')
}
main().catch(console.error)