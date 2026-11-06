/**
 * ============================================================================
 * QUITUTES DA VOVÓ LOURIBINHA - CHECKOUT, VALIDAÇÃO E INTEGRAÇÃO WHATSAPP
 * ============================================================================
 * Arquivo: js/checkout.js
 *
 * Responsável por:
 * - Validar os dados do cliente e regras de Entrega vs Retirada.
 * - Exibir a revisão final detalhada do pedido.
 * - Impedir finalização de itens "Consulte o valor" sem ciência prévia do cliente.
 * - Gerar a mensagem dinâmica formatada e redirecionar para o WhatsApp oficial.
 */

const CheckoutManager = (() => {
  /**
   * Formata número de telefone brasileiro enquanto o usuário digita: (11) 99999-9999
   * @param {string} raw
   * @returns {string}
   */
  function formatPhoneInput(raw) {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  /**
   * Converte data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
   * @param {string} isoDate
   * @returns {string}
   */
  function formatDateBR(isoDate) {
    if (!isoDate || typeof isoDate !== 'string') return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  /**
   * Retorna a data mínima permitida (hoje) no formato YYYY-MM-DD
   * @returns {string}
   */
  function getTodayISO() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Valida os dados preenchidos no formulário de checkout.
   * @param {object} formData
   * @param {object} cartSummary
   * @returns {{valid: boolean, errors: Array<{field: string, message: string}>}}
   */
  function validateCheckout(formData, cartSummary) {
    const errors = [];

    if (!cartSummary || cartSummary.isEmpty) {
      errors.push({
        field: 'cart',
        message: 'Seu carrinho está vazio. Adicione pelo menos um produto antes de finalizar.'
      });
      return { valid: false, errors };
    }

    // Validação de quantidades inválidas ou negativas
    const hasInvalidQty = cartSummary.items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0);
    if (hasInvalidQty) {
      errors.push({
        field: 'cart',
        message: 'Existem quantidades inválidas no pedido. Verifique os itens do carrinho.'
      });
    }

    // Validação obrigatória para itens com preço "Consulte o valor"
    if (cartSummary.hasUnconfirmedItems && !formData.consultAcknowledged) {
      errors.push({
        field: 'consultAck',
        message: 'Seu pedido contém itens com preço "Consulte o valor". Marque a confirmação abaixo para prosseguir e consultar o valor pelo WhatsApp.'
      });
    }

    // Nome do cliente
    const cleanName = String(formData.customerName || '').trim();
    if (cleanName.length < 2) {
      errors.push({
        field: 'customerName',
        message: 'Por favor, informe seu nome completo.'
      });
    }

    // Telefone
    const phoneDigits = String(formData.customerPhone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      errors.push({
        field: 'customerPhone',
        message: 'Informe um telefone ou WhatsApp válido com DDD (ex: 11 99999-9999).'
      });
    }

    // Tipo de recebimento
    const deliveryType = formData.deliveryType;
    if (deliveryType !== 'retirada' && deliveryType !== 'entrega') {
      errors.push({
        field: 'deliveryType',
        message: 'Selecione o tipo de recebimento: Retirada ou Entrega.'
      });
    }

    // Endereço exigido SOMENTE se for entrega
    if (deliveryType === 'entrega') {
      const cleanAddress = String(formData.addressStreet || '').trim();
      const cleanNeighborhood = String(formData.addressNeighborhood || '').trim();

      if (cleanAddress.length < 5) {
        errors.push({
          field: 'addressStreet',
          message: 'Informe o endereço completo com rua e número para entrega.'
        });
      }

      if (cleanNeighborhood.length < 2) {
        errors.push({
          field: 'addressNeighborhood',
          message: 'Informe o bairro para entrega.'
        });
      }
    }

    // Data desejada
    const cleanDate = String(formData.desiredDate || '').trim();
    if (!cleanDate) {
      errors.push({
        field: 'desiredDate',
        message: 'Selecione a data desejada para o pedido.'
      });
    } else {
      const todayISO = getTodayISO();
      if (cleanDate < todayISO) {
        errors.push({
          field: 'desiredDate',
          message: 'A data desejada não pode ser anterior a hoje.'
        });
      }
    }

    // Horário desejado
    const cleanTime = String(formData.desiredTime || '').trim();
    if (!cleanTime) {
      errors.push({
        field: 'desiredTime',
        message: 'Informe o horário desejado.'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gera o texto completo da mensagem para o WhatsApp seguindo fielmente o modelo solicitado.
   * @param {object} formData
   * @param {object} cartSummary
   * @returns {string}
   */
  function buildWhatsAppMessage(formData, cartSummary) {
    const lines = [];

    lines.push('Olá! Gostaria de fazer um pedido na Quitutes da Vovó Louribinha! 😊');
    lines.push('');
    lines.push('*RESUMO DO PEDIDO*');
    lines.push('');
    lines.push(`*Cliente:* ${String(formData.customerName || '').trim()}`);
    lines.push(`*Telefone:* ${String(formData.customerPhone || '').trim()}`);
    lines.push('');
    lines.push('*PRODUTOS:*');
    lines.push('');

    cartSummary.items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.fullName}`);
      lines.push(`   Quantidade: ${item.quantity} ${item.unitFormatted}`);
      if (item.isPriceConfirmed && item.subtotalCents !== null) {
        lines.push(`   Valor unitário: ${item.unitPriceDisplay}`);
        lines.push(`   Subtotal: ${item.subtotalFormatted}`);
      } else {
        lines.push('   Subtotal: Consulte o valor');
      }
      lines.push('');
    });

    // Informação sobre regra dos salgadinhos quando aplicável
    if (cartSummary.totalSalgadinhosQty > 0) {
      lines.push(`*Total de Mini Salgados:* ${cartSummary.totalSalgadinhosQty} unidades`);
    }

    // Total de produtos
    if (cartSummary.hasUnconfirmedItems && cartSummary.totalConfirmedCents > 0) {
      lines.push(`*TOTAL DE PRODUTOS CONFIRMADOS: ${cartSummary.totalConfirmedFormatted}*`);
      lines.push('*(+ itens com valor sob consulta)*');
    } else if (cartSummary.hasUnconfirmedItems && cartSummary.totalConfirmedCents === 0) {
      lines.push('*TOTAL DE PRODUTOS: Consulte o valor*');
    } else {
      lines.push(`*TOTAL DE PRODUTOS: ${cartSummary.totalConfirmedFormatted}*`);
    }

    lines.push('');
    lines.push('*ENTREGA/RETIRADA:*');

    if (formData.deliveryType === 'entrega') {
      lines.push('Tipo: Entrega');
      lines.push('');
      lines.push(`Endereço: ${String(formData.addressStreet || '').trim()}`);
      lines.push('');
      lines.push(`Bairro: ${String(formData.addressNeighborhood || '').trim()}`);
      const complement = String(formData.addressComplement || '').trim();
      if (complement) {
        lines.push(`Complemento/Referência: ${complement}`);
      }
      if (window.STORE_CONFIG.deliveryFeeCents !== null) {
        lines.push(`Taxa de entrega: ${window.CurrencyUtils.formatCents(window.STORE_CONFIG.deliveryFeeCents)}`);
      } else {
        lines.push('Taxa de entrega: A consultar');
      }
    } else {
      lines.push('Tipo: Retirada no local');
    }

    lines.push('');
    lines.push('*DATA E HORÁRIO:*');
    lines.push(`Data desejada: ${formatDateBR(formData.desiredDate)}`);
    lines.push(`Horário desejado: ${String(formData.desiredTime || '').trim()}`);

    const notes = String(formData.notes || '').trim();
    lines.push('');
    lines.push('*OBSERVAÇÕES:*');
    lines.push(notes ? notes : 'Nenhuma observação adicional.');

    lines.push('');
    lines.push('Aguardo a confirmação do pedido. Obrigado! ❤️');

    return lines.join('\n');
  }

  /**
   * Gera a URL final codificada com encodeURIComponent para o WhatsApp oficial.
   * @param {string} message
   * @returns {string}
   */
  function buildWhatsAppUrl(message) {
    const encodedMessage = encodeURIComponent(message);
    return `${window.STORE_CONFIG.whatsappBaseUrl}?text=${encodedMessage}`;
  }

  return {
    formatPhoneInput,
    formatDateBR,
    getTodayISO,
    validateCheckout,
    buildWhatsAppMessage,
    buildWhatsAppUrl
  };
})();

window.CheckoutManager = CheckoutManager;

