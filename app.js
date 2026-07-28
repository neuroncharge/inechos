// INECHOS — product data & rendering
const WHATSAPP_NUMBER = "+971 50 193 5537"; // change to your number

const products = {
  /*favorites: [
    {
      name: "Sehar",
      tagline: "Classic White Chocolate",
      price: "AED 14",
      img: "assets/Sehar Cookie site.png",
      desc: "Buttery, chewy, and packed with creamy white chocolate chunks.",
      ingredients: "Flour, Butter, Sugar, Egg, White chocolate, Vanilla, Baking(Powder & Soda), Salt",
      allergens: ["Wheat", "Dairy", "Egg", "Soy"],
    },
    {
      name: "Ruh",
      tagline: "Premium Dark Chocolate",
      price: "AED 14",
      img: "assets/Ruh Cookie Site.png",
      desc: "Deep cocoa dough with a molten dark-chocolate center.",
      ingredients: "Cocoa, Flour, Butter, Sugar, Egg, Dark chocolate, Vanilla, Baking(Powder & Soda), Salt",
      allergens: ["Wheat", "Dairy", "Egg", "Soy"],
    },
    {
      name: "Aks",
      tagline: "Dark Chocolate Brownie",
      price: "AED 12",
      img: "assets/Aks Brownie site.png",
      desc: "Fudgy dark-chocolate brownie finished with flaky sea salt.",
      ingredients: "Cocoa, Flour, Butter, Sugar, Egg, Dark chocolate, Vanilla, Baking powder, Salt",
      allergens: ["Wheat", "Dairy", "Egg", "Soy"],
    },
  ],*/
  //cookies
  signature: [
    // reuse the same three signature items
     {
      name: "Sehar",
      tagline: "Classic White Chocolate",
      price: "AED 14",
      img: "assets/Sehar Cookie site.png",
      desc: "Buttery, chewy, and packed with creamy white chocolate chunks.",
      ingredients: "Flour, Butter, Sugar, Egg, White chocolate, Vanilla, Baking(Powder & Soda), Salt",
      allergens: ["Wheat", "Dairy", "Egg", "Soy"],
    },
    {
      name: "Ruh",
      tagline: "Premium Dark Chocolate",
      price: "AED 14",
      img: "assets/Ruh Cookie Site.png",
      desc: "Deep intense cocoa flavor with dark chocolate chunks.",
      ingredients: "Cocoa, Flour, Butter, Sugar, Egg, Dark chocolate, Vanilla, Baking(Powder & Soda), Salt",
      allergens: ["Wheat", "Dairy", "Egg", "Soy"],
    },
  ],
  //Brownies
  seasonal: [
    {
      name: "Aks",
      tagline: "Dark Chocolate Brownie",
      price: "AED 12",
      img: "assets/Aks Brownie site.png",
      desc: "Intense dark-chocolate brownie.",
      ingredients: "Cocoa, Flour, Butter, Sugar, Egg, Dark chocolate, Vanilla, Baking powder, Salt",
      allergens: ["Wheat", "Dairy", "Egg", "Soy"],
    },
  ],
  //Cinnamon Rolls
  vegan: [
    {
      name: "Sukoon",
      tagline: "Classic Cinnamon Roll",
      price: "AED 22",
      img: "assets/Roll.png",
      desc: "Served with our signature cream cheese frosting.",
      ingredients: "Cinnamon, Flour, Butter, Egg, Milk, Sugar, Yeast, Salt",
      allergens: ["Wheat", "Dairy", "Egg", "Soy"],
    },
  ],
};

// Signature = the three brand items
// products.signature = products.favorites.slice();

function waLink(item) {
  const msg = `Hi INECHOS! I'd like to order: ${item.name} — ${item.tagline} (${item.price}).`;
  return `https://wa.me/c/971501935537`;
}

function cardHTML(item) {
  const tags = item.allergens.map((a) => `<span class="tag">${a}</span>`).join("");
  return `
    <article class="card">
      <div class="card-img"><img src="${item.img}" alt="${item.name} — ${item.tagline}" loading="lazy" /></div>
      <div class="card-head">
        <h3 class="card-title">${item.name}<br/><span style="font-size:13px;letter-spacing:0.2em;color:var(--brass);font-family:var(--sans);font-weight:500;text-transform:uppercase;">${item.tagline}</span></h3>
        
      </div>
      <p class="desc">${item.desc}</p>
      <div>
        <p class="lab">INGREDIENTS</p>
        <p class="ingredients">${item.ingredients}</p>
      </div>
      <div>
        <p class="lab">ALLERGENS</p>
        <div class="allergens">${tags}</div>
      </div>
      <a class="order-btn" href="${waLink(item)}" target="_blank" rel="noopener">
        <span class="icon-send"></span> COLLECTION
      </a>
    </article>
  `;
}

function render(id, list) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = list.map(cardHTML).join("");
}

document.addEventListener("DOMContentLoaded", () => {
//  render("favorites-grid", products.favorites);
  render("signature-grid", products.signature);
  render("seasonal-grid", products.seasonal);
  render("vegan-grid", products.vegan);

  // Smooth scroll for in-page links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
});
