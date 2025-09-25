/**
 * @license
 * Copyright © 2025 Tecnología y Soluciones Informáticas. 
 * Todos los derechos reservados.
 *
 * AUTOSERVICIO LA QUINTA PWA
 * Uso exclusivo TECSIN S.A.S.
 */

// --- Variables de estado ---
let cart = [];
let products = [];
let currentImageIndex = 0;
let currentProduct = null;
let deferredPrompt = null;
const PRODUCTS_PER_PAGE = 25;
let orderDetails = {};

// --- Referencias del DOM ---
const featuredContainer = document.getElementById('featured-grid');
const offersGrid = document.getElementById('offers-grid');
const allFilteredContainer = document.getElementById('all-filtered-products');
const featuredSection = document.getElementById('featured-section');
const offersSection = document.getElementById('offers-section');
const filteredSection = document.getElementById('filtered-section');
const noProductsMessage = document.getElementById('no-products-message');
const searchInput = document.getElementById('search-input');
const searchResultsTitle = document.getElementById('search-results-title');
const categoryCarousel = document.getElementById('category-carousel');
const productModal = document.getElementById('productModal');
const modalProductName = document.getElementById('modal-product-name');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');
const qtyInput = document.getElementById('qty-input');
const carouselImagesContainer = document.getElementById('carousel-images-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const cartBtn = document.getElementById('cart-btn');
const cartBadge = document.getElementById('cart-badge');
const cartModal = document.getElementById('cartModal');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkoutModal');
const customerNameInput = document.getElementById('customer-name');
const customerAddressInput = document.getElementById('customer-address');
const finalizeBtn = document.getElementById('finalize-btn');
const installBanner = document.getElementById('install-banner');
const installCloseBtn = document.getElementById('install-close-btn');
const installPromptBtn = document.getElementById('install-prompt-btn');
const orderSuccessModal = document.getElementById('orderSuccessModal');
const orderSuccessTotal = document.getElementById('order-success-total');
const whatsappBtn = document.getElementById('whatsapp-btn');
const closeSuccessBtn = document.getElementById('close-success-btn');
const termsConsentCheckbox = document.getElementById('terms-consent-checkbox');

// --- Funciones de ayuda ---
const money = (v) => {
  const value = Math.floor(v);
  return value.toLocaleString('es-CO');
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- Renderizado de productos ---
const generateProductCard = (p) => {
  let bestSellerTag = p.bestSeller ? `<div class="best-seller-tag">Lo más vendido</div>` : '';
  let stockOverlay = '';
  let stockClass = '';
  if (!p.stock || p.stock <= 0) {
    stockOverlay = `<div class="out-of-stock-overlay">Agotado</div>`;
    stockClass = ' out-of-stock';
  }

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

function renderProducts(container, data, page = 1, perPage = 20, withPagination = false) {
  container.innerHTML = '';
  const paginationContainer = document.getElementById('pagination-container');
  if (!data || data.length === 0) {
    noProductsMessage.style.display = 'block';
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }
  noProductsMessage.style.display = 'none';
  const totalPages = Math.ceil(data.length / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const currentProducts = data.slice(start, end);
  currentProducts.forEach(p => container.innerHTML += generateProductCard(p));
  if (withPagination && totalPages > 1) {
    renderPagination(page, totalPages, data, perPage);
  } else {
    if (paginationContainer) paginationContainer.innerHTML = '';
  }
}

function renderPagination(currentPage, totalPages, data, perPage) {
  const paginationContainer = document.getElementById('pagination-container');
  paginationContainer.innerHTML = '';

  function createBtn(label, page, active = false) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'pagination-btn';
    if (active) btn.classList.add('active');
    btn.addEventListener('click', () => {
      renderProducts(allFilteredContainer, data, page, perPage, true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return btn;
  }

  if (currentPage > 1) paginationContainer.appendChild(createBtn('Primera', 1));
  if (currentPage > 3) paginationContainer.appendChild(document.createTextNode('...'));
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    paginationContainer.appendChild(createBtn(i, i, i === currentPage));
  }
  if (currentPage < totalPages - 2) paginationContainer.appendChild(document.createTextNode('...'));
  if (currentPage < totalPages) paginationContainer.appendChild(createBtn('Última', totalPages));
}

// --- Búsqueda y categorías ---
const generateCategoryCarousel = () => {
  categoryCarousel.innerHTML = '';
  const categories = Array.from(new Set(products.map(p => p.category))).map(c => ({ label: c }));
  const allItem = document.createElement('div');
  allItem.className = 'category-item';
  allItem.innerHTML = `<img class="category-image" src="img/icons/all.webp" alt="Todo" data-category="__all"><span class="category-name">Todo</span>`;
  categoryCarousel.appendChild(allItem);
  categories.forEach(c => {
    const el = document.createElement('div');
    el.className = 'category-item';
    const fileName = `img/icons/${c.label.toLowerCase().replace(/\s+/g, '_')}.webp`;
    el.innerHTML = `<img class="category-image" src="${fileName}" alt="${c.label}" data-category="${c.label}"><span class="category-name">${c.label}</span>`;
    categoryCarousel.appendChild(el);
  });
};

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    showDefaultSections();
    return;
  }
  const filtered = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  filteredSection.style.display = 'block';
  featuredSection.style.display = 'none';
  offersSection.style.display = 'none';
  searchResultsTitle.textContent = `Resultados para "${q}"`;
  renderProducts(allFilteredContainer, filtered, 1, 20, true);
});

const showDefaultSections = () => {
  featuredSection.style.display = 'block';
  offersSection.style.display = 'block';
  filteredSection.style.display = 'none';
  const featured = shuffleArray(products.filter(p => p.featured)).slice(0, 25);
  const offers = shuffleArray(products.filter(p => p.isOffer)).slice(0, 25);
  renderProducts(featuredContainer, featured, 1, 25, false);
  renderProducts(offersGrid, offers, 1, 25, false);
};

// --- Carrito y pedidos ---
function updateCart() {
  cartItemsContainer.innerHTML = '';
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
    cartBadge.style.display = 'none';
    cartBadge.textContent = '0';
    cartTotalElement.textContent = money(0);
    return;
  }
  let total = 0, totalItems = 0;
  cart.forEach((item, idx) => {
    total += item.price * item.qty;
    totalItems += item.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><img src="${item.image}" alt="${item.name}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;"><div><strong>${item.name}</strong><div style="font-size:.9rem;color:#666">${item.qty} x $${money(item.price)}</div></div></div><div class="controls"><button class="qty-btn" data-idx="${idx}" data-op="dec">-</button><button class="qty-btn" data-idx="${idx}" data-op="inc">+</button></div>`;
    cartItemsContainer.appendChild(div);
  });
  cartBadge.style.display = 'flex';
  cartBadge.textContent = String(totalItems);
  cartTotalElement.textContent = money(total);
}

function addToCart(id, qty = 1) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  const availableStock = p.stock || 0;
  const existingInCart = cart.find(i => i.id === id);
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
finalizeBtn.addEventListener('click', () => {
  const name = customerNameInput.value.trim();
  const address = customerAddressInput.value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value || '';
  if (!termsConsentCheckbox.checked) {
    alert('Debes aceptar los Términos y Condiciones.');
    return;
  }
  if (!name || !address) {
    alert('Por favor completa nombre y dirección');
    return;
  }
  orderDetails = {
    name,
    address,
    payment,
    items: [...cart],
    total: cart.reduce((acc, item) => acc + item.price * item.qty, 0)
  };
  closeModal(checkoutModal);
  closeModal(cartModal);
  showOrderSuccessModal();
});

whatsappBtn.addEventListener('click', async () => {
  if (Object.keys(orderDetails).length === 0) {
    alert('No hay detalles del pedido.');
    return;
  }
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderDetails)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar pedido');

    const whatsappNumber = '573227671829';
    let message = `Hola mi nombre es ${encodeURIComponent(orderDetails.name)}.%0AHe realizado un pedido para la dirección ${encodeURIComponent(orderDetails.address)} quiero confirmar el pago en ${encodeURIComponent(orderDetails.payment)}.%0A%0A--- Mi pedido es: ---%0A`;
    orderDetails.items.forEach(item => {
      message += `- ${encodeURIComponent(item.name)} x${item.qty} = $${money(item.price * item.qty)}%0A`;
    });
    message += `%0ATotal: $${money(orderDetails.total)}`;
    const link = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(link, '_blank');

    cart = [];
    orderDetails = {};
    updateCart();
    closeModal(orderSuccessModal);
  } catch (err) {
    alert('Error al procesar el pedido: ' + err.message);
  }
});

// --- Fetch de productos vía API interna ---
async function fetchProductsFromAPI() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error cargando productos');
    return data;
  } catch (err) {
    console.error('Error:', err.message);
    alert('Error al cargar los productos.');
    return [];
  }
}

// --- Iniciar aplicación ---
document.addEventListener('DOMContentLoaded', async () => {
  products = await fetchProductsFromAPI();
  if (products.length > 0) {
    showDefaultSections();
    generateCategoryCarousel();
  }
  updateCart();
});
