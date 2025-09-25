/**
 * @license
 * AUTOSERVICIO LA QUINTA PWA
 * © 2025 TECSIN S.A.S. Todos los derechos reservados.
 */

// --- Configuración de API (Supabase Edge Functions) ---
const API_BASE = "https://<nqjekbyyvqrevbcehhob>.functions.supabase.co";
// --- Variables de estado ---
let cart = [];
let products = [];
let currentProduct = null;
let orderDetails = {};
const PRODUCTS_PER_PAGE = 25;

// --- Referencias del DOM ---
const featuredContainer = document.getElementById("featured-grid");
const offersGrid = document.getElementById("offers-grid");
const allFilteredContainer = document.getElementById("all-filtered-products");
const featuredSection = document.getElementById("featured-section");
const offersSection = document.getElementById("offers-section");
const filteredSection = document.getElementById("filtered-section");
const noProductsMessage = document.getElementById("no-products-message");
const searchInput = document.getElementById("search-input");
const searchResultsTitle = document.getElementById("search-results-title");
const categoryCarousel = document.getElementById("category-carousel");
const productModal = document.getElementById("productModal");
const modalProductName = document.getElementById("modal-product-name");
const modalProductDescription = document.getElementById("modal-product-description");
const modalProductPrice = document.getElementById("modal-product-price");
const modalAddToCartBtn = document.getElementById("modal-add-to-cart-btn");
const qtyInput = document.getElementById("qty-input");
const carouselImagesContainer = document.getElementById("carousel-images-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const cartBtn = document.getElementById("cart-btn");
const cartBadge = document.getElementById("cart-badge");
const cartModal = document.getElementById("cartModal");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalElement = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutModal = document.getElementById("checkoutModal");
const customerNameInput = document.getElementById("customer-name");
const customerAddressInput = document.getElementById("customer-address");
const finalizeBtn = document.getElementById("finalize-btn");
const orderSuccessModal = document.getElementById("orderSuccessModal");
const orderSuccessTotal = document.getElementById("order-success-total");
const whatsappBtn = document.getElementById("whatsapp-btn");
const closeSuccessBtn = document.getElementById("close-success-btn");
const termsConsentCheckbox = document.getElementById("terms-consent-checkbox");

// --- Funciones de ayuda ---
const money = (v) => Math.floor(v).toLocaleString("es-CO");

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- Renderizado de productos ---
const generateProductCard = (p) => {
  let bestSellerTag = p.bestSeller ? `<div class="best-seller-tag">Lo más vendido</div>` : "";
  let stockOverlay = !p.stock || p.stock <= 0 ? `<div class="out-of-stock-overlay">Agotado</div>` : "";
  let stockClass = !p.stock || p.stock <= 0 ? " out-of-stock" : "";

  return `
    <div class="product-card${stockClass}" data-product-id="${p.id}">
      ${bestSellerTag}
      <img src="${p.image[0]}" alt="${p.name}" class="product-image modal-trigger" data-id="${p.id}" loading="lazy" />
      ${stockOverlay}
      <div class="product-info">
        <div>
          <div class="product-name">${p.name}</div>
          <div class="product-description">${p.description}</div>
        </div>
        <div style="margin-top:8px">
          <div class="product-price">$${money(p.price)}</div>
        </div>
      </div>
    </div>
  `;
};

function renderProducts(container, data, page = 1, perPage = 20) {
  container.innerHTML = "";
  if (!data || data.length === 0) {
    noProductsMessage.style.display = "block";
    return;
  }
  noProductsMessage.style.display = "none";
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const currentProducts = data.slice(start, end);
  currentProducts.forEach((p) => (container.innerHTML += generateProductCard(p)));
}

// --- Búsqueda y categorías ---
const generateCategoryCarousel = () => {
  categoryCarousel.innerHTML = "";
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const allItem = document.createElement("div");
  allItem.className = "category-item";
  allItem.innerHTML = `<img class="category-image" src="img/icons/all.webp" alt="Todo" data-category="__all"><span class="category-name">Todo</span>`;
  categoryCarousel.appendChild(allItem);
  categories.forEach((c) => {
    const el = document.createElement("div");
    el.className = "category-item";
    el.innerHTML = `<img class="category-image" src="img/icons/${c.toLowerCase().replace(/\s+/g, "_")}.webp" alt="${c}" data-category="${c}"><span class="category-name">${c}</span>`;
    categoryCarousel.appendChild(el);
  });
};

searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    showDefaultSections();
    return;
  }
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  );
  filteredSection.style.display = "block";
  featuredSection.style.display = "none";
  offersSection.style.display = "none";
  searchResultsTitle.textContent = `Resultados para "${q}"`;
  renderProducts(allFilteredContainer, filtered, 1, 20);
});

