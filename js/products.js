/**
 * ============================================================================
 * QUITUTES DA VOVÓ LOURIBINHA - CATÁLOGO E REGRAS COMERCIAIS CENTRALIZADAS
 * ============================================================================
 * Arquivo: js/products.js
 *
 * Este arquivo centraliza todas as informações comerciais, configurações da
 * loja, categorias, produtos, imagens e regras de preço (em centavos inteiros).
 * Para atualizar preços, fotos ou adicionar novos produtos no futuro,
 * basta editar este arquivo.
 */

const STORE_CONFIG = {
  brandName: 'Quitutes da Vovó Louribinha',
  tagline: 'Um sabor especial para cada momento!',
  subtitle: 'Quitutes preparados com carinho para deixar seus momentos ainda mais gostosos.',
  whatsappNumber: '5511947960798',
  whatsappDisplay: '+55 11 94796-0798',
  whatsappBaseUrl: 'https://wa.me/5511947960798',
  logoPath: 'assets/logo.png',
  featuredProductImage: 'assets/images/mini-salgados.jpg',
  storageKey: 'vovo_louribinha_cart_v1',
  // Taxa de entrega: null significa não pré-fixada (a consultar conforme o bairro).
  // Caso a proprietária defina uma taxa fixa no futuro, informe em centavos (ex: 1000 = R$ 10,00).
  deliveryFeeCents: null
};

/**
 * Regra comercial oficial dos Salgadinhos (valores em centavos inteiros):
 * - Quantidades inferiores a 100 unidades: R$ 0,75 por unidade (75 centavos)
 * - 100 unidades (1 cento): R$ 65,00 (6500 centavos, equivalente a R$ 0,65/un)
 *
 * Configuração para quantidades acima de 100 unidades (above100Mode):
 * - 'cento_plus_avulso': Aplica R$ 65,00 para cada grupo fechado de 100 unidades
 *   e R$ 0,75 para as unidades excedentes (< 100), sinalizando que combinações
 *   acima de 100 unidades passam pela confirmação da proprietária.
 * - 'consult': Exibe quantidades > 100 como "Consulte o valor" (exige aviso antes de finalizar).
 */
const SALGADINHOS_PRICING_RULE = {
  categoryId: 'salgadinhos',
  unitPriceBelow100Cents: 75, // R$ 0,75
  centoQuantity: 100,         // 100 unidades
  centoPriceCents: 6500,      // R$ 65,00
  centoUnitPriceCents: 65,    // R$ 0,65 por unidade quando fecha 100 unidades
  above100Mode: 'cento_plus_avulso',
  quickQuantities: [10, 15, 25, 50, 100]
};

/**
 * Categorias oficiais do cardápio
 */
const CATEGORIES = [
  {
    id: 'todos',
    name: 'Todos os Quitutes',
    shortName: 'Todos',
    icon: 'sparkles',
    description: 'Confira todas as delícias caseiras preparadas com carinho pela Vovó Louribinha.'
  },
  {
    id: 'salgadinhos',
    name: 'Salgadinhos',
    shortName: 'Salgadinhos',
    icon: 'salgado',
    badge: 'R$ 65,00 o cento | R$ 0,75 un.',
    description: 'Mini salgados sequinhos, crocantes por fora e bem recheados. Você pode misturar os sabores no seu pedido!'
  },
  {
    id: 'pasteis',
    name: 'Pastéis',
    shortName: 'Pastéis',
    icon: 'pastel',
    badge: 'Consulte o valor',
    description: 'Pastéis caseiros com massa crocante e recheios preparados com tempero de família.'
  },
  {
    id: 'esfihas',
    name: 'Esfihas',
    shortName: 'Esfihas',
    icon: 'esfiha',
    badge: 'Consulte o valor',
    description: 'Esfihas macias e saborosas, feitas com ingredientes selecionados e muito capricho.'
  },
  {
    id: 'doces',
    name: 'Doces',
    shortName: 'Doces',
    icon: 'doce',
    badge: 'Consulte o valor',
    description: 'Doces caseiros tradicionais para adoçar suas festas, comemorações e momentos especiais.'
  }
];

