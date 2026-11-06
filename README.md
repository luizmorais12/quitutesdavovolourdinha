# Quitutes da Vovó Lourdinha — Cardápio Digital + Carrinho + Pedidos via WhatsApp

Cardápio digital completo, responsivo e funcional desenvolvido exclusivamente com **HTML5, CSS3 e JavaScript puro (Vanilla JS)** para a **Quitutes da Vovó Lourdinha**.

---

## 1. Estrutura de Arquivos

```text
quitutes-vovo-lourdinha/
│
├── index.html          # Estrutura semântica da página inicial, cardápio, drawer e checkout
│
├── css/
│   └── style.css       # Identidade visual, responsividade mobile-first e animações
│
├── js/
│   ├── products.js     # Catálogo centralizado de produtos, categorias, imagens e regras de preço
│   ├── cart.js         # Lógica do carrinho, cálculos em centavos inteiros e persistência (localStorage)
│   ├── checkout.js     # Validação de dados, revisão final e geração da mensagem para WhatsApp
│   └── main.js         # Renderização dinâmica da interface, filtros e eventos
│
├── assets/
│   ├── logo.png                # Logo oficial da Quitutes da Vovó Lourdinha
│   └── images/
│       └── mini-salgados.jpg   # Fotografia real dos mini salgados fornecida pela proprietária
│
└── README.md
```

---

## 2. Identidade Visual e Paleta Oficial

- **Laranja (`#FF6B00`):** Cor predominante nos botões de ação, seletores e destaques.
- **Verde (`#20B94B`):** Etiquetas de preço do cento, indicadores de confirmação e botão de envio pelo WhatsApp.
- **Creme (`#F8F0E5`):** Fundo principal acolhedor com ilustrações discretas de salgados e doces.
- **Marrom (`#8B352B`):** Tipografia de títulos, detalhes tradicionais e rodapé.
- **Branco (`#FFFFFF`):** Cards de produtos, painel lateral do carrinho e revisão do pedido.

### Como adicionar a Logo e a Fotografia dos Produtos
Basta salvar os arquivos originais enviados pela proprietária nos seguintes caminhos:
1. **Logo oficial:** `assets/logo.png`
2. **Fotografia dos mini salgados:** `assets/images/mini-salgados.jpg`

*(Enquanto os arquivos de imagem não estiverem presentes na pasta `assets/`, o sistema exibe automaticamente um estado visual elegante da marca sem quebrar o layout e sem substituir a identidade original).*

---

## 3. Regras Comerciais e Cálculos Monetários

Todos os cálculos são realizados em **centavos inteiros** (`integer cents`) no arquivo `js/cart.js`, evitando qualquer erro de precisão com casas decimais.

### Regra dos Mini Salgados (Configurável em `js/products.js`)
- **Quantidades inferiores a 100 unidades:** `R$ 0,75` por unidade (`75` centavos).
  - *Exemplo oficial:* 15 Mini coxinhas + 10 Bolinhas de queijo + 15 Mini quibes = **40 unidades** → **R$ 30,00**.
- **100 unidades (1 cento):** `R$ 65,00` (`6500` centavos, podendo misturar sabores).
- **Pastéis, Esfihas e Doces:** Apresentados como **"Consulte o valor"** (`priceConfirmed: false`). O sistema informa o cliente e solicita ciência antes de enviar pedidos com itens sob consulta para o WhatsApp.

---

## 4. Como Alterar Preços ou Cadastrar Novos Produtos

Abra o arquivo `js/products.js`:

1. **Para confirmar o preço de um Pastel, Esfiha ou Doce:**
   Localize o produto no array `PRODUCTS` e altere:
   ```js
   priceConfirmed: true,
   pricingType: 'fixed',
   priceCents: 600 // Exemplo: R$ 6,00 em centavos inteiros
   ```
2. **Para alterar o preço do cento ou da unidade dos salgadinhos:**
   Edite o objeto `SALGADINHOS_PRICING_RULE` no topo de `js/products.js`:
   ```js
   const SALGADINHOS_PRICING_RULE = {
     categoryId: 'salgadinhos',
     unitPriceBelow100Cents: 75, // R$ 0,75
     centoQuantity: 100,         // 100 unidades
     centoPriceCents: 6500,      // R$ 65,00
     centoUnitPriceCents: 65,
     above100Mode: 'cento_plus_avulso',
     quickQuantities: [10, 15, 25, 50, 100]
   };
   ```

---

## 5. Integração com WhatsApp

- **Número configurado:** `+55 11 94796-0798` (`https://wa.me/5511947960798`)
- A mensagem é montada dinamicamente em `js/checkout.js` e codificada com `encodeURIComponent`, incluindo resumo de itens, quantidades, subtotais, total geral, tipo de recebimento (Entrega com endereço completo ou Retirada sem exigir endereço), data/horário desejados e observações.

"# quitutesdavovolourdinha" 
