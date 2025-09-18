import { type NextRequest, NextResponse } from "next/server"

function generateHashtagsFromDescription(productName: string, description: string): string[] {
  const text = `${productName} ${description}`.toLowerCase()
  const hashtags = new Set<string>()

  // Product-specific hashtags
  if (productName) {
    const cleanProductName = productName.replace(/\s+/g, "").toLowerCase()
    hashtags.add(`#${cleanProductName}`)
    // Add brand-style hashtag if product name has multiple words
    if (productName.includes(" ")) {
      hashtags.add(`#${productName.replace(/\s+/g, "")}`)
    }
  }

  if (text.includes("beauty") || text.includes("makeup") || text.includes("cosmetic") || text.includes("skincare")) {
    hashtags.add("#beauty")
    hashtags.add("#makeup")
    hashtags.add("#cosmetics")
    hashtags.add("#skincare")
    hashtags.add("#beautyproduct")
    hashtags.add("#glowup")
    hashtags.add("#selfcare")
    hashtags.add("#beautytips")
    hashtags.add("#makeupaddict")
  }

  if (text.includes("fashion") || text.includes("clothing") || text.includes("style") || text.includes("outfit")) {
    hashtags.add("#fashion")
    hashtags.add("#style")
    hashtags.add("#ootd")
    hashtags.add("#fashionista")
    hashtags.add("#trendy")
    hashtags.add("#styleinspo")
    hashtags.add("#outfitoftheday")
    hashtags.add("#fashionblogger")
  }

  if (text.includes("fitness") || text.includes("workout") || text.includes("health") || text.includes("gym")) {
    hashtags.add("#fitness")
    hashtags.add("#workout")
    hashtags.add("#health")
    hashtags.add("#fitlife")
    hashtags.add("#wellness")
    hashtags.add("#gymlife")
    hashtags.add("#healthylifestyle")
    hashtags.add("#fitnessjourney")
  }

  if (text.includes("food") || text.includes("recipe") || text.includes("cooking") || text.includes("nutrition")) {
    hashtags.add("#food")
    hashtags.add("#foodie")
    hashtags.add("#recipe")
    hashtags.add("#cooking")
    hashtags.add("#delicious")
    hashtags.add("#foodstagram")
    hashtags.add("#yummy")
    hashtags.add("#healthyfood")
  }

  if (text.includes("tech") || text.includes("gadget") || text.includes("electronic") || text.includes("digital")) {
    hashtags.add("#tech")
    hashtags.add("#gadget")
    hashtags.add("#technology")
    hashtags.add("#innovation")
    hashtags.add("#techreview")
    hashtags.add("#digital")
    hashtags.add("#techy")
    hashtags.add("#gadgetlover")
  }

  if (text.includes("home") || text.includes("decor") || text.includes("interior") || text.includes("design")) {
    hashtags.add("#home")
    hashtags.add("#homedecor")
    hashtags.add("#interior")
    hashtags.add("#homedesign")
    hashtags.add("#decor")
    hashtags.add("#homedecoration")
    hashtags.add("#interiordesign")
    hashtags.add("#homestyling")
  }

  if (text.includes("organic") || text.includes("natural")) {
    hashtags.add("#organic")
    hashtags.add("#natural")
    hashtags.add("#ecofriendly")
  }

  if (text.includes("luxury") || text.includes("premium")) {
    hashtags.add("#luxury")
    hashtags.add("#premium")
    hashtags.add("#highend")
  }

  if (text.includes("handmade") || text.includes("artisan")) {
    hashtags.add("#handmade")
    hashtags.add("#artisan")
    hashtags.add("#crafted")
  }

  hashtags.add("#lifestyle")
  hashtags.add("#instagood")
  hashtags.add("#photooftheday")
  hashtags.add("#love")
  hashtags.add("#instadaily")
  hashtags.add("#trending")
  hashtags.add("#viral")
  hashtags.add("#explore")
  hashtags.add("#discover")
  hashtags.add("#influencer")

  // Convert to array and limit to 20 hashtags for better variety
  return Array.from(hashtags).slice(0, 20)
}

function getTrendingHashtags(category?: string): string[] {
  const trendingByCategory = {
    beauty: ["#glowup", "#skincareroutine", "#makeuptutorial", "#beautyhacks", "#selfcaresunday"],
    fashion: ["#styleinspo", "#fashionweek", "#sustainablefashion", "#vintagevibes", "#streetstyle"],
    fitness: ["#fitnessjourney", "#workoutmotivation", "#healthylifestyle", "#gymlife", "#wellness"],
    food: ["#foodstagram", "#healthyeating", "#recipeshare", "#foodphotography", "#plantbased"],
    tech: ["#innovation", "#futuretech", "#digitallife", "#smarttech", "#techtrends"],
    lifestyle: ["#mindfulness", "#productivity", "#selfimprovement", "#minimalism", "#positivevibes"],
  }

  return trendingByCategory[category as keyof typeof trendingByCategory] || trendingByCategory.lifestyle
}

export async function POST(request: NextRequest) {
  try {
    const { productName, productDescription } = await request.json()

    console.log(`[v0] Generating hashtags for: ${productName}`)

    // Generate hashtags based on product details
    let hashtags = generateHashtagsFromDescription(productName || "", productDescription || "")

    const text = `${productName} ${productDescription}`.toLowerCase()
    let category = "lifestyle"

    if (text.includes("beauty") || text.includes("makeup")) category = "beauty"
    else if (text.includes("fashion") || text.includes("style")) category = "fashion"
    else if (text.includes("fitness") || text.includes("health")) category = "fitness"
    else if (text.includes("food") || text.includes("recipe")) category = "food"
    else if (text.includes("tech") || text.includes("gadget")) category = "tech"

    const trendingTags = getTrendingHashtags(category)
    hashtags = [...new Set([...hashtags, ...trendingTags])].slice(0, 25)

    // Add processing delay to simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log(`[v0] Generated ${hashtags.length} hashtags for ${category} category`)

    return NextResponse.json({
      success: true,
      hashtags: hashtags,
      productName: productName,
      productDescription: productDescription,
      category: category,
      totalGenerated: hashtags.length,
    })
  } catch (error) {
    console.error("[v0] Error generating hashtags:", error)
    return NextResponse.json({ success: false, error: "Failed to generate hashtags" }, { status: 500 })
  }
}