const showDefaultSections = () => {
  featuredSection.style.display = "block";
  offersSection.style.display = "block";
  filteredSection.style.display = "none";
  const featured = shuffleArray(products.filter((p) => p.featured)).slice(0, 25);
  const offers = shuffleArray(products.filter((p) => p.isOffer)).slice(0, 25);
  renderProducts(featuredContainer, featured, 1, 25);
  renderProducts(offersGrid, offers, 1, 25);
};

// --- Carrito ---
function updateCart() {
  cartItemsContainer.innerHTML = "";
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
    cartBadge.style.display = "none";
    cartTotalElement.textContent = money(0);
    return;
  }
  let total = 0,
    totalItems = 0;
  cart.forEach((item, idx) => {
    total += item.price * item.qty;
    totalItems += item.qty;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `<div style="display:flex;align-items:center;gap:8px;">
        <img src="${item.image}" alt="${item.name}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">
        <div><strong>${item.name}</strong><div style="font-size:.9rem;color:#666">${item.qty} x $${money(item.price)}</div></div>
      </div>
      <div class="controls">
        <button class="qty-btn" data-idx="${idx}" data-op="dec">-</button>
        <button class="qty-btn" data-idx="${idx}" data-op="inc">+</button>
      </div>`;
    cartItemsContainer.appendChild(div);
  });
  cartBadge.style.display = "flex";
  cartBadge.textContent = String(totalItems);
  cartTotalElement.textContent = money(total);
}

function addToCart(id, qty = 1) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const availableStock = p.stock || 0;
  const existingInCart = cart.find((i) => i.id === id);
  const currentQtyInCart = existingInCart ? existingInCart.qty : 0;

  if (currentQtyInCart + qty > availableStock) {
    alert(`No hay suficiente stock para ${p.name}. Solo quedan ${availableStock} unidades.`);
    return;
  }

  if (existingInCart) {
    existingInCart.qty += qty;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, qty, image: p.image[0] });
  }
  updateCart();
}

// --- Checkout ---
finalizeBtn.addEventListener("click", () => {
  const name = customerNameInput.value.trim();
  const address = customerAddressInput.value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value || "";
  if (!termsConsentCheckbox.checked) {
    alert("Debes aceptar los Términos y Condiciones.");
    return;
  }
  if (!name || !address) {
    alert("Por favor completa nombre y dirección");
    return;
  }
  orderDetails = {
    name,
    address,
    payment,
    items: [...cart],
    total: cart.reduce((acc, item) => acc + item.price * item.qty, 0),
  };
  orderSuccessTotal.textContent = money(orderDetails.total);
  orderSuccessModal.style.display = "flex";
});

whatsappBtn.addEventListener("click", async () => {
  if (!orderDetails || !orderDetails.items) {
    alert("No hay detalles del pedido.");
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderDetails),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al guardar pedido");

    // Generar mensaje WhatsApp
    const whatsappNumber = "573227671829";
    let message = `Hola, mi nombre es ${encodeURIComponent(orderDetails.name)}.%0AHe realizado un pedido para ${encodeURIComponent(orderDetails.address)} en ${encodeURIComponent(orderDetails.payment)}.%0A--- Pedido ---%0A`;
    orderDetails.items.forEach((item) => {
      message += `- ${encodeURIComponent(item.name)} x${item.qty} = $${money(item.price * item.qty)}%0A`;
    });
    message += `%0ATotal: $${money(orderDetails.total)}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");

    cart = [];
    orderDetails = {};
    updateCart();
    orderSuccessModal.style.display = "none";
  } catch (err) {
    alert("Error al procesar el pedido: " + err.message);
  }
});

// --- Fetch de productos desde Edge Function ---
async function fetchProductsFromAPI() {
  try {
    const res = await fetch(`${API_BASE}/get-products`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error cargando productos");
    return data;
  } catch (err) {
    console.error("Error:", err.message);
    alert("Error al cargar los productos.");
    return [];
  }
}

// --- Inicializar ---
document.addEventListener("DOMContentLoaded", async () => {
  products = await fetchProductsFromAPI();
  if (products.length > 0) {
    showDefaultSections();
    generateCategoryCarousel();
  }
  updateCart();
});