/**
 * Catálogo centralizado de produtos.
 *
 * Observações importantes:
 * - Os salgadinhos utilizam a regra comercial configurada em SALGADINHOS_PRICING_RULE
 *   (pricingType: 'salgadinhos_rule') e a fotografia real dos mini salgados.
 * - Pastéis, esfihas e doces possuem priceConfirmed: false ("Consulte o valor"),
 *   conforme orientação comercial atual da proprietária.
 * - Para definir um preço fixo confirmado no futuro, basta alterar:
 *   priceConfirmed: true,
 *   pricingType: 'fixed',
 *   priceCents: 500 // Exemplo: R$ 5,00 em centavos inteiros
 */
const PRODUCTS = [
  // ==========================================================================
  // 1. SALGADINHOS (Preços confirmados: R$ 0,75/un até 99 un | R$ 65,00 o cento)
  // ==========================================================================
  {
    id: 'salg-coxinha',
    name: 'Coxinha',
    fullName: 'Mini Coxinha',
    categoryId: 'salgadinhos',
    description: 'Massa leve e douradinha com recheio suculento de frango desfiado temperado no capricho caseiro da Vovó.',
    image: 'assets/images/mini-salgados.jpg',
    imageFocalPoint: '42% 62%',
    unitLabel: 'unidade / cento',
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    defaultAddQty: 15,
    priceConfirmed: true,
    pricingType: 'salgadinhos_rule',
    priceCents: 75,
    centoPriceCents: 6500,
    featured: true,
    tag: 'Mais pedido'
  },
  {
    id: 'salg-bolinha-queijo',
    name: 'Bolinha de queijo',
    fullName: 'Bolinha de Queijo',
    categoryId: 'salgadinhos',
    description: 'Crocante por fora e com recheio generoso de queijo derretido que conquista crianças e adultos.',
    image: 'assets/images/mini-salgados.jpg',
    imageFocalPoint: '45% 24%',
    unitLabel: 'unidade / cento',
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    defaultAddQty: 10,
    priceConfirmed: true,
    pricingType: 'salgadinhos_rule',
    priceCents: 75,
    centoPriceCents: 6500,
    featured: true,
    tag: 'Clássico'
  },
  {
    id: 'salg-risoles',
    name: 'Risoles',
    fullName: 'Mini Risoles',
    categoryId: 'salgadinhos',
    description: 'Massa macia e empanamento sequinho com recheio cremoso e sabor tradicional de comida de vó.',
    image: 'assets/images/mini-salgados.jpg',
    imageFocalPoint: '55% 86%',
    unitLabel: 'unidade / cento',
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    defaultAddQty: 15,
    priceConfirmed: true,
    pricingType: 'salgadinhos_rule',
    priceCents: 75,
    centoPriceCents: 6500,
    featured: false,
    tag: 'Cremoso'
  },
  {
    id: 'salg-carne',
    name: 'Carne',
    fullName: 'Mini Salgado de Carne',
    categoryId: 'salgadinhos',
    description: 'Salgadinho recheado com carne moída bem temperada, preparado com ingredientes fresquinhos.',
    image: 'assets/images/mini-salgados.jpg',
    imageFocalPoint: '68% 76%',
    unitLabel: 'unidade / cento',
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    defaultAddQty: 15,
    priceConfirmed: true,
    pricingType: 'salgadinhos_rule',
    priceCents: 75,
    centoPriceCents: 6500,
    featured: false,
    tag: 'Caseiro'
  },
  {
    id: 'salg-calabresa',
    name: 'Calabresa',
    fullName: 'Mini Salgado de Calabresa',
    categoryId: 'salgadinhos',
    description: 'Sabor marcante de calabresa selecionada em uma massa leve e dourada na medida certa.',
    image: 'assets/images/mini-salgados.jpg',
    imageFocalPoint: '28% 45%',
    unitLabel: 'unidade / cento',
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    defaultAddQty: 15,
    priceConfirmed: true,
    pricingType: 'salgadinhos_rule',
    priceCents: 75,
    centoPriceCents: 6500,
    featured: false,
    tag: 'Saboroso'
  },
  {
    id: 'salg-kibe',
    name: 'Kibe',
    fullName: 'Mini Quibe',
    categoryId: 'salgadinhos',
    description: 'Quibe tradicional bem temperado com toque caseiro, sequinho por fora e macio por dentro.',
    image: 'assets/images/mini-salgados.jpg',
    imageFocalPoint: '82% 40%',
    unitLabel: 'unidade / cento',
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    defaultAddQty: 15,
    priceConfirmed: true,
    pricingType: 'salgadinhos_rule',
    priceCents: 75,
    centoPriceCents: 6500,
    featured: true,
    tag: 'Tradicional'
  },

  // ==========================================================================
  // 2. PASTÉIS (Preços a confirmar -> "Consulte o valor")
  // ==========================================================================
  {
    id: 'pastel-encomenda',
    name: 'Pastéis Caseiros (Sabores sob consulta)',
    fullName: 'Pastéis Caseiros',
    categoryId: 'pasteis',
    description: 'Pastéis fresquinhos preparados sob encomenda. Adicione ao pedido e informe nas observações os sabores desejados para consultar valores e disponibilidade.',
    image: null,
    unitLabel: 'sob consulta',
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    defaultAddQty: 10,
    priceConfirmed: false,
    pricingType: 'consult',
    priceCents: null,
    featured: false,
    tag: 'Consulte o valor'
  },

  // ==========================================================================
  // 3. ESFIHAS (Preços a confirmar -> "Consulte o valor")
  // ==========================================================================
  {
    id: 'esfiha-encomenda',
    name: 'Esfihas Caseiras (Sabores sob consulta)',
    fullName: 'Esfihas Caseiras',
    categoryId: 'esfihas',
    description: 'Esfihas macias e bem recheadas feitas com carinho. Adicione ao pedido e indique nas observações sua preferência para consultar valores com a Vovó Louribinha.',
    image: null,
    unitLabel: 'sob consulta',
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    defaultAddQty: 10,
    priceConfirmed: false,
    pricingType: 'consult',
    priceCents: null,
    featured: false,
    tag: 'Consulte o valor'
  },

  // ==========================================================================
  // 4. DOCES (Preços a confirmar -> "Consulte o valor")
  // ==========================================================================
  {
    id: 'doce-encomenda',
    name: 'Doces Caseiros (Sabores sob consulta)',
    fullName: 'Doces Caseiros',
    categoryId: 'doces',
    description: 'Doces feitos com receita de família para deixar seu momento mais doce. Adicione ao seu pedido e consulte os sabores disponíveis e valores pelo WhatsApp.',
    image: null,
    unitLabel: 'sob consulta',
    unitSingular: 'unidade',
    unitPlural: 'unidades',
    defaultAddQty: 10,
    priceConfirmed: false,
    pricingType: 'consult',
    priceCents: null,
    featured: false,
    tag: 'Consulte o valor'
  }
];

