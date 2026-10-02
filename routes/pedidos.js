const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
    const { cliente_id } = req.body;

    if (!cliente_id) {
        return res.status(400).json({
            mensagem: 'cliente_id é obrigatório.'
        });
    }

    try {
        const [cliente] = await db.execute(
            'SELECT id FROM clientes WHERE id = ?',
            [cliente_id]
        );

        if (cliente.length === 0) {
            return res.status(404).json({
                mensagem: 'Cliente não encontrado.'
            });
        }

        const [result] = await db.execute(
            'INSERT INTO pedidos (cliente_id) VALUES (?)',
            [cliente_id]
        );

        res.status(201).json({
            id: result.insertId,
            cliente_id,
            status: 'pendente',
            valor_total: 0
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao criar pedido.',
            detalhes: error.message
        });
    }
});

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT
                pedidos.id,
                pedidos.cliente_id,
                pedidos.data_pedido,
                pedidos.status,
                pedidos.valor_total,
                clientes.nome AS cliente_nome,
                clientes.email AS cliente_email
            FROM pedidos
            INNER JOIN clientes
                ON pedidos.cliente_id = clientes.id
            ORDER BY pedidos.id
        `);

        res.status(200).json(rows);

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao buscar pedidos.',
            detalhes: error.message
        });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [pedidos] = await db.execute(`
            SELECT
                pedidos.id,
                pedidos.cliente_id,
                pedidos.data_pedido,
                pedidos.status,
                pedidos.valor_total,
                clientes.nome AS cliente_nome,
                clientes.email AS cliente_email
            FROM pedidos
            INNER JOIN clientes
                ON pedidos.cliente_id = clientes.id
            WHERE pedidos.id = ?
        `, [id]);

        if (pedidos.length === 0) {
            return res.status(404).json({
                mensagem: 'Pedido não encontrado.'
            });
        }

        const [itens] = await db.execute(`
            SELECT
                itens_pedido.id,
                itens_pedido.pedido_id,
                itens_pedido.produto_id,
                produtos.nome AS produto_nome,
                itens_pedido.quantidade,
                itens_pedido.preco_unitario
            FROM itens_pedido
            INNER JOIN produtos
                ON itens_pedido.produto_id = produtos.id
            WHERE itens_pedido.pedido_id = ?
        `, [id]);

        res.status(200).json({
            pedido: pedidos[0],
            itens: itens
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao buscar pedido.',
            detalhes: error.message
        });
    }
});

router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const statusPermitidos = ['pendente', 'pago', 'cancelado'];

    if (!status || !statusPermitidos.includes(status)) {
        return res.status(400).json({
            mensagem: 'Status inválido.'
        });
    }

    try {
        const [result] = await db.execute(
            'UPDATE pedidos SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Pedido não encontrado.'
            });
        }

        res.status(200).json({
            mensagem: 'Status do pedido atualizado com sucesso.'
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao atualizar status.',
            detalhes: error.message
        });
    }
});

router.post('/:id/itens', async (req, res) => {
    const { id } = req.params;
    const { produto_id, quantidade, preco_unitario } = req.body;

    if (!produto_id || !quantidade || preco_unitario === undefined) {
        return res.status(400).json({
            mensagem: 'produto_id, quantidade e preco_unitario são obrigatórios.'
        });
    }

    try {
        const [pedido] = await db.execute(
            'SELECT id FROM pedidos WHERE id = ?',
            [id]
        );

        if (pedido.length === 0) {
            return res.status(404).json({
                mensagem: 'Pedido não encontrado.'
            });
        }

        const [produto] = await db.execute(
            'SELECT id FROM produtos WHERE id = ?',
            [produto_id]
        );

        if (produto.length === 0) {
            return res.status(404).json({
                mensagem: 'Produto não encontrado.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO itens_pedido
             (pedido_id, produto_id, quantidade, preco_unitario)
             VALUES (?, ?, ?, ?)`,
            [id, produto_id, quantidade, preco_unitario]
        );

        await db.execute(`
            UPDATE pedidos
            SET valor_total = (
                SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
                FROM itens_pedido
                WHERE pedido_id = ?
            )
            WHERE id = ?
        `, [id, id]);

        res.status(201).json({
            id: result.insertId,
            pedido_id: id,
            produto_id,
            quantidade,
            preco_unitario
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao adicionar item.',
            detalhes: error.message
        });
    }
});

router.delete('/:id_pedido/itens/:id_item', async (req, res) => {
    const { id_pedido, id_item } = req.params;

    try {
        const [result] = await db.execute(
            `DELETE FROM itens_pedido
             WHERE id = ? AND pedido_id = ?`,
            [id_item, id_pedido]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Item não encontrado no pedido.'
            });
        }

        await db.execute(`
            UPDATE pedidos
            SET valor_total = (
                SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
                FROM itens_pedido
                WHERE pedido_id = ?
            )
            WHERE id = ?
        `, [id_pedido, id_pedido]);

        res.status(200).json({
            mensagem: 'Item removido com sucesso.'
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao remover item.',
            detalhes: error.message
        });
    }
});

module.exports = router;