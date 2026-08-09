import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const categories = [
  { name: 'Electronics', slug: 'electronics', description: 'Latest gadgets and tech essentials' },
  { name: 'Clothing & Apparel', slug: 'clothing', description: 'Fashion for every occasion' },
  { name: 'Home & Garden', slug: 'home-garden', description: 'Transform your living space' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Gear up for adventure' },
  { name: 'Beauty & Health', slug: 'beauty-health', description: 'Look and feel your best' },
  { name: 'Books & Media', slug: 'books-media', description: 'Knowledge and entertainment' },
  { name: 'Toys & Games', slug: 'toys-games', description: 'Fun for all ages' },
  { name: 'Automotive', slug: 'automotive', description: 'Parts, accessories & tools' },
]

const products = [
  // Electronics (8)
  { name: 'Wireless Noise-Cancelling Headphones', slug: 'wireless-nc-headphones', categoryId: 1, price: 249.99, compareAtPrice: 349.99, brand: 'SoundTech', stock: 45, isFeatured: true, isNew: true, tags: 'audio,headphones,wireless' },
  { name: '4K Ultra HD Smart TV 55"', slug: '4k-smart-tv-55', categoryId: 1, price: 599.99, compareAtPrice: 799.99, brand: 'VisionPro', stock: 20, isFeatured: true, isNew: false, tags: 'tv,electronics,smart' },
  { name: 'MacBook Pro 16" M3', slug: 'macbook-pro-16-m3', categoryId: 1, price: 2399.00, compareAtPrice: null, brand: 'Apple', stock: 15, isFeatured: true, isNew: true, tags: 'laptop,computer,apple' },
  { name: 'Wireless Charging Pad', slug: 'wireless-charging-pad', categoryId: 1, price: 29.99, compareAtPrice: 49.99, brand: 'ChargeMax', stock: 200, isFeatured: false, isNew: false, tags: 'charger,accessories' },
  { name: 'Smart Home Speaker', slug: 'smart-home-speaker', categoryId: 1, price: 129.99, compareAtPrice: 179.99, brand: 'EchoSound', stock: 60, isFeatured: true, isNew: false, tags: 'speaker,smart-home' },
  { name: 'Mechanical Gaming Keyboard', slug: 'mechanical-gaming-keyboard', categoryId: 1, price: 159.99, compareAtPrice: 199.99, brand: 'KeyCraft', stock: 35, isFeatured: false, isNew: true, tags: 'keyboard,gaming,pc' },
  { name: 'Portable Bluetooth Speaker', slug: 'portable-bluetooth-speaker', categoryId: 1, price: 79.99, compareAtPrice: 99.99, brand: 'BoomBox', stock: 80, isFeatured: false, isNew: false, tags: 'speaker,bluetooth,portable' },
  { name: 'USB-C Hub 7-in-1', slug: 'usb-c-hub-7in1', categoryId: 1, price: 44.99, compareAtPrice: 59.99, brand: 'ConnectAll', stock: 120, isFeatured: false, isNew: false, tags: 'hub,usb-c,accessories' },

  // Clothing & Apparel (8)
  { name: 'Classic Fit Oxford Shirt', slug: 'classic-oxford-shirt', categoryId: 2, price: 69.99, compareAtPrice: 89.99, brand: 'UrbanStyle', stock: 100, isFeatured: false, isNew: true, tags: 'shirt,men,casual' },
  { name: 'Premium Denim Jacket', slug: 'premium-denim-jacket', categoryId: 2, price: 129.99, compareAtPrice: 169.99, brand: 'DenimCo', stock: 40, isFeatured: true, isNew: false, tags: 'jacket,denim,outerwear' },
  { name: 'Running Sneakers Pro', slug: 'running-sneakers-pro', categoryId: 2, price: 139.99, compareAtPrice: 179.99, brand: 'StrideFit', stock: 75, isFeatured: true, isNew: true, tags: 'sneakers,shoes,running' },
  { name: 'Cashmere Blend Sweater', slug: 'cashmere-blend-sweater', categoryId: 2, price: 189.99, compareAtPrice: 249.99, brand: 'LuxWear', stock: 30, isFeatured: false, isNew: true, tags: 'sweater,cashmere,winter' },
  { name: 'Slim Fit Chinos', slug: 'slim-fit-chinos', categoryId: 2, price: 59.99, compareAtPrice: null, brand: 'UrbanStyle', stock: 90, isFeatured: false, isNew: false, tags: 'pants,chinos,casual' },
  { name: 'Leather Belt - Italian', slug: 'italian-leather-belt', categoryId: 2, price: 49.99, compareAtPrice: 69.99, brand: 'CraftedGoods', stock: 60, isFeatured: false, isNew: false, tags: 'belt,leather,accessories' },
  { name: 'Athletic Performance Shorts', slug: 'athletic-performance-shorts', categoryId: 2, price: 39.99, compareAtPrice: null, brand: 'StrideFit', stock: 150, isFeatured: false, isNew: false, tags: 'shorts,athletic,sports' },
  { name: 'Wool Blend Overcoat', slug: 'wool-blend-overcoat', categoryId: 2, price: 299.99, compareAtPrice: 399.99, brand: 'LuxWear', stock: 20, isFeatured: true, isNew: false, tags: 'coat,overcoat,winter' },

  // Home & Garden (7)
  { name: 'Ceramic Planter Set of 3', slug: 'ceramic-planter-set', categoryId: 3, price: 49.99, compareAtPrice: 69.99, brand: 'GreenHome', stock: 55, isFeatured: false, isNew: true, tags: 'planter,garden,ceramic' },
  { name: 'Linen Throw Blanket', slug: 'linen-throw-blanket', categoryId: 3, price: 79.99, compareAtPrice: null, brand: 'CozyNest', stock: 40, isFeatured: true, isNew: false, tags: 'blanket,linen,home' },
  { name: 'Smart LED Desk Lamp', slug: 'smart-led-desk-lamp', categoryId: 3, price: 64.99, compareAtPrice: 89.99, brand: 'BrightIdea', stock: 70, isFeatured: false, isNew: false, tags: 'lamp,led,smart' },
  { name: 'Bamboo Cutting Board Set', slug: 'bamboo-cutting-board-set', categoryId: 3, price: 34.99, compareAtPrice: 44.99, brand: 'KitchenCraft', stock: 85, isFeatured: false, isNew: false, tags: 'cutting-board,kitchen,bamboo' },
  { name: 'Scented Candle Collection', slug: 'scented-candle-collection', categoryId: 3, price: 39.99, compareAtPrice: null, brand: 'AromaLux', stock: 100, isFeatured: false, isNew: true, tags: 'candle,home,fragrance' },
  { name: 'Stainless Steel Cookware Set', slug: 'steel-cookware-set', categoryId: 3, price: 299.99, compareAtPrice: 449.99, brand: 'ChefPro', stock: 15, isFeatured: true, isNew: false, tags: 'cookware,kitchen,stainless' },
  { name: 'Indoor Herb Garden Kit', slug: 'indoor-herb-garden-kit', categoryId: 3, price: 54.99, compareAtPrice: 74.99, brand: 'GreenHome', stock: 45, isFeatured: false, isNew: true, tags: 'garden,herb,indoor' },

  // Sports & Outdoors (7)
  { name: 'Carbon Fiber Road Bike', slug: 'carbon-fiber-road-bike', categoryId: 4, price: 1899.99, compareAtPrice: 2499.99, brand: 'SpeedRide', stock: 8, isFeatured: true, isNew: true, tags: 'bike,cycling,outdoor' },
  { name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', categoryId: 4, price: 49.99, compareAtPrice: 69.99, brand: 'ZenFlex', stock: 120, isFeatured: false, isNew: false, tags: 'yoga,fitness,mat' },
  { name: 'Insulated Water Bottle 32oz', slug: 'insulated-water-bottle', categoryId: 4, price: 29.99, compareAtPrice: null, brand: 'HydroMax', stock: 200, isFeatured: false, isNew: false, tags: 'bottle,water,hydration' },
  { name: 'Camping Tent 4-Person', slug: 'camping-tent-4-person', categoryId: 4, price: 249.99, compareAtPrice: 329.99, brand: 'WildCamp', stock: 25, isFeatured: true, isNew: false, tags: 'tent,camping,outdoor' },
  { name: 'Resistance Bands Set', slug: 'resistance-bands-set', categoryId: 4, price: 24.99, compareAtPrice: 39.99, brand: 'FitGear', stock: 180, isFeatured: false, isNew: false, tags: 'resistance,bands,fitness' },
  { name: 'Trail Running Shoes', slug: 'trail-running-shoes', categoryId: 4, price: 159.99, compareAtPrice: 199.99, brand: 'TrailBlazer', stock: 50, isFeatured: false, isNew: true, tags: 'shoes,running,trail' },
  { name: 'Adjustable Dumbbell Set', slug: 'adjustable-dumbbell-set', categoryId: 4, price: 349.99, compareAtPrice: 499.99, brand: 'IronFlex', stock: 20, isFeatured: true, isNew: false, tags: 'dumbbell,weights,fitness' },

  // Beauty & Health (7)
  { name: 'Vitamin C Serum', slug: 'vitamin-c-serum', categoryId: 5, price: 34.99, compareAtPrice: 49.99, brand: 'GlowSkin', stock: 150, isFeatured: true, isNew: true, tags: 'serum,skincare,vitamin' },
  { name: 'Hair Dryer Professional', slug: 'hair-dryer-professional', categoryId: 5, price: 129.99, compareAtPrice: 179.99, brand: 'StylePro', stock: 40, isFeatured: false, isNew: false, tags: 'hair-dryer,beauty,styling' },
  { name: 'Electric Toothbrush', slug: 'electric-toothbrush', categoryId: 5, price: 89.99, compareAtPrice: 119.99, brand: 'DentaCare', stock: 65, isFeatured: false, isNew: true, tags: 'toothbrush,electric,health' },
  { name: 'Natural Sunscreen SPF 50', slug: 'natural-sunscreen-spf50', categoryId: 5, price: 24.99, compareAtPrice: null, brand: 'SunShield', stock: 200, isFeatured: false, isNew: false, tags: 'sunscreen,skincare,natural' },
  { name: 'Essential Oils Gift Set', slug: 'essential-oils-gift-set', categoryId: 5, price: 44.99, compareAtPrice: 59.99, brand: 'PureAroma', stock: 55, isFeatured: false, isNew: true, tags: 'essential-oils,aromatherapy,gift' },
  { name: 'Massage Gun Pro', slug: 'massage-gun-pro', categoryId: 5, price: 199.99, compareAtPrice: 279.99, brand: 'RelaxMax', stock: 30, isFeatured: true, isNew: false, tags: 'massage,fitness,recovery' },
  { name: 'Organic Green Tea Collection', slug: 'organic-green-tea-collection', categoryId: 5, price: 19.99, compareAtPrice: null, brand: 'TeaLeaf', stock: 100, isFeatured: false, isNew: false, tags: 'tea,organic,health' },

  // Books & Media (5)
  { name: 'The Art of Programming', slug: 'art-of-programming', categoryId: 6, price: 44.99, compareAtPrice: 59.99, brand: 'TechBooks', stock: 80, isFeatured: false, isNew: true, tags: 'book,programming,tech' },
  { name: 'World Atlas - Collector\'s Edition', slug: 'world-atlas-collectors', categoryId: 6, price: 79.99, compareAtPrice: null, brand: 'GeoPress', stock: 25, isFeatured: false, isNew: false, tags: 'book,atlas,geography' },
  { name: 'Vinyl Record: Jazz Classics', slug: 'vinyl-jazz-classics', categoryId: 6, price: 34.99, compareAtPrice: null, brand: 'VinylCo', stock: 35, isFeatured: true, isNew: false, tags: 'vinyl,music,jazz' },
  { name: 'Photography Masterclass Guide', slug: 'photography-masterclass', categoryId: 6, price: 29.99, compareAtPrice: 39.99, brand: 'ShutterPress', stock: 60, isFeatured: false, isNew: false, tags: 'book,photography,art' },
  { name: 'Blueprint: Modern Architecture', slug: 'blueprint-modern-architecture', categoryId: 6, price: 54.99, compareAtPrice: 69.99, brand: 'DesignBooks', stock: 30, isFeatured: false, isNew: true, tags: 'book,architecture,design' },

  // Toys & Games (7)
  { name: 'Strategy Board Game Deluxe', slug: 'strategy-board-game-deluxe', categoryId: 7, price: 49.99, compareAtPrice: null, brand: 'GameNight', stock: 45, isFeatured: false, isNew: true, tags: 'board-game,strategy,family' },
  { name: 'Building Blocks Set 1000pc', slug: 'building-blocks-1000', categoryId: 7, price: 79.99, compareAtPrice: 99.99, brand: 'BuildIt', stock: 60, isFeatured: true, isNew: false, tags: 'blocks,building,kids' },
  { name: 'Remote Control Drone', slug: 'remote-control-drone', categoryId: 7, price: 149.99, compareAtPrice: 199.99, brand: 'SkyTech', stock: 25, isFeatured: true, isNew: true, tags: 'drone,rc,tech' },
  { name: 'Puzzle Collection 3-in-1', slug: 'puzzle-collection-3in1', categoryId: 7, price: 29.99, compareAtPrice: null, brand: 'PuzzleMaster', stock: 70, isFeatured: false, isNew: false, tags: 'puzzle,game,brain' },
  { name: 'Wooden Train Set', slug: 'wooden-train-set', categoryId: 7, price: 59.99, compareAtPrice: 79.99, brand: 'TinyTracks', stock: 40, isFeatured: false, isNew: false, tags: 'train,wooden,kids' },
  { name: 'Card Game - Trivia Night', slug: 'card-game-trivia-night', categoryId: 7, price: 19.99, compareAtPrice: null, brand: 'GameNight', stock: 90, isFeatured: false, isNew: false, tags: 'card-game,trivia,party' },
  { name: 'Plush Dinosaur Collection', slug: 'plush-dinosaur-collection', categoryId: 7, price: 34.99, compareAtPrice: null, brand: 'CuddleBuddies', stock: 55, isFeatured: false, isNew: true, tags: 'plush,dinosaur,kids' },

  // Automotive (7)
  { name: 'Dash Camera 4K', slug: 'dash-camera-4k', categoryId: 8, price: 129.99, compareAtPrice: 179.99, brand: 'DriveSafe', stock: 45, isFeatured: true, isNew: true, tags: 'dashcam,camera,car' },
  { name: 'Car Detailing Kit', slug: 'car-detailing-kit', categoryId: 8, price: 49.99, compareAtPrice: 69.99, brand: 'ShinePro', stock: 60, isFeatured: false, isNew: false, tags: 'car,detailing,cleaning' },
  { name: 'Portable Jump Starter', slug: 'portable-jump-starter', categoryId: 8, price: 89.99, compareAtPrice: 119.99, brand: 'PowerUp', stock: 35, isFeatured: false, isNew: true, tags: 'jump-starter,battery,car' },
  { name: 'Leather Seat Covers Set', slug: 'leather-seat-covers', categoryId: 8, price: 199.99, compareAtPrice: 279.99, brand: 'AutoLux', stock: 20, isFeatured: true, isNew: false, tags: 'seat-covers,leather,interior' },
  { name: 'Tire Pressure Monitoring System', slug: 'tire-pressure-monitor', categoryId: 8, price: 59.99, compareAtPrice: 79.99, brand: 'SafeDrive', stock: 50, isFeatured: false, isNew: false, tags: 'tpms,tires,safety' },
  { name: 'LED Headlight Bulbs Kit', slug: 'led-headlight-bulbs', categoryId: 8, price: 44.99, compareAtPrice: null, brand: 'BrightDrive', stock: 80, isFeatured: false, isNew: true, tags: 'headlights,led,car' },
  { name: 'Trunk Organizer', slug: 'trunk-organizer', categoryId: 8, price: 29.99, compareAtPrice: 39.99, brand: 'NeatCar', stock: 100, isFeatured: false, isNew: false, tags: 'organizer,trunk,accessories' },
]

// Generate random ratings and review counts
function generateRating(): { rating: number; reviewCount: number } {
  const rating = Math.round((3.5 + Math.random() * 1.5) * 10) / 10
  const reviewCount = Math.floor(Math.random() * 150) + 5
  return { rating: Math.min(5, rating), reviewCount }
}

// Generate image URLs using picsum
function generateImages(name: string): string {
  const seed = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const images = [
    `https://picsum.photos/seed/${seed}-1/800/800`,
    `https://picsum.photos/seed/${seed}-2/800/800`,
    `https://picsum.photos/seed/${seed}-3/800/800`,
    `https://picsum.photos/seed/${seed}-4/800/800`,
  ]
  return JSON.stringify(images)
}

async function main() {
  console.log('🌱 Seeding database...')

  // Create categories
  for (const cat of categories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: {
        ...cat,
        image: `https://picsum.photos/seed/${cat.slug}/400/300`,
      },
    })
  }
  console.log(`✅ Created ${categories.length} categories`)

  // Create products
  let count = 0
  const categoryMap: Record<number, string> = {}
  const allCats = await db.category.findMany()
  for (const c of allCats) {
    const idx = categories.findIndex(cat => cat.slug === c.slug)
    if (idx > -1) categoryMap[idx + 1] = c.id
  }

  for (const p of products) {
    const { rating, reviewCount } = generateRating()
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: `Premium ${p.name.toLowerCase()} by ${p.brand}. Crafted with the highest quality materials for exceptional performance and durability.`,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        brand: p.brand,
        tags: p.tags,
        rating,
        reviewCount,
        soldCount: Math.floor(Math.random() * 300) + 10,
        categoryId: categoryMap[p.categoryId],
        images: generateImages(p.name),
        sku: `SKU-${p.slug.toUpperCase().replace(/-/g, '').slice(0, 10)}`,
      },
    })
    count++
  }
  console.log(`✅ Created ${count} products`)

  // Create some variants for featured products
  const featuredProducts = await db.product.findMany({
    where: { isFeatured: true },
    take: 10,
  })

  const colorOptions = ['Black', 'White', 'Navy', 'Red', 'Green', 'Silver']
  const sizeOptions = ['S', 'M', 'L', 'XL', 'One Size']

  for (const product of featuredProducts) {
    const colors = colorOptions.slice(0, Math.floor(Math.random() * 3) + 2)
    const sizes = sizeOptions.slice(0, Math.floor(Math.random() * 3) + 2)

    for (const color of colors) {
      for (const size of sizes) {
        const stock = Math.floor(Math.random() * 20) + 5
        await db.productVariant.create({
          data: {
            name: `${color} / ${size}`,
            sku: `${product.sku}-${color[0]}${size}`,
            stock,
            price: null,
            attributes: JSON.stringify({ color, size }),
            productId: product.id,
          },
        })
      }
    }
  }
  console.log('✅ Created product variants')

  // Create reviews
  const reviewers = await Promise.all([
    db.user.create({ data: { email: 'reviewer1@demo.com', name: 'Alex Johnson', role: 'customer' } }),
    db.user.create({ data: { email: 'reviewer2@demo.com', name: 'Sarah Miller', role: 'customer' } }),
    db.user.create({ data: { email: 'reviewer3@demo.com', name: 'Mike Chen', role: 'customer' } }),
  ])
  const allProducts = await db.product.findMany({ take: 20 })
  const reviewTitles = ['Excellent quality!', 'Great value for money', 'Exceeded expectations', 'Good but could be better', 'Perfect gift!', 'Highly recommend', 'Amazing product', 'Decent quality']
  const reviewComments = [
    'Really impressed with the build quality. Would definitely buy again.',
    'Fast shipping and the product matches the description perfectly.',
    'Good value for the price. Minor improvements could be made.',
    'Bought this as a gift and they loved it!',
    'Solid product. Works exactly as advertised.',
    'The quality surprised me at this price point. Very happy.',
  ]

  let reviewCount = 0
  for (let pi = 0; pi < allProducts.length; pi++) {
    const product = allProducts[pi]
    const numReviews = Math.min(Math.floor(Math.random() * 3) + 1, 3)
    for (let i = 0; i < numReviews; i++) {
      const reviewer = reviewers[i % reviewers.length]
      try {
        await db.review.create({
          data: {
            userId: reviewer.id,
            productId: product.id,
            rating: Math.floor(Math.random() * 2) + 4,
            title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
            comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
            status: 'approved',
          },
        })
        reviewCount++
      } catch { /* skip duplicate */ }
    }
  }
  console.log(`✅ Created ${reviewCount} reviews`)

  // Create coupons
  const coupons = [
    { code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 0, maxUses: 100 },
    { code: 'SAVE20', type: 'fixed', value: 20, minOrderAmount: 100, maxUses: 50 },
    { code: 'FREESHIP', type: 'free_shipping', value: 0, minOrderAmount: 50, maxUses: 200 },
    { code: 'SUMMER25', type: 'percentage', value: 25, minOrderAmount: 150, maxUses: 30 },
    { code: 'FLASH50', type: 'fixed', value: 50, minOrderAmount: 200, maxUses: 15 },
  ]

  for (const c of coupons) {
    await db.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    })
  }
  console.log(`✅ Created ${coupons.length} coupons`)

  // Create admin user
  await db.user.upsert({
    where: { email: 'admin@store.com' },
    update: {},
    create: {
      email: 'admin@store.com',
      name: 'Store Admin',
      role: 'admin',
      password: 'admin123',
    },
  })
  console.log('✅ Created admin user (admin@store.com)')

  // Create demo customer
  await db.user.upsert({
    where: { email: 'demo@store.com' },
    update: {},
    create: {
      email: 'demo@store.com',
      name: 'Demo Customer',
      role: 'customer',
      password: 'demo123',
    },
  })
  console.log('✅ Created demo user (demo@store.com)')

  // Create demo seller user with approved profile
  const sellerUser = await db.user.upsert({
    where: { email: 'seller@store.com' },
    update: {},
    create: {
      email: 'seller@store.com',
      name: 'John Seller',
      role: 'seller',
      password: 'seller123',
    },
  })

  const sellerProfile = await db.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      storeName: 'TechGear Pro',
      storeSlug: 'techgear-pro',
      description: 'Premium tech accessories and gadgets for the modern lifestyle.',
      isApproved: true,
      commission: 10,
    },
  })
  console.log('✅ Created seller user (seller@store.com)')

  // Assign some existing products to the seller
  const sellerProductSlugs = ['wireless-nc-headphones', 'wireless-charging-pad', 'mechanical-gaming-keyboard', 'usb-c-hub-7in1', 'portable-bluetooth-speaker']
  for (const slug of sellerProductSlugs) {
    await db.product.update({ where: { slug }, data: { sellerId: sellerProfile.id } }).catch(() => {})
  }
  console.log(`✅ Assigned ${sellerProductSlugs.length} products to seller`)

  console.log('\n🎉 Seeding complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