/**
 * Funções utilitárias de moeda e formatação (sempre em centavos inteiros)
 */
const CurrencyUtils = {
  /**
   * Converte centavos inteiros para string formatada em Real (ex: 3000 -> "R$ 30,00")
   * @param {number|null} cents
   * @returns {string}
   */
  formatCents(cents) {
    if (cents === null || cents === undefined || Number.isNaN(Number(cents))) {
      return 'Consulte o valor';
    }
    const safeCents = Math.round(Number(cents));
    const isNegative = safeCents < 0;
    const absCents = Math.abs(safeCents);
    const reais = Math.floor(absCents / 100);
    const centavos = String(absCents % 100).padStart(2, '0');
    const reaisFormatted = reais.toLocaleString('pt-BR');
    return `${isNegative ? '-' : ''}R$ ${reaisFormatted},${centavos}`;
  },

  /**
   * Busca um produto pelo ID
   * @param {string} productId
   * @returns {object|undefined}
   */
  getProductById(productId) {
    return PRODUCTS.find((p) => p.id === productId);
  },

  /**
   * Busca uma categoria pelo ID
   * @param {string} categoryId
   * @returns {object|undefined}
   */
  getCategoryById(categoryId) {
    return CATEGORIES.find((c) => c.id === categoryId);
  }
};

// Exporta no escopo global para uso pelos demais módulos Vanilla JS
window.STORE_CONFIG = STORE_CONFIG;
window.SALGADINHOS_PRICING_RULE = SALGADINHOS_PRICING_RULE;
window.CATEGORIES = CATEGORIES;
window.PRODUCTS = PRODUCTS;
window.CurrencyUtils = CurrencyUtils;

