/* ==========================================================================
   Bengala Supersônica — rota da API de pedidos
   Toda a lógica fica isolada aqui, dentro de um try/catch. Se algo falhar
   (disco cheio, JSON corrompido, etc.), a rota responde 500 de forma
   controlada — o processo do servidor (e, portanto, o site principal
   servido por ele) continua de pé.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ARQUIVO_PEDIDOS = path.join(__dirname, '..', 'data', 'pedidos.json');

const CAMPOS_OBRIGATORIOS = ['nome', 'telefone', 'email', 'endereco', 'altura', 'mao'];

function validarPedido(dados) {
    const erros = {};

    if (!dados || typeof dados !== 'object') {
        return { valido: false, erros: { geral: 'Corpo da requisição inválido.' } };
    }

    CAMPOS_OBRIGATORIOS.forEach(function (campo) {
        const valor = dados[campo];
        if (typeof valor !== 'string' || !valor.trim()) {
            erros[campo] = 'Campo obrigatório.';
        }
    });

    if (dados.email && typeof dados.email === 'string') {
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim());
        if (!emailValido) {
            erros.email = 'E-mail inválido.';
        }
    }

    return { valido: Object.keys(erros).length === 0, erros: erros };
}

function sanitizarTexto(valor, limite) {
    if (typeof valor !== 'string') return '';
    return valor.trim().slice(0, limite || 500);
}

function lerPedidosExistentes() {
    try {
        if (!fs.existsSync(ARQUIVO_PEDIDOS)) {
            return [];
        }
        const conteudo = fs.readFileSync(ARQUIVO_PEDIDOS, 'utf8');
        if (!conteudo.trim()) return [];
        const dados = JSON.parse(conteudo);
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        // Se o arquivo estiver corrompido ou ilegível, não travamos a
        // requisição: apenas seguimos com uma lista vazia e registramos
        // o problema para investigação manual depois.
        console.error('[api/pedido] não foi possível ler pedidos existentes:', erro.message);
        return [];
    }
}

function salvarPedido(pedido) {
    const pasta = path.dirname(ARQUIVO_PEDIDOS);
    if (!fs.existsSync(pasta)) {
        fs.mkdirSync(pasta, { recursive: true });
    }

    const pedidosExistentes = lerPedidosExistentes();
    pedidosExistentes.push(pedido);

    fs.writeFileSync(ARQUIVO_PEDIDOS, JSON.stringify(pedidosExistentes, null, 2), 'utf8');
}

// Handler principal. Expresso como função pura (req, res) para poder ser
// usada tanto com Express quanto adaptada a uma função serverless
// (Vercel/Netlify), caso o site seja hospedado assim no futuro.
function handlerPedido(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ ok: false, erro: 'Método não permitido.' });
            return;
        }

        const { valido, erros } = validarPedido(req.body);

        if (!valido) {
            res.status(400).json({ ok: false, erro: 'Dados inválidos.', campos: erros });
            return;
        }

        const pedido = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            criadoEm: new Date().toISOString(),
            nome: sanitizarTexto(req.body.nome, 120),
            telefone: sanitizarTexto(req.body.telefone, 40),
            email: sanitizarTexto(req.body.email, 120),
            endereco: sanitizarTexto(req.body.endereco, 240),
            altura: sanitizarTexto(req.body.altura, 40),
            mao: sanitizarTexto(req.body.mao, 40),
            mensagem: sanitizarTexto(req.body.mensagem, 800)
        };

        salvarPedido(pedido);

        res.status(201).json({ ok: true, mensagem: 'Pedido recebido com sucesso.', id: pedido.id });
    } catch (erroInesperado) {
        // Qualquer falha não prevista (disco cheio, permissão de arquivo,
        // etc.) cai aqui. Respondemos 500 de forma controlada em vez de
        // deixar o processo do servidor quebrar.
        console.error('[api/pedido] erro inesperado ao processar pedido:', erroInesperado);
        res.status(500).json({ ok: false, erro: 'Erro interno ao processar o pedido. Tente novamente em instantes.' });
    }
}

module.exports = { handlerPedido, validarPedido };