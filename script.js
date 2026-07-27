/* ==========================================================================
   Bengala Supersônica — script do formulário de pedido
   Este arquivo só é carregado em formulario.html. Ele é escrito para nunca
   lançar um erro não tratado: qualquer problema aqui fica contido nesta
   página e não afeta o restante do site (index.html não referencia este
   arquivo em nenhum momento).
   ========================================================================== */

(function () {
    'use strict';

    // URL da API. Em produção isso normalmente viria de uma env/config,
    // mas aqui deixamos relativo para funcionar em qualquer host que sirva
    // tanto o front quanto a pasta /api.
    var API_URL = '/api/pedido';

    function iniciar() {
        var form = document.getElementById('pedido-form');

        // Guarda de segurança: se por qualquer motivo este script for
        // carregado numa página sem o formulário (ex: index.html no futuro),
        // ele simplesmente não faz nada, em vez de lançar erro.
        if (!form) {
            return;
        }

        var sucesso = document.getElementById('form-sucesso');
        var aviso = document.getElementById('form-offline-aviso');
        var botao = form.querySelector('.form-btn');
        var textoBotaoOriginal = botao ? botao.textContent : '';

        function mostrarAviso(mensagem) {
            if (!aviso) return;
            if (mensagem) {
                var primeiroFilho = aviso.firstChild;
                if (primeiroFilho && primeiroFilho.nodeType === Node.TEXT_NODE) {
                    primeiroFilho.textContent = mensagem + ' ';
                }
            }
            aviso.classList.add('form-offline-aviso--visivel');
            window.clearTimeout(aviso._timeoutId);
            aviso._timeoutId = window.setTimeout(function () {
                aviso.classList.remove('form-offline-aviso--visivel');
            }, 8000);
        }

        function definirCarregando(carregando) {
            if (!botao) return;
            botao.disabled = carregando;
            botao.textContent = carregando ? 'Enviando...' : textoBotaoOriginal;
        }

        function validarCampo(campo) {
            var erro = campo.parentElement ? campo.parentElement.querySelector('.form-erro') : null;

            if (!campo.value || !campo.value.trim()) {
                campo.classList.add('form-invalido');
                if (erro) erro.textContent = 'Preencha este campo.';
                return false;
            }

            if (campo.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campo.value)) {
                campo.classList.add('form-invalido');
                if (erro) erro.textContent = 'Informe um e-mail válido.';
                return false;
            }

            campo.classList.remove('form-invalido');
            if (erro) erro.textContent = '';
            return true;
        }

        function validarFormulario() {
            var valido = true;
            var campos = form.querySelectorAll('[required]');

            campos.forEach(function (campo) {
                if (!validarCampo(campo)) {
                    valido = false;
                }
            });

            return valido;
        }

        function coletarDados() {
            var dados = {};
            var elementos = form.querySelectorAll('input, select, textarea');

            elementos.forEach(function (campo) {
                if (campo.name) {
                    dados[campo.name] = campo.value;
                }
            });

            return dados;
        }

        function mostrarSucesso() {
            form.style.display = 'none';
            if (sucesso) {
                sucesso.classList.add('form-sucesso--visivel');
            }
        }

        function enviarPedido(dados) {
            // fetch pode não existir em navegadores muito antigos: nesse
            // caso, tratamos como falha "de rede" e caímos no fallback.
            if (typeof fetch !== 'function') {
                return Promise.reject(new Error('fetch indisponível neste navegador'));
            }

            var controller = (typeof AbortController === 'function') ? new AbortController() : null;
            var timeoutId = controller ? window.setTimeout(function () {
                controller.abort();
            }, 12000) : null;

            return fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
                signal: controller ? controller.signal : undefined
            }).then(function (resposta) {
                if (timeoutId) window.clearTimeout(timeoutId);

                if (!resposta.ok) {
                    throw new Error('Resposta da API com status ' + resposta.status);
                }

                return resposta.json().catch(function () {
                    // Se o corpo não for JSON válido, ainda consideramos
                    // sucesso, já que o status HTTP foi ok.
                    return {};
                });
            }).catch(function (erro) {
                if (timeoutId) window.clearTimeout(timeoutId);
                throw erro;
            });
        }

        form.addEventListener('submit', function (evento) {
            evento.preventDefault();

            try {
                if (!validarFormulario()) {
                    return;
                }

                var dados = coletarDados();
                definirCarregando(true);

                enviarPedido(dados)
                    .then(function () {
                        definirCarregando(false);
                        mostrarSucesso();
                    })
                    .catch(function (erro) {
                        // Qualquer falha de rede, timeout, ou erro do
                        // servidor cai aqui. O usuário nunca vê uma tela
                        // quebrada — só um aviso com um caminho alternativo.
                        definirCarregando(false);
                        mostrarAviso('Não foi possível enviar pelo site agora.');
                        if (window.console && console.warn) {
                            console.warn('[formulario] falha ao enviar pedido:', erro);
                        }
                    });
            } catch (erroInesperado) {
                // Rede de segurança final: nada aqui deve travar a página.
                definirCarregando(false);
                mostrarAviso('Algo deu errado ao enviar o formulário.');
                if (window.console && console.error) {
                    console.error('[formulario] erro inesperado:', erroInesperado);
                }
            }
        });

        form.querySelectorAll('input, select, textarea').forEach(function (campo) {
            campo.addEventListener('input', function () {
                campo.classList.remove('form-invalido');
                var erro = campo.parentElement ? campo.parentElement.querySelector('.form-erro') : null;
                if (erro) erro.textContent = '';
            });
        });
    }

    // Tudo é envolvido em try/catch: se algo inesperado acontecer durante
    // a inicialização, o erro é registrado no console mas nunca propaga
    // para o restante da página ou para outras páginas do site.
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', iniciar);
        } else {
            iniciar();
        }
    } catch (erro) {
        if (window.console && console.error) {
            console.error('[formulario] falha ao iniciar script:', erro);
        }
    }
})();