/**
 * ============================================================================
 * QUITUTES DA VOVÓ LOURIBINHA - CONTROLADOR PRINCIPAL DE INTERFACE (UI)
 * ============================================================================
 * Arquivo: js/main.js
 *
 * Responsável por:
 * - Renderizar categorias e cards de produtos dinamicamente.
 * - Gerenciar filtros de categorias e microinterações.
 * - Sincronizar os elementos visuais (header, barra mobile, drawer do carrinho,
 *   barra de progresso do cento e revisão final do checkout).
 * - Coordenar os eventos do formulário de finalização e envio ao WhatsApp.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado de interface
  let activeCategoryId = 'salgadinhos';
  /** @type {Record<string, number>} Quantidade selecionada no seletor de cada card antes de adicionar */
  const cardDraftQuantities = {};

  // Inicializa quantidades padrão nos seletores dos cards
  window.PRODUCTS.forEach((p) => {
    cardDraftQuantities[p.id] = p.defaultAddQty || 10;
  });

  // Referências de elementos do DOM
  const els = {
    categoryTabs: document.getElementById('categoryTabs'),
    activeCategoryBanner: document.getElementById('activeCategoryBanner'),
    productsGrid: document.getElementById('productsGrid'),

    // Cento Tracker
    centoTrackerBanner: document.getElementById('centoTrackerBanner'),
    centoTrackerTitle: document.getElementById('centoTrackerTitle'),
    centoCounterPill: document.getElementById('centoCounterPill'),
    centoTrackerText: document.getElementById('centoTrackerText'),
    centoProgressBar: document.getElementById('centoProgressBar'),
    centoProgressFill: document.getElementById('centoProgressFill'),

    // Header Cart
    headerCartBtn: document.getElementById('headerCartBtn'),
    headerCartCount: document.getElementById('headerCartCount'),
    headerCartTotal: document.getElementById('headerCartTotal'),

    // Hero Quick Combo
    heroQuickComboBtn: document.getElementById('heroQuickComboBtn'),

    // Mobile Bottom Bar
    mobileCartBar: document.getElementById('mobileCartBar'),
    mobileCartBtn: document.getElementById('mobileCartBtn'),
    mobileCartCount: document.getElementById('mobileCartCount'),
    mobileCartText: document.getElementById('mobileCartText'),

    // Cart Drawer
    cartBackdrop: document.getElementById('cartBackdrop'),
    cartDrawer: document.getElementById('cartDrawer'),
    cartDrawerSubtitle: document.getElementById('cartDrawerSubtitle'),
    clearCartBtn: document.getElementById('clearCartBtn'),
    closeCartBtn: document.getElementById('closeCartBtn'),
    cartDrawerBody: document.getElementById('cartDrawerBody'),
    cartDrawerFooter: document.getElementById('cartDrawerFooter'),
    cartRuleBox: document.getElementById('cartRuleBox'),
    cartConsultAlert: document.getElementById('cartConsultAlert'),
    cartFooterTotalQty: document.getElementById('cartFooterTotalQty'),
    cartFooterTotalValue: document.getElementById('cartFooterTotalValue'),
    proceedToCheckoutBtn: document.getElementById('proceedToCheckoutBtn'),

    // Checkout Modal
    checkoutBackdrop: document.getElementById('checkoutBackdrop'),
    checkoutModal: document.getElementById('checkoutModal'),
    closeCheckoutBtn: document.getElementById('closeCheckoutBtn'),
    checkoutForm: document.getElementById('checkoutForm'),
    checkoutErrorBanner: document.getElementById('checkoutErrorBanner'),
    customerName: document.getElementById('customerName'),
    customerPhone: document.getElementById('customerPhone'),
    deliveryRetirada: document.getElementById('deliveryRetirada'),
    deliveryEntrega: document.getElementById('deliveryEntrega'),
    optionRetiradaCard: document.getElementById('optionRetiradaCard'),
    optionEntregaCard: document.getElementById('optionEntregaCard'),
    deliveryAddressFields: document.getElementById('deliveryAddressFields'),
    addressStreet: document.getElementById('addressStreet'),
    addressNeighborhood: document.getElementById('addressNeighborhood'),
    addressComplement: document.getElementById('addressComplement'),
    desiredDate: document.getElementById('desiredDate'),
    desiredTime: document.getElementById('desiredTime'),
    orderNotes: document.getElementById('orderNotes'),
    checkoutReviewItems: document.getElementById('checkoutReviewItems'),
    checkoutReviewTotals: document.getElementById('checkoutReviewTotals'),
    checkoutConsultAckBox: document.getElementById('checkoutConsultAckBox'),
    checkoutConsultAck: document.getElementById('checkoutConsultAck'),
    backToCartFromCheckoutBtn: document.getElementById('backToCartFromCheckoutBtn'),

    // Post-order Modal
    postOrderBackdrop: document.getElementById('postOrderBackdrop'),
    postOrderModal: document.getElementById('postOrderModal'),
    generatedMessagePreview: document.getElementById('generatedMessagePreview'),
    directWhatsAppLinkBtn: document.getElementById('directWhatsAppLinkBtn'),
    copyWhatsAppMsgBtn: document.getElementById('copyWhatsAppMsgBtn'),
    closePostOrderBtn: document.getElementById('closePostOrderBtn'),

    // Misc
    toastContainer: document.getElementById('toastContainer'),
    currentYear: document.getElementById('currentYear')
  };

  if (els.currentYear) {
    els.currentYear.textContent = String(new Date().getFullYear());
  }

  // Configura data mínima do campo de data para hoje
  if (els.desiredDate) {
    const todayISO = window.CheckoutManager.getTodayISO();
    els.desiredDate.min = todayISO;
    if (!els.desiredDate.value) {
      els.desiredDate.value = todayISO;
    }
  }

  /**
   * Exibe uma notificação estilo Toast no canto da tela.
   * @param {string} message
   * @param {'success'|'warning'|'info'} type
   */
  function showToast(message, type = 'success') {
    if (!els.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast-item toast-item--${type}`;
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${type === 'success' ? '✓' : type === 'warning' ? '!' : 'i'}</span>
      <span class="toast-text">${escapeHtml(message)}</span>
    `;
    els.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /**
   * Escapa caracteres especiais para evitar injeção de HTML.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Retorna ícone SVG ilustrativo para cada categoria.
   * @param {string} iconName
   * @returns {string}
   */
  function getCategorySvgIcon(iconName) {
    switch (iconName) {
      case 'salgado':
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2C8 7 5 11 5 15a7 7 0 0 0 14 0c0-4-3-8-7-13Z"></path></svg>`;
      case 'pastel':
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M3 10h18M7 6v12M17 6v12"></path></svg>`;
      case 'esfiha':
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 3 21 19 3 19 12 3"></polygon><circle cx="12" cy="14" r="2.5"></circle></svg>`;
      case 'doce':
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 21l-.75-9.07A4.001 4.001 0 0 1 12 4z"></path><circle cx="12" cy="14" r="6"></circle></svg>`;
      default:
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    }
  }

  /**
   * Renderiza as abas de navegação por categorias.
   */
  function renderCategoryTabs() {
    if (!els.categoryTabs) return;

    els.categoryTabs.innerHTML = window.CATEGORIES.map((cat) => {
      const isActive = cat.id === activeCategoryId;
      return `
        <button
          type="button"
          role="tab"
          aria-selected="${isActive ? 'true' : 'false'}"
          class="category-tab-btn ${isActive ? 'is-active' : ''}"
          data-category-id="${escapeHtml(cat.id)}"
        >
          <span class="cat-tab-icon">${getCategorySvgIcon(cat.icon)}</span>
          <span class="cat-tab-name">${escapeHtml(cat.name)}</span>
          ${cat.badge ? `<span class="cat-tab-badge">${escapeHtml(cat.badge)}</span>` : ''}
        </button>
      `;
    }).join('');
  }

  /**
   * Renderiza o banner informativo da categoria ativa.
   */
  function renderActiveCategoryBanner() {
    if (!els.activeCategoryBanner) return;
    const category = window.CurrencyUtils.getCategoryById(activeCategoryId) || window.CATEGORIES[0];

    let priceHighlightHtml = '';
    if (category.id === 'salgadinhos' || category.id === 'todos') {
      priceHighlightHtml = `
        <div class="cat-banner-pricing">
          <span class="cat-price-pill cat-price-pill--green">100 unidades: <strong>R$ 65,00</strong></span>
          <span class="cat-price-pill cat-price-pill--orange">Menos de 100 un.: <strong>R$ 0,75 / un.</strong></span>
        </div>
      `;
    } else {
      priceHighlightHtml = `
        <div class="cat-banner-pricing">
          <span class="cat-price-pill cat-price-pill--consult">Preços sob consulta pelo WhatsApp</span>
        </div>
      `;
    }

    els.activeCategoryBanner.innerHTML = `
      <div class="cat-banner-text">
        <h3>${escapeHtml(category.name)}</h3>
        <p>${escapeHtml(category.description)}</p>
      </div>
      ${priceHighlightHtml}
    `;
  }

  /**
   * Gera a arte ilustrativa acolhedora para cards sem foto individual fornecida
   * ou fallback para quando a imagem ainda não foi colocada na pasta assets/images.
   */
  function getCardVisualHtml(product) {
    const category = window.CurrencyUtils.getCategoryById(product.categoryId);
    const categoryLabel = category ? category.shortName : 'Quitute';

    if (product.image) {
      const focalStyle = product.imageFocalPoint ? `style="object-position: ${product.imageFocalPoint};"` : '';
      return `
        <div class="product-card-media">
          <img
            src="${escapeHtml(product.image)}"
            alt="${escapeHtml(product.fullName || product.name)}"
            class="product-card-img"
            loading="lazy"
            ${focalStyle}
            onerror="this.parentElement.classList.add('media-fallback-active');"
          />
          <div class="product-media-fallback">
            <span class="media-fallback-icon">${getCategorySvgIcon(category ? category.icon : 'salgado')}</span>
            <strong class="media-fallback-title">${escapeHtml(product.fullName || product.name)}</strong>
            <span class="media-fallback-sub">Quitutes da Vovó Louribinha</span>
          </div>
          ${product.tag ? `<span class="product-card-tag ${product.priceConfirmed ? 'tag-confirmed' : 'tag-consult'}">${escapeHtml(product.tag)}</span>` : ''}
          <span class="product-category-chip">${escapeHtml(categoryLabel)}</span>
        </div>
      `;
    }

    // Produto sem foto específica fornecida (ex: Pastéis, Esfihas, Doces)
    // Não inventamos fotos de produtos; exibimos uma apresentação artesanal da marca.
    return `
      <div class="product-card-media media-fallback-active media-consult-card">
        <div class="product-media-fallback">
          <span class="media-fallback-icon">${getCategorySvgIcon(category ? category.icon : 'sparkles')}</span>
          <strong class="media-fallback-title">${escapeHtml(product.fullName || product.name)}</strong>
          <span class="media-fallback-sub">Feito sob encomenda • Consulte sabores e valores</span>
        </div>
        ${product.tag ? `<span class="product-card-tag tag-consult">${escapeHtml(product.tag)}</span>` : ''}
        <span class="product-category-chip">${escapeHtml(categoryLabel)}</span>
      </div>
    `;
  }

  /**
   * Renderiza a grade de produtos filtrada pela categoria selecionada.
   */
  function renderProductsGrid() {
    if (!els.productsGrid) return;

    const filtered = activeCategoryId === 'todos'
      ? window.PRODUCTS
      : window.PRODUCTS.filter((p) => p.categoryId === activeCategoryId);

    if (filtered.length === 0) {
      els.productsGrid.innerHTML = `
        <div class="empty-category-state">
          <p>Nenhum produto encontrado nesta categoria.</p>
        </div>
      `;
      return;
    }

    els.productsGrid.innerHTML = filtered.map((product) => {
      const draftQty = cardDraftQuantities[product.id] || product.defaultAddQty || 10;
      const inCartQty = window.CartManager.getProductQuantity(product.id);

      let priceBlockHtml = '';
      if (product.pricingType === 'salgadinhos_rule') {
        priceBlockHtml = `
          <div class="product-price-block">
            <div class="price-main-line">
              <span class="price-value">R$ 0,75</span>
              <span class="price-unit">/ unidade (&lt; 100 un.)</span>
            </div>
            <div class="price-secondary-line">
              <span class="cento-highlight-tag">Cento (100 un.): <strong>R$ 65,00</strong></span>
            </div>
          </div>
        `;
      } else if (product.priceConfirmed && typeof product.priceCents === 'number') {
        priceBlockHtml = `
          <div class="product-price-block">
            <div class="price-main-line">
              <span class="price-value">${window.CurrencyUtils.formatCents(product.priceCents)}</span>
              <span class="price-unit">/ ${escapeHtml(product.unitLabel)}</span>
            </div>
          </div>
        `;
      } else {
        priceBlockHtml = `
          <div class="product-price-block product-price-block--consult">
            <span class="price-consult-badge">Consulte o valor</span>
            <span class="price-unit">Unidade de venda: ${escapeHtml(product.unitLabel)}</span>
          </div>
        `;
      }

      const quickChipsHtml = product.pricingType === 'salgadinhos_rule'
        ? `
          <div class="quick-qty-chips" aria-label="Quantidades rápidas">
            ${window.SALGADINHOS_PRICING_RULE.quickQuantities.map((q) => `
              <button
                type="button"
                class="quick-qty-chip ${draftQty === q ? 'is-selected' : ''}"
                data-action="set-draft-qty"
                data-product-id="${escapeHtml(product.id)}"
                data-qty="${q}"
              >
                ${q} un.
              </button>
            `).join('')}
          </div>
        `
        : '';

      const inCartBannerHtml = inCartQty > 0
        ? `
          <div class="in-cart-card-bar">
            <span class="in-cart-status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
              No seu pedido: <strong>${inCartQty} ${inCartQty === 1 ? escapeHtml(product.unitSingular) : escapeHtml(product.unitPlural)}</strong>
            </span>
            <div class="in-cart-mini-controls">
              <button
                type="button"
                class="mini-step-btn"
                data-action="cart-dec"
                data-product-id="${escapeHtml(product.id)}"
                aria-label="Diminuir 1 unidade no carrinho"
              >−</button>
              <button
                type="button"
                class="mini-step-btn"
                data-action="cart-inc"
                data-product-id="${escapeHtml(product.id)}"
                aria-label="Aumentar 1 unidade no carrinho"
              >+</button>
            </div>
          </div>
        `
        : '';

      return `
        <article class="product-card ${inCartQty > 0 ? 'product-card--in-cart' : ''}" data-product-card="${escapeHtml(product.id)}">
          ${getCardVisualHtml(product)}

          <div class="product-card-body">
            <div class="product-card-header">
              <h3 class="product-card-title">${escapeHtml(product.name)}</h3>
              <span class="product-unit-meta">Venda por ${escapeHtml(product.unitLabel)}</span>
            </div>

            <p class="product-card-desc">${escapeHtml(product.description)}</p>

            ${priceBlockHtml}

            <div class="product-card-controls">
              <span class="qty-selector-label">Escolha a quantidade:</span>
              ${quickChipsHtml}

              <div class="card-action-row">
                <div class="qty-stepper" aria-label="Controle de quantidade">
                  <button
                    type="button"
                    class="qty-btn"
                    data-action="draft-dec"
                    data-product-id="${escapeHtml(product.id)}"
                    aria-label="Diminuir quantidade"
                  >−</button>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    step="1"
                    value="${draftQty}"
                    class="qty-input"
                    data-action="draft-input"
                    data-product-id="${escapeHtml(product.id)}"
                    aria-label="Quantidade de ${escapeHtml(product.name)}"
                  />
                  <button
                    type="button"
                    class="qty-btn"
                    data-action="draft-inc"
                    data-product-id="${escapeHtml(product.id)}"
                    aria-label="Aumentar quantidade"
                  >+</button>
                </div>

                <button
                  type="button"
                  class="btn btn-primary add-to-cart-btn"
                  data-action="add-to-cart"
                  data-product-id="${escapeHtml(product.id)}"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            ${inCartBannerHtml}
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Atualiza a barra de progresso do Cento de Salgadinhos.
   * @param {object} summary
   */
  function updateCentoTracker(summary) {
    if (!els.centoTrackerBanner) return;

    const qty = summary.totalSalgadinhosQty;
    const target = window.SALGADINHOS_PRICING_RULE.centoQuantity;
    const progressPercent = Math.min(100, Math.round((qty / target) * 100));

    els.centoCounterPill.textContent = `${qty} / ${target} un.`;
    els.centoProgressBar.setAttribute('aria-valuenow', String(progressPercent));
    els.centoProgressFill.style.width = `${progressPercent}%`;

    els.centoTrackerBanner.classList.remove('is-complete', 'is-near');

    if (qty === 0) {
      els.centoTrackerTitle.textContent = 'Monte seu pedido de Mini Salgados!';
      els.centoTrackerText.innerHTML = 'Unidade avulsa por <strong>R$ 0,75</strong> (até 99 un.) ou feche <strong>100 unidades (1 cento) por R$ 65,00</strong> misturando sabores!';
    } else if (qty < target) {
      const remaining = target - qty;
      const currentSalgadinhosValue = window.CurrencyUtils.formatCents(qty * window.SALGADINHOS_PRICING_RULE.unitPriceBelow100Cents);
      if (qty >= 85) {
        els.centoTrackerBanner.classList.add('is-near');
      }
      els.centoTrackerTitle.textContent = `Você tem ${qty} mini salgado(s) no pedido (${currentSalgadinhosValue})`;
      els.centoTrackerText.innerHTML = `Adicione mais <strong>${remaining} unidade(s)</strong> de qualquer sabor para fechar <strong>1 cento por R$ 65,00</strong>!`;
    } else if (qty === target) {
      els.centoTrackerBanner.classList.add('is-complete');
      els.centoTrackerTitle.textContent = '🎉 Parabéns! Você fechou 1 Cento de Mini Salgados!';
      els.centoTrackerText.innerHTML = `Valor especial aplicado: <strong>100 unidades por R$ 65,00</strong> (economia garantida de R$ 10,00).`;
    } else {
      els.centoTrackerBanner.classList.add('is-complete');
      els.centoTrackerTitle.textContent = `${qty} Mini Salgados selecionados no seu pedido!`;
      els.centoTrackerText.textContent = summary.salgadinhosRuleMessage;
    }
  }

  /**
   * Renderiza os itens dentro do Drawer do Carrinho.
   * @param {object} summary
   */
  function renderCartDrawer(summary) {
    if (!els.cartDrawerBody) return;

    els.cartDrawerSubtitle.textContent = summary.isEmpty
      ? 'Seu carrinho está vazio'
      : `${summary.totalItemsCount} ${summary.totalItemsCount === 1 ? 'item selecionado' : 'itens selecionados'} (${summary.distinctProductsCount} ${summary.distinctProductsCount === 1 ? 'sabor' : 'sabores'})`;

    els.clearCartBtn.hidden = summary.isEmpty;
    els.cartDrawerFooter.hidden = summary.isEmpty;

    if (summary.isEmpty) {
      els.cartDrawerBody.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon" aria-hidden="true">🧺</div>
          <h3>Seu carrinho ainda está vazio</h3>
          <p>Escolha seus salgadinhos, pastéis, esfihas ou doces favoritos no cardápio para montar seu pedido.</p>
          <button type="button" class="btn btn-primary" id="emptyCartBrowseBtn">
            Escolher produtos no cardápio
          </button>
        </div>
      `;
      const browseBtn = document.getElementById('emptyCartBrowseBtn');
      if (browseBtn) {
        browseBtn.addEventListener('click', () => {
          closeCartDrawer();
          document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' });
        });
      }
      return;
    }

    els.cartDrawerBody.innerHTML = `
      <ul class="cart-items-list">
        ${summary.items.map((item) => `
          <li class="cart-item-row" data-cart-item="${escapeHtml(item.productId)}">
            <div class="cart-item-main">
              <div class="cart-item-info">
                <strong class="cart-item-name">${escapeHtml(item.fullName)}</strong>
                <span class="cart-item-unit-price">${escapeHtml(item.unitPriceDisplay)}</span>
              </div>
              <button
                type="button"
                class="cart-item-remove-btn"
                data-action="cart-remove"
                data-product-id="${escapeHtml(item.productId)}"
                aria-label="Remover ${escapeHtml(item.fullName)} do pedido"
                title="Remover item"
              >
                Remover
              </button>
            </div>

            <div class="cart-item-controls-row">
              <div class="qty-stepper qty-stepper--sm">
                <button
                  type="button"
                  class="qty-btn"
                  data-action="cart-dec"
                  data-product-id="${escapeHtml(item.productId)}"
                  aria-label="Diminuir 1 unidade"
                >−</button>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  step="1"
                  value="${item.quantity}"
                  class="qty-input"
                  data-action="cart-input"
                  data-product-id="${escapeHtml(item.productId)}"
                  aria-label="Quantidade de ${escapeHtml(item.fullName)}"
                />
                <button
                  type="button"
                  class="qty-btn"
                  data-action="cart-inc"
                  data-product-id="${escapeHtml(item.productId)}"
                  aria-label="Aumentar 1 unidade"
                >+</button>
              </div>

              <div class="cart-item-subtotal-wrap">
                <span class="cart-item-subtotal-label">Subtotal:</span>
                <strong class="cart-item-subtotal ${item.isPriceConfirmed ? '' : 'is-consult'}">
                  ${escapeHtml(item.subtotalFormatted)}
                </strong>
              </div>
            </div>
          </li>
        `).join('')}
      </ul>
    `;

    // Caixa de status da regra dos salgadinhos
    if (summary.totalSalgadinhosQty > 0) {
      els.cartRuleBox.hidden = false;
      els.cartRuleBox.className = `cart-rule-box ${summary.salgadinhosRuleStatus === 'exact_100' || summary.salgadinhosRuleStatus === 'multiple_centos' ? 'cart-rule-box--green' : ''}`;
      els.cartRuleBox.innerHTML = `
        <strong>Mini Salgados (${summary.totalSalgadinhosQty} un.):</strong>
        <span>${escapeHtml(summary.salgadinhosRuleMessage)}</span>
      `;
    } else {
      els.cartRuleBox.hidden = true;
    }

    // Alerta se houver itens sem preço confirmado
    els.cartConsultAlert.hidden = !summary.hasUnconfirmedItems;

    // Totais no rodapé do drawer
    els.cartFooterTotalQty.textContent = `${summary.totalItemsCount} ${summary.totalItemsCount === 1 ? 'unidade' : 'unidades'}`;

    if (summary.hasUnconfirmedItems && summary.totalConfirmedCents === 0) {
      els.cartFooterTotalValue.textContent = 'Consulte o valor';
    } else if (summary.hasUnconfirmedItems) {
      els.cartFooterTotalValue.textContent = `${summary.totalConfirmedFormatted} + sob consulta`;
    } else {
      els.cartFooterTotalValue.textContent = summary.totalConfirmedFormatted;
    }
  }

  /**
   * Atualiza a Revisão Final dentro do modal de Checkout.
   * @param {object} summary
   */
  function renderCheckoutReview(summary) {
    if (!els.checkoutReviewItems || !els.checkoutReviewTotals) return;

    const isEntrega = els.deliveryEntrega && els.deliveryEntrega.checked;

    els.checkoutReviewItems.innerHTML = summary.items.map((item) => `
      <div class="review-item-row">
        <div class="review-item-left">
          <strong class="review-item-title">${escapeHtml(item.fullName)}</strong>
          <span class="review-item-meta">
            ${item.quantity} ${escapeHtml(item.unitFormatted)} × ${escapeHtml(item.unitPriceDisplay)}
          </span>
        </div>
        <strong class="review-item-subtotal ${item.isPriceConfirmed ? '' : 'is-consult'}">
          ${escapeHtml(item.subtotalFormatted)}
        </strong>
      </div>
    `).join('');

    let deliveryFeeLine = 'Isento (Retirada no local)';
    if (isEntrega) {
      deliveryFeeLine = window.STORE_CONFIG.deliveryFeeCents !== null
        ? window.CurrencyUtils.formatCents(window.STORE_CONFIG.deliveryFeeCents)
        : 'A consultar conforme o bairro';
    }

    const totalDisplay = summary.hasUnconfirmedItems && summary.totalConfirmedCents === 0
      ? 'Consulte o valor'
      : summary.hasUnconfirmedItems
        ? `${summary.totalConfirmedFormatted} (+ itens sob consulta)`
        : summary.totalConfirmedFormatted;

    els.checkoutReviewTotals.innerHTML = `
      <div class="review-total-line">
        <span>Total de itens:</span>
        <strong>${summary.totalItemsCount} ${summary.totalItemsCount === 1 ? 'unidade' : 'unidades'}</strong>
      </div>
      ${summary.totalSalgadinhosQty > 0 ? `
        <div class="review-total-line">
          <span>Total de Mini Salgados:</span>
          <strong>${summary.totalSalgadinhosQty} un.</strong>
        </div>
      ` : ''}
      <div class="review-total-line">
        <span>Taxa de entrega:</span>
        <strong>${escapeHtml(deliveryFeeLine)}</strong>
      </div>
      <div class="review-total-line review-total-line--grand">
        <span>Valor Total dos Produtos:</span>
        <strong>${escapeHtml(totalDisplay)}</strong>
      </div>
    `;

    // Exibe ou oculta a caixa obrigatória de ciência para itens "Consulte o valor"
    if (els.checkoutConsultAckBox) {
      els.checkoutConsultAckBox.hidden = !summary.hasUnconfirmedItems;
    }
  }

  /**
   * Sincroniza todos os componentes da página quando o carrinho sofre qualquer alteração.
   * @param {object} summary
   */
  function syncUIWithCart(summary) {
    // 1. Cabeçalho
    if (els.headerCartCount) {
      els.headerCartCount.textContent = String(summary.totalItemsCount);
      els.headerCartCount.classList.toggle('has-items', summary.totalItemsCount > 0);
    }
    if (els.headerCartTotal) {
      if (summary.hasUnconfirmedItems && summary.totalConfirmedCents === 0) {
        els.headerCartTotal.textContent = 'Sob consulta';
      } else {
        els.headerCartTotal.textContent = summary.totalConfirmedFormatted;
      }
    }

    // 2. Barra fixa inferior no celular ("Ver meu pedido — R$ XX,XX")
    if (els.mobileCartBar) {
      els.mobileCartBar.hidden = summary.isEmpty;
      if (!summary.isEmpty) {
        els.mobileCartCount.textContent = String(summary.totalItemsCount);
        const formattedTotalForBar = summary.hasUnconfirmedItems && summary.totalConfirmedCents === 0
          ? 'Consulte o valor'
          : summary.hasUnconfirmedItems
            ? `${summary.totalConfirmedFormatted} (+ consulta)`
            : summary.totalConfirmedFormatted;
        els.mobileCartText.textContent = `Ver meu pedido — ${formattedTotalForBar}`;
      }
    }

    // 3. Barra de progresso do cento de salgadinhos
    updateCentoTracker(summary);

    // 4. Cards de produtos (atualiza o selo "No seu pedido: X un.")
    renderProductsGrid();

    // 5. Drawer do carrinho
    renderCartDrawer(summary);

    // 6. Revisão do Checkout (se aberto)
    renderCheckoutReview(summary);
  }

  /**
   * Abre o painel lateral do carrinho (Drawer).
   */
  function openCartDrawer() {
    els.cartBackdrop.hidden = false;
    els.cartDrawer.setAttribute('aria-hidden', 'false');
    els.cartDrawer.classList.add('is-open');
    els.headerCartBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
  }

  /**
   * Fecha o painel lateral do carrinho (Drawer).
   */
  function closeCartDrawer() {
    els.cartDrawer.classList.remove('is-open');
    els.cartDrawer.setAttribute('aria-hidden', 'true');
    els.headerCartBtn.setAttribute('aria-expanded', 'false');
    els.cartBackdrop.hidden = true;
    if (els.checkoutModal.hidden && els.postOrderModal.hidden) {
      document.body.classList.remove('no-scroll');
    }
  }

  /**
   * Abre o modal de Checkout e Revisão Final.
   */
  function openCheckoutModal() {
    const summary = window.CartManager.getSummary();
    if (summary.isEmpty) {
      showToast('Adicione produtos ao carrinho antes de finalizar.', 'warning');
      return;
    }

    closeCartDrawer();
    els.checkoutErrorBanner.hidden = true;
    renderCheckoutReview(summary);

    els.checkoutBackdrop.hidden = false;
    els.checkoutModal.hidden = false;
    document.body.classList.add('no-scroll');

    setTimeout(() => {
      els.customerName?.focus();
    }, 100);
  }

  /**
   * Fecha o modal de Checkout.
   */
  function closeCheckoutModal() {
    els.checkoutModal.hidden = true;
    els.checkoutBackdrop.hidden = true;
    if (!els.cartDrawer.classList.contains('is-open') && els.postOrderModal.hidden) {
      document.body.classList.remove('no-scroll');
    }
  }

  /**
   * Alterna a exibição dos campos de endereço conforme Retirada vs Entrega.
   */
  function syncDeliveryTypeUI() {
    const isEntrega = els.deliveryEntrega.checked;
    els.deliveryAddressFields.hidden = !isEntrega;
    els.optionRetiradaCard.classList.toggle('is-selected', !isEntrega);
    els.optionEntregaCard.classList.toggle('is-selected', isEntrega);

    if (isEntrega) {
      els.addressStreet.setAttribute('required', 'required');
      els.addressNeighborhood.setAttribute('required', 'required');
    } else {
      els.addressStreet.removeAttribute('required');
      els.addressNeighborhood.removeAttribute('required');
    }

    renderCheckoutReview(window.CartManager.getSummary());
  }

  /**
   * Seleciona uma categoria e atualiza a visualização.
   * @param {string} categoryId
   */
  function selectCategory(categoryId) {
    if (!window.CurrencyUtils.getCategoryById(categoryId)) return;
    activeCategoryId = categoryId;
    renderCategoryTabs();
    renderActiveCategoryBanner();
    renderProductsGrid();
  }

  // ==========================================================================
  // REGISTRO DE EVENTOS
  // ==========================================================================

  // Clique nas abas de categorias
  els.categoryTabs?.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-category-id]');
    if (!tabBtn) return;
    const catId = tabBtn.getAttribute('data-category-id');
    selectCategory(catId);
  });

  // Links do cabeçalho e rodapé que filtram categorias
  document.querySelectorAll('[data-nav-category]').forEach((link) => {
    link.addEventListener('click', () => {
      const catId = link.getAttribute('data-nav-category');
      if (catId) {
        selectCategory(catId);
      }
    });
  });

  // Botão de sugestão rápida do exemplo oficial (15 coxinhas + 10 bolinhas de queijo + 15 quibes = 40 un = R$ 30,00)
  els.heroQuickComboBtn?.addEventListener('click', () => {
    window.CartManager.setItemQuantity('salg-coxinha', 15);
    window.CartManager.setItemQuantity('salg-bolinha-queijo', 10);
    window.CartManager.setItemQuantity('salg-kibe', 15);
    showToast('Sugestão adicionada: 15 coxinhas + 10 bolinhas de queijo + 15 quibes (40 un. = R$ 30,00)!', 'success');
    openCartDrawer();
  });

  // Delegação de eventos na grade de produtos
  els.productsGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const productId = btn.getAttribute('data-product-id');
    if (!productId) return;

    const product = window.CurrencyUtils.getProductById(productId);
    if (!product) return;

    if (action === 'set-draft-qty') {
      const qty = window.CartManager.sanitizeQuantity(btn.getAttribute('data-qty'));
      if (qty > 0) {
        cardDraftQuantities[productId] = qty;
        renderProductsGrid();
      }
    } else if (action === 'draft-dec') {
      const current = cardDraftQuantities[productId] || 1;
      cardDraftQuantities[productId] = Math.max(1, current - 1);
      renderProductsGrid();
    } else if (action === 'draft-inc') {
      const current = cardDraftQuantities[productId] || 1;
      cardDraftQuantities[productId] = Math.min(9999, current + 1);
      renderProductsGrid();
    } else if (action === 'add-to-cart') {
      const qtyToAdd = Math.max(1, cardDraftQuantities[productId] || 1);
      window.CartManager.addItem(productId, qtyToAdd);
      showToast(`${qtyToAdd} ${qtyToAdd === 1 ? product.unitSingular : product.unitPlural} de ${product.fullName || product.name} adicionado(s)!`, 'success');
    } else if (action === 'cart-inc') {
      window.CartManager.incrementItem(productId, 1);
    } else if (action === 'cart-dec') {
      window.CartManager.decrementItem(productId, 1);
    }
  });

  // Alteração manual no input numérico do card de produto
  els.productsGrid?.addEventListener('change', (e) => {
    const input = e.target.closest('[data-action="draft-input"]');
    if (!input) return;
    const productId = input.getAttribute('data-product-id');
    const cleanQty = Math.max(1, window.CartManager.sanitizeQuantity(input.value));
    cardDraftQuantities[productId] = cleanQty;
    input.value = String(cleanQty);
    renderProductsGrid();
  });

  // Delegação de eventos dentro do Drawer do Carrinho
  els.cartDrawerBody?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const productId = btn.getAttribute('data-product-id');
    if (!productId) return;

    if (action === 'cart-inc') {
      window.CartManager.incrementItem(productId, 1);
    } else if (action === 'cart-dec') {
      window.CartManager.decrementItem(productId, 1);
    } else if (action === 'cart-remove') {
      const product = window.CurrencyUtils.getProductById(productId);
      window.CartManager.removeItem(productId);
      if (product) {
        showToast(`${product.fullName || product.name} removido do pedido.`, 'info');
      }
    }
  });

  // Alteração manual de quantidade direto no input do carrinho
  els.cartDrawerBody?.addEventListener('change', (e) => {
    const input = e.target.closest('[data-action="cart-input"]');
    if (!input) return;
    const productId = input.getAttribute('data-product-id');
    const cleanQty = window.CartManager.sanitizeQuantity(input.value);
    if (cleanQty <= 0) {
      window.CartManager.removeItem(productId);
    } else {
      window.CartManager.setItemQuantity(productId, cleanQty);
    }
  });

  // Abrir/Fechar Carrinho
  els.headerCartBtn?.addEventListener('click', openCartDrawer);
  els.mobileCartBtn?.addEventListener('click', openCartDrawer);
  els.closeCartBtn?.addEventListener('click', closeCartDrawer);
  els.cartBackdrop?.addEventListener('click', closeCartDrawer);

  // Limpar Carrinho
  els.clearCartBtn?.addEventListener('click', () => {
    window.CartManager.clearCart();
    showToast('Carrinho limpo com sucesso.', 'info');
  });

  // Ir para o Checkout
  els.proceedToCheckoutBtn?.addEventListener('click', openCheckoutModal);

  // Voltar do Checkout para o Carrinho
  els.backToCartFromCheckoutBtn?.addEventListener('click', () => {
    closeCheckoutModal();
    openCartDrawer();
  });

  // Fechar Checkout
  els.closeCheckoutBtn?.addEventListener('click', closeCheckoutModal);
  els.checkoutBackdrop?.addEventListener('click', closeCheckoutModal);

  // Máscara de telefone em tempo real
  els.customerPhone?.addEventListener('input', (e) => {
    e.target.value = window.CheckoutManager.formatPhoneInput(e.target.value);
  });

  // Alternância entre Retirada e Entrega
  els.deliveryRetirada?.addEventListener('change', syncDeliveryTypeUI);
  els.deliveryEntrega?.addEventListener('change', syncDeliveryTypeUI);

  // Submissão do pedido para o WhatsApp
  els.checkoutForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Remove marcações anteriores de erro
    els.checkoutForm.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    els.checkoutErrorBanner.hidden = true;

    const summary = window.CartManager.getSummary();
    const formData = {
      customerName: els.customerName.value,
      customerPhone: els.customerPhone.value,
      deliveryType: els.deliveryEntrega.checked ? 'entrega' : 'retirada',
      addressStreet: els.addressStreet.value,
      addressNeighborhood: els.addressNeighborhood.value,
      addressComplement: els.addressComplement.value,
      desiredDate: els.desiredDate.value,
      desiredTime: els.desiredTime.value,
      notes: els.orderNotes.value,
      consultAcknowledged: Boolean(els.checkoutConsultAck && els.checkoutConsultAck.checked)
    };

    const validation = window.CheckoutManager.validateCheckout(formData, summary);
    if (!validation.valid) {
      els.checkoutErrorBanner.hidden = false;
      els.checkoutErrorBanner.innerHTML = `
        <strong>Por favor, verifique os seguintes campos antes de finalizar:</strong>
        <ul>
          ${validation.errors.map((err) => `<li>${escapeHtml(err.message)}</li>`).join('')}
        </ul>
      `;

      validation.errors.forEach((err) => {
        if (err.field === 'consultAck') {
          els.checkoutConsultAckBox?.classList.add('is-invalid');
        } else {
          const fieldEl = document.getElementById(err.field);
          fieldEl?.classList.add('is-invalid');
        }
      });

      els.checkoutErrorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Gera mensagem e URL oficial do WhatsApp
    const whatsappMessage = window.CheckoutManager.buildWhatsAppMessage(formData, summary);
    const whatsappUrl = window.CheckoutManager.buildWhatsAppUrl(whatsappMessage);

    // Preenche o modal pós-envio e redireciona para o WhatsApp
    els.generatedMessagePreview.value = whatsappMessage;
    els.directWhatsAppLinkBtn.href = whatsappUrl;

    closeCheckoutModal();
    els.postOrderBackdrop.hidden = false;
    els.postOrderModal.hidden = false;
    document.body.classList.add('no-scroll');

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });

  // Ações do modal pós-envio
  els.copyWhatsAppMsgBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(els.generatedMessagePreview.value);
      showToast('Mensagem copiada para a área de transferência!', 'success');
    } catch {
      els.generatedMessagePreview.select();
      document.execCommand('copy');
      showToast('Mensagem copiada!', 'success');
    }
  });

  const closePostOrderModal = () => {
    els.postOrderModal.hidden = true;
    els.postOrderBackdrop.hidden = true;
    document.body.classList.remove('no-scroll');
  };

  els.closePostOrderBtn?.addEventListener('click', closePostOrderModal);
  els.postOrderBackdrop?.addEventListener('click', closePostOrderModal);

  // Fechar modais/drawer com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!els.postOrderModal.hidden) {
        closePostOrderModal();
      } else if (!els.checkoutModal.hidden) {
        closeCheckoutModal();
      } else if (els.cartDrawer.classList.contains('is-open')) {
        closeCartDrawer();
      }
    }
  });

  // Inicialização
  renderCategoryTabs();
  renderActiveCategoryBanner();
  syncDeliveryTypeUI();
  window.CartManager.onChange(syncUIWithCart);
  window.CartManager.init();
});

