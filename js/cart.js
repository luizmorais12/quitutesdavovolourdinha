/**
 * ============================================================================
 * QUITUTES DA VOVÓ LOURIBINHA - GERENCIAMENTO DO CARRINHO DE COMPRAS
 * ============================================================================
 * Arquivo: js/cart.js
 *
 * Responsável por:
 * - Adicionar, remover, incrementar, decrementar e definir quantidades.
 * - Aplicar a regra comercial dos mini salgados em centavos inteiros.
 * - Calcular subtotais por produto e total geral sem erros de ponto flutuante.
 * - Persistir e recuperar o estado no localStorage com validação contra valores inválidos.
 */

const CartManager = (() => {
  /** @type {Array<{productId: string, quantity: number}>} */
  let items = [];

  /** @type {Array<Function>} */
  const listeners = [];

  /**
   * Sanitiza uma quantidade garantindo inteiro positivo válido.
   * @param {any} value
   * @returns {number}
   */
  function sanitizeQuantity(value) {
    const parsed = Number.parseInt(String(value), 10);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return Math.min(parsed, 9999);
  }

  /**
   * Carrega o carrinho salvo no localStorage e remove itens inválidos.
   */
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(window.STORE_CONFIG.storageKey);
      if (!raw) {
        items = [];
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        items = [];
        return;
      }

      const validItems = [];
      parsed.forEach((entry) => {
        if (!entry || typeof entry.productId !== 'string') return;
        const product = window.CurrencyUtils.getProductById(entry.productId);
        const qty = sanitizeQuantity(entry.quantity);
        if (product && qty > 0) {
          const existing = validItems.find((i) => i.productId === product.id);
          if (existing) {
            existing.quantity = sanitizeQuantity(existing.quantity + qty);
          } else {
            validItems.push({ productId: product.id, quantity: qty });
          }
        }
      });

      items = validItems;
    } catch (err) {
      console.warn('Não foi possível ler o carrinho do localStorage:', err);
      items = [];
    }
  }

  /**
   * Salva o estado atual do carrinho no localStorage.
   */
  function saveToStorage() {
    try {
      localStorage.setItem(window.STORE_CONFIG.storageKey, JSON.stringify(items));
    } catch (err) {
      console.warn('Não foi possível salvar o carrinho no localStorage:', err);
    }
  }

  /**
   * Notifica todos os observadores registrados sobre alterações no carrinho.
   */
  function notify() {
    const summary = getSummary();
    listeners.forEach((cb) => {
      try {
        cb(summary);
      } catch (err) {
        console.error('Erro ao atualizar componente do carrinho:', err);
      }
    });
  }

  /**
   * Calcula detalhadamente os subtotais, regras comerciais e totais do carrinho
   * utilizando exclusivamente centavos inteiros.
   */
  function getSummary() {
    const rule = window.SALGADINHOS_PRICING_RULE;

    // 1. Soma a quantidade total de mini salgados no carrinho
    let totalSalgadinhosQty = 0;
    items.forEach((entry) => {
      const product = window.CurrencyUtils.getProductById(entry.productId);
      if (product && product.pricingType === 'salgadinhos_rule') {
        totalSalgadinhosQty += entry.quantity;
      }
    });

    // 2. Determina o enquadramento da regra comercial dos salgadinhos
    const fullCentos = Math.floor(totalSalgadinhosQty / rule.centoQuantity);
    const remainingSalgadinhos = totalSalgadinhosQty % rule.centoQuantity;
    const centoUnitsLimit = fullCentos * rule.centoQuantity;

    let salgadinhosRuleStatus = 'none'; // 'none' | 'below_100' | 'exact_100' | 'multiple_centos' | 'cento_plus_avulso' | 'above_100_consult'
    let salgadinhosRuleMessage = '';
    let salgadinhosSavingsCents = 0;

    if (totalSalgadinhosQty > 0) {
      if (totalSalgadinhosQty < rule.centoQuantity) {
        salgadinhosRuleStatus = 'below_100';
        const missingForCento = rule.centoQuantity - totalSalgadinhosQty;
        salgadinhosRuleMessage = `Cálculo unitário (${window.CurrencyUtils.formatCents(rule.unitPriceBelow100Cents)}/un). Faltam ${missingForCento} un. para fechar 1 cento por ${window.CurrencyUtils.formatCents(rule.centoPriceCents)}!`;
      } else if (totalSalgadinhosQty === rule.centoQuantity) {
        salgadinhosRuleStatus = 'exact_100';
        salgadinhosSavingsCents = (rule.centoQuantity * rule.unitPriceBelow100Cents) - rule.centoPriceCents;
        salgadinhosRuleMessage = `Regra do Cento aplicada! 100 unidades por ${window.CurrencyUtils.formatCents(rule.centoPriceCents)} (economia de ${window.CurrencyUtils.formatCents(salgadinhosSavingsCents)}).`;
      } else if (rule.above100Mode === 'consult') {
        salgadinhosRuleStatus = 'above_100_consult';
        salgadinhosRuleMessage = `Acima de 100 unidades (${totalSalgadinhosQty} un.): valor sujeito a confirmação com a Vovó Louribinha.`;
      } else if (remainingSalgadinhos === 0) {
        salgadinhosRuleStatus = 'multiple_centos';
        salgadinhosSavingsCents = fullCentos * ((rule.centoQuantity * rule.unitPriceBelow100Cents) - rule.centoPriceCents);
        salgadinhosRuleMessage = `${fullCentos} centos fechados (${totalSalgadinhosQty} un.) a ${window.CurrencyUtils.formatCents(rule.centoPriceCents)} cada cento.`;
      } else {
        salgadinhosRuleStatus = 'cento_plus_avulso';
        salgadinhosSavingsCents = fullCentos * ((rule.centoQuantity * rule.unitPriceBelow100Cents) - rule.centoPriceCents);
        salgadinhosRuleMessage = `${fullCentos} cento(s) (${window.CurrencyUtils.formatCents(rule.centoPriceCents)} cada) + ${remainingSalgadinhos} un. avulsa(s) (${window.CurrencyUtils.formatCents(rule.unitPriceBelow100Cents)}/un).`;
      }
    }

    // 3. Calcula cada item individualmente em centavos inteiros
    let runningSalgadinhosCursor = 0;
    let totalConfirmedCents = 0;
    let totalItemsCount = 0;
    let hasUnconfirmedItems = false;
    const unconfirmedProductNames = [];

    const detailedItems = items.map((entry) => {
      const product = window.CurrencyUtils.getProductById(entry.productId);
      const quantity = sanitizeQuantity(entry.quantity);
      totalItemsCount += quantity;

      let subtotalCents = null;
      let unitPriceDisplay = 'Consulte o valor';
      let priceNote = '';
      let isPriceConfirmed = Boolean(product.priceConfirmed);

      if (product.pricingType === 'salgadinhos_rule') {
        if (totalSalgadinhosQty > rule.centoQuantity && rule.above100Mode === 'consult') {
          isPriceConfirmed = false;
          subtotalCents = null;
          unitPriceDisplay = 'Consulte (>100 un.)';
          priceNote = 'Quantidade acima de 100 un. sob consulta';
        } else if (totalSalgadinhosQty < rule.centoQuantity) {
          subtotalCents = quantity * rule.unitPriceBelow100Cents;
          unitPriceDisplay = `${window.CurrencyUtils.formatCents(rule.unitPriceBelow100Cents)}/un`;
        } else {
          // Distribui exatamente as unidades dentro dos centos fechados (65 centavos)
          // e as unidades excedentes avulsas (75 centavos) para soma exata em centavos.
          const itemStart = runningSalgadinhosCursor;
          const itemEnd = runningSalgadinhosCursor + quantity;
          runningSalgadinhosCursor = itemEnd;

          const unitsInCento = Math.max(0, Math.min(itemEnd, centoUnitsLimit) - itemStart);
          const unitsAvulso = quantity - unitsInCento;

          subtotalCents = (unitsInCento * rule.centoUnitPriceCents) + (unitsAvulso * rule.unitPriceBelow100Cents);

          if (unitsAvulso === 0) {
            unitPriceDisplay = `${window.CurrencyUtils.formatCents(rule.centoUnitPriceCents)}/un (no cento)`;
            priceNote = 'Valor proporcional no cento (R$ 65,00/100 un.)';
          } else if (unitsInCento === 0) {
            unitPriceDisplay = `${window.CurrencyUtils.formatCents(rule.unitPriceBelow100Cents)}/un (avulso)`;
          } else {
            unitPriceDisplay = `${unitsInCento} un. no cento + ${unitsAvulso} avulsa(s)`;
          }
        }
      } else if (product.pricingType === 'fixed' && product.priceConfirmed && typeof product.priceCents === 'number') {
        subtotalCents = quantity * Math.round(product.priceCents);
        unitPriceDisplay = `${window.CurrencyUtils.formatCents(product.priceCents)}/${product.unitSingular || 'un'}`;
      } else {
        isPriceConfirmed = false;
        subtotalCents = null;
        unitPriceDisplay = 'Consulte o valor';
      }

      if (isPriceConfirmed && subtotalCents !== null) {
        totalConfirmedCents += subtotalCents;
      } else {
        hasUnconfirmedItems = true;
        unconfirmedProductNames.push(product.fullName || product.name);
      }

      return {
        productId: product.id,
        product,
        name: product.name,
        fullName: product.fullName || product.name,
        categoryId: product.categoryId,
        quantity,
        unitSingular: product.unitSingular || 'unidade',
        unitPlural: product.unitPlural || 'unidades',
        unitFormatted: quantity === 1 ? (product.unitSingular || 'unidade') : (product.unitPlural || 'unidades'),
        isPriceConfirmed,
        unitPriceDisplay,
        priceNote,
        subtotalCents,
        subtotalFormatted: isPriceConfirmed && subtotalCents !== null
          ? window.CurrencyUtils.formatCents(subtotalCents)
          : 'Consulte o valor'
      };
    });

    return {
      items: detailedItems,
      distinctProductsCount: detailedItems.length,
      totalItemsCount,
      totalSalgadinhosQty,
      salgadinhosRuleStatus,
      salgadinhosRuleMessage,
      salgadinhosSavingsCents,
      salgadinhosSavingsFormatted: window.CurrencyUtils.formatCents(salgadinhosSavingsCents),
      totalConfirmedCents,
      totalConfirmedFormatted: window.CurrencyUtils.formatCents(totalConfirmedCents),
      hasUnconfirmedItems,
      unconfirmedProductNames,
      isEmpty: detailedItems.length === 0
    };
  }

  /**
   * Adiciona um produto ao carrinho.
   * @param {string} productId
   * @param {number} quantityToAdd
   * @returns {boolean}
   */
  function addItem(productId, quantityToAdd = 1) {
    const product = window.CurrencyUtils.getProductById(productId);
    const cleanQty = sanitizeQuantity(quantityToAdd);
    if (!product || cleanQty <= 0) {
      return false;
    }

    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity = sanitizeQuantity(existing.quantity + cleanQty);
    } else {
      items.push({ productId, quantity: cleanQty });
    }

    saveToStorage();
    notify();
    return true;
  }

  /**
   * Define a quantidade exata de um produto no carrinho.
   * Se a quantidade for 0, remove o item.
   * @param {string} productId
   * @param {number} newQuantity
   */
  function setItemQuantity(productId, newQuantity) {
    const cleanQty = sanitizeQuantity(newQuantity);
    if (cleanQty <= 0) {
      removeItem(productId);
      return;
    }

    const product = window.CurrencyUtils.getProductById(productId);
    if (!product) return;

    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity = cleanQty;
    } else {
      items.push({ productId, quantity: cleanQty });
    }

    saveToStorage();
    notify();
  }

  /**
   * Incrementa a quantidade de um item no carrinho.
   * @param {string} productId
   * @param {number} step
   */
  function incrementItem(productId, step = 1) {
    const cleanStep = Math.max(1, sanitizeQuantity(step));
    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      setItemQuantity(productId, existing.quantity + cleanStep);
    } else {
      addItem(productId, cleanStep);
    }
  }

  /**
   * Decrementa a quantidade de um item no carrinho.
   * @param {string} productId
   * @param {number} step
   */
  function decrementItem(productId, step = 1) {
    const cleanStep = Math.max(1, sanitizeQuantity(step));
    const existing = items.find((i) => i.productId === productId);
    if (!existing) return;

    const nextQty = existing.quantity - cleanStep;
    if (nextQty <= 0) {
      removeItem(productId);
    } else {
      setItemQuantity(productId, nextQty);
    }
  }

  /**
   * Remove completamente um produto do carrinho.
   * @param {string} productId
   */
  function removeItem(productId) {
    items = items.filter((i) => i.productId !== productId);
    saveToStorage();
    notify();
  }

  /**
   * Limpa todo o carrinho.
   */
  function clearCart() {
    items = [];
    saveToStorage();
    notify();
  }

  /**
   * Retorna a quantidade atual de um produto específico no carrinho.
   * @param {string} productId
   * @returns {number}
   */
  function getProductQuantity(productId) {
    const found = items.find((i) => i.productId === productId);
    return found ? found.quantity : 0;
  }

  /**
   * Registra um callback disparado sempre que o carrinho muda.
   * @param {Function} callback
   */
  function onChange(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
  }

  /**
   * Inicializa o gerenciador carregando os dados persistidos.
   */
  function init() {
    loadFromStorage();
    notify();
  }

  return {
    init,
    addItem,
    setItemQuantity,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    getProductQuantity,
    getSummary,
    onChange,
    sanitizeQuantity
  };
})();

window.CartManager = CartManager;

