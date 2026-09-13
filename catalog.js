// DPG Drip and Gear — product catalog metadata.
// `defaultPrice` is the fallback price used only if no admin override exists yet
// for that product. Actual live prices are stored in data/prices.json and are
// edited from /admin.html.

const CATEGORIES = [
  { id: "polos", label: "Polo Shirts" },
  { id: "shirts", label: "Button-Down Shirts" },
  { id: "pullovers", label: "Half-Zip Pullovers" },
  { id: "watches", label: "Watches" },
  { id: "sneakers", label: "Sneakers" },
  { id: "pants", label: "Pants" },
  { id: "electronics", label: "Electronics" },
];

const PRODUCTS = [
  // ---------------- POLOS ----------------
  { id: "polo-01", category: "polos", name: "Sky Blue Colorblock Polo", desc: "Short-sleeve pique polo with navy shoulder panels and contrast trim.", defaultPrice: 15000, img: "polo-01.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-02", category: "polos", name: "Sunflower Classic Polo", desc: "Bright yellow short-sleeve polo, clean minimal front.", defaultPrice: 15000, img: "polo-02.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-03", category: "polos", name: "Crimson Colorblock Rugby", desc: "Long-sleeve rugby-style shirt, deep red with black chest band.", defaultPrice: 19000, img: "polo-03.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-04", category: "polos", name: "White Striped Crest Polo", desc: "White pique polo with navy/red stripe detail and chest crest.", defaultPrice: 16500, img: "polo-04.jpg", sizes: ["S","M","L","XL"] , isNew: true },
  { id: "polo-05", category: "polos", name: "Pale Yellow Colorblock Polo", desc: "Soft yellow short-sleeve polo with navy side panels.", defaultPrice: 15000, img: "polo-05.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-06", category: "polos", name: "Navy Colorblock Rugby", desc: "Long-sleeve rugby-style shirt, navy with white chest band.", defaultPrice: 19000, img: "polo-06.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-07", category: "polos", name: "Navy Yellow-Stripe Polo", desc: "Navy polo with yellow stripe yoke across the chest.", defaultPrice: 16000, img: "polo-07.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-08", category: "polos", name: "Black City Crest Polo", desc: "Black polo with embroidered crest and sleeve numbering.", defaultPrice: 17000, img: "polo-08.jpg", sizes: ["S","M","L","XL"] , featured: true },
  { id: "polo-09", category: "polos", name: "Navy Grey-Stripe Colorblock Polo", desc: "Navy and heather grey colorblock polo with vertical stripe panel.", defaultPrice: 16500, img: "polo-09.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-10", category: "polos", name: "Navy Burgundy-Stripe Polo", desc: "Navy polo with burgundy vertical stripe panel.", defaultPrice: 16500, img: "polo-10.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-11", category: "polos", name: "White Colorblock Polo", desc: "White polo with navy/red trim on collar and sleeves.", defaultPrice: 16500, img: "polo-11.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-12", category: "polos", name: "White Colorblock Rugby", desc: "Long-sleeve rugby-style shirt, white with navy chest band.", defaultPrice: 19000, img: "polo-12.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-13", category: "polos", name: "Burgundy City Crest Polo", desc: "Burgundy polo with embroidered crest and sleeve numbering.", defaultPrice: 17000, img: "polo-13.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-14", category: "polos", name: "Forest Green Stripe Colorblock Polo", desc: "Navy and forest green colorblock polo with vertical stripe panel.", defaultPrice: 16500, img: "polo-14.jpg", sizes: ["S","M","L","XL"] , isNew: true },
  { id: "polo-15", category: "polos", name: "Navy City Crest Polo", desc: "Navy polo with embroidered crest and sleeve numbering.", defaultPrice: 17000, img: "polo-15.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-16", category: "polos", name: "Navy Red-Trim Colorblock Polo", desc: "Navy polo with red side panel and contrast collar trim.", defaultPrice: 16000, img: "polo-16.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-17", category: "polos", name: "Navy Multi-Stripe Polo", desc: "Navy polo with burgundy/white vertical multi-stripe panel.", defaultPrice: 16500, img: "polo-17.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-18", category: "polos", name: "Forest Green City Crest Polo", desc: "Forest green polo with embroidered crest and sleeve numbering.", defaultPrice: 17000, img: "polo-18.jpg", sizes: ["S","M","L","XL"] },
  { id: "polo-19", category: "polos", name: "Red City Crest Polo", desc: "Red polo with embroidered crest and sleeve numbering.", defaultPrice: 17000, img: "polo-19.jpg", sizes: ["S","M","L","XL"] , featured: true },
  { id: "polo-20", category: "polos", name: "Navy Yellow-Stripe Polo II", desc: "Navy polo, yellow stripe yoke, alternate cut.", defaultPrice: 16000, img: "polo-20.jpg", sizes: ["S","M","L","XL"] },

  // ---------------- BUTTON-DOWN SHIRTS ----------------
  { id: "shirt-01", category: "shirts", name: "Sky Blue Varsity-Stripe Shirt", desc: "Long-sleeve button-down with contrast shoulder panel and chest numbering.", defaultPrice: 18000, img: "shirt-01.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-02", category: "shirts", name: "Rust Orange Barred-Stripe Shirt", desc: "Wide-stripe long-sleeve shirt with contrast collar and cuffs.", defaultPrice: 18000, img: "shirt-02.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-03", category: "shirts", name: "Burgundy Navy Barred-Stripe Shirt", desc: "Wide-stripe long-sleeve shirt with contrast collar and cuffs.", defaultPrice: 18000, img: "shirt-03.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-04", category: "shirts", name: "Olive Navy Barred-Stripe Shirt", desc: "Wide-stripe long-sleeve shirt with contrast collar and cuffs.", defaultPrice: 18000, img: "shirt-04.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-05", category: "shirts", name: "Burgundy Navy Barred-Stripe Shirt II", desc: "Wide-stripe long-sleeve shirt, alternate colorway.", defaultPrice: 18000, img: "shirt-05.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-06", category: "shirts", name: "Heather Grey Crest Shirt", desc: "Long-sleeve button-down shirt with embroidered chest crest.", defaultPrice: 17500, img: "shirt-06.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-07", category: "shirts", name: "Navy White Colorblock Shirt", desc: "Long-sleeve shirt with contrast sleeve, pocket and armband detail.", defaultPrice: 18500, img: "shirt-07.jpg", sizes: ["S","M","L","XL"] , featured: true },
  { id: "shirt-08", category: "shirts", name: "Navy Sky Colorblock Pocket Shirt", desc: "Three-tone colorblock long-sleeve shirt with chest pocket.", defaultPrice: 18500, img: "shirt-08.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-09", category: "shirts", name: "Blush Pink Crest Shirt", desc: "Long-sleeve button-down shirt with embroidered chest crest.", defaultPrice: 17500, img: "shirt-09.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-10", category: "shirts", name: "Mint Green Crest Shirt", desc: "Long-sleeve button-down shirt with embroidered chest crest.", defaultPrice: 17500, img: "shirt-10.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-11", category: "shirts", name: "Blue Grey Barred-Stripe Shirt", desc: "Wide-stripe long-sleeve shirt with white contrast collar.", defaultPrice: 18000, img: "shirt-11.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-12", category: "shirts", name: "Sky Blue Crest Shirt", desc: "Long-sleeve button-down shirt with embroidered chest crest.", defaultPrice: 17500, img: "shirt-12.jpg", sizes: ["S","M","L","XL"] },
  { id: "shirt-13", category: "shirts", name: "Sky Blue White Colorblock Shirt", desc: "Long-sleeve shirt with contrast sleeve, pocket and armband detail.", defaultPrice: 18500, img: "shirt-13.jpg", sizes: ["S","M","L","XL"] , isNew: true },

  // ---------------- HALF-ZIP PULLOVERS ----------------
  { id: "pullover-01", category: "pullovers", name: "Black Cream Stripe Half-Zip", desc: "Oversized striped half-zip pullover with matching beanie shown.", defaultPrice: 21000, img: "pullover-01.jpg", sizes: ["M","L","XL"] , featured: true },
  { id: "pullover-02", category: "pullovers", name: "Forest Cream Stripe Half-Zip", desc: "Oversized striped half-zip pullover with matching beanie shown.", defaultPrice: 21000, img: "pullover-02.jpg", sizes: ["M","L","XL"] },
  { id: "pullover-03", category: "pullovers", name: "Brown Cream Stripe Half-Zip", desc: "Oversized striped half-zip pullover with matching beanie shown.", defaultPrice: 21000, img: "pullover-03.jpg", sizes: ["M","L","XL"] },
  { id: "pullover-04", category: "pullovers", name: "Olive Black Cream Stripe Half-Zip", desc: "Oversized striped half-zip pullover with matching beanie shown.", defaultPrice: 21000, img: "pullover-04.jpg", sizes: ["M","L","XL"] , isNew: true },

  // ---------------- WATCHES ----------------
  { id: "watch-01", category: "watches", name: "Rose Gold Two-Tone Chronograph", desc: "Multi-dial chronograph-style watch, steel and rose gold band.", defaultPrice: 45000, img: "watch-01.jpg" , featured: true },
  { id: "watch-02", category: "watches", name: "Orange Sport Digital Watch", desc: "Rugged digital sport watch, orange resin strap, world time.", defaultPrice: 22000, img: "watch-02.jpg" },
  { id: "watch-03", category: "watches", name: "Black Dial Two-Tone Chronograph", desc: "Multi-dial chronograph-style watch, steel and gold-tone band.", defaultPrice: 45000, img: "watch-03.jpg" },
  { id: "watch-04", category: "watches", name: "Gold Tone Chronograph", desc: "Full gold-tone chronograph-style watch with black dial.", defaultPrice: 47000, img: "watch-04.jpg" , featured: true },
  { id: "watch-05", category: "watches", name: "Black Dial Silver Analog Watch", desc: "Classic round analog watch, silver steel band, date window.", defaultPrice: 25000, img: "watch-05.jpg" },
  { id: "watch-06", category: "watches", name: "Blue Dial Silver Analog Watch", desc: "Classic round analog watch, blue dial, steel band, date window.", defaultPrice: 25000, img: "watch-06.jpg" },
  { id: "watch-07", category: "watches", name: "White Dial Black Analog Watch", desc: "Classic round analog watch, black-tone band, white dial.", defaultPrice: 25000, img: "watch-07.jpg" },
  { id: "watch-08", category: "watches", name: "Green Dial Silver Analog Watch", desc: "Classic round analog watch, green dial, steel band, date window.", defaultPrice: 25000, img: "watch-08.jpg" , isNew: true },
  { id: "watch-09", category: "watches", name: "Black Dial Black Analog Watch", desc: "All-black analog watch, date window, steel band.", defaultPrice: 25000, img: "watch-09.jpg" },
  { id: "watch-10", category: "watches", name: "Silver Dial Chronograph", desc: "Classic round analog watch, silver dial, steel band, date window.", defaultPrice: 25000, img: "watch-10.jpg" },
  { id: "watch-11", category: "watches", name: "Blush Pink Dial Analog Watch", desc: "Classic round analog watch, blush pink dial, steel band.", defaultPrice: 25000, img: "watch-11.jpg" , isNew: true },
  { id: "watch-12", category: "watches", name: "Gold Tone Pink Dial Watch", desc: "Full gold-tone analog watch with soft pink dial.", defaultPrice: 27000, img: "watch-12.jpg" },
  { id: "watch-13", category: "watches", name: "Silver White Dial Analog Watch", desc: "Classic round analog watch, white dial, steel band, date window.", defaultPrice: 25000, img: "watch-13.jpg" },

  // ---------------- SNEAKERS ----------------
  { id: "sneaker-01", category: "sneakers", name: "White Classic Leather Sneaker", desc: "Low-top all-white leather sneaker, classic court silhouette.", defaultPrice: 32000, img: "sneaker-01.jpg", sizes: ["40","41","42","43","44","45"] , isNew: true },
  { id: "sneaker-02", category: "sneakers", name: "Blue Yellow High-Top Sneaker", desc: "High-top sneaker in blue and yellow colorblock.", defaultPrice: 38000, img: "sneaker-02.jpg", sizes: ["40","41","42","43","44","45"] , featured: true },
  { id: "sneaker-03", category: "sneakers", name: "Navy White Running Sneaker", desc: "Cushioned running-style sneaker in navy and white.", defaultPrice: 35000, img: "sneaker-03.jpg", sizes: ["40","41","42","43","44","45"] },
  { id: "sneaker-04", category: "sneakers", name: "Silver Red Running Sneaker", desc: "Cushioned running-style sneaker, silver and red with dark accents.", defaultPrice: 35000, img: "sneaker-04.jpg", sizes: ["40","41","42","43","44","45"] },
  { id: "sneaker-05", category: "sneakers", name: "Grey Chunky Running Sneaker", desc: "Chunky retro-running silhouette in grey tones.", defaultPrice: 37000, img: "sneaker-05.jpg", sizes: ["40","41","42","43","44","45"] , isNew: true },

  // ---------------- PANTS ----------------
  { id: "pants-01", category: "pants", name: "Grey Cargo Pants", desc: "Straight-fit cargo pants with side flap pockets, grey twill.", defaultPrice: 20000, img: "pants-01.jpg", sizes: ["30","32","34","36","38"] , featured: true },
];

module.exports = { CATEGORIES, PRODUCTS };
