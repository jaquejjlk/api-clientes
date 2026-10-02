const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
    const { nome, email, senha, perfil, status } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            mensagem: 'Nome, email e senha são obrigatórios.'
        });
    }

    try {
        const [result] = await db.execute(
            `INSERT INTO usuarios (nome, email, senha, perfil, status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                nome,
                email,
                senha,
                perfil || 'operador',
                status || 'ativo'
            ]
        );

        res.status(201).json({
            id: result.insertId,
            nome,
            email,
            perfil: perfil || 'operador',
            status: status || 'ativo'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                mensagem: 'Email já cadastrado.'
            });
        }

        res.status(500).json({
            mensagem: 'Erro ao cadastrar usuário.',
            detalhes: error.message
        });
    }
});

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, nome, email, perfil, status, criado_em FROM usuarios'
        );

        res.status(200).json(rows);

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao buscar usuários.',
            detalhes: error.message
        });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.execute(
            'SELECT id, nome, email, perfil, status, criado_em FROM usuarios WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao buscar usuário.',
            detalhes: error.message
        });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, senha, perfil, status } = req.body;

    if (!nome || !email || !senha || !perfil || !status) {
        return res.status(400).json({
            mensagem: 'Nome, email, senha, perfil e status são obrigatórios.'
        });
    }

    try {
        const [result] = await db.execute(
            `UPDATE usuarios
             SET nome = ?, email = ?, senha = ?, perfil = ?, status = ?
             WHERE id = ?`,
            [nome, email, senha, perfil, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        res.status(200).json({
            mensagem: 'Usuário atualizado completamente com sucesso.'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                mensagem: 'Email já cadastrado.'
            });
        }

        res.status(500).json({
            mensagem: 'Erro ao atualizar usuário.',
            detalhes: error.message
        });
    }
});

router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const campos = req.body;

    if (Object.keys(campos).length === 0) {
        return res.status(400).json({
            mensagem: 'Nenhum campo fornecido para atualização.'
        });
    }

    const permitidos = ['nome', 'email', 'senha', 'perfil', 'status'];
    const setClauses = [];
    const queryParams = [];

    for (const [chave, valor] of Object.entries(campos)) {
        if (permitidos.includes(chave)) {
            setClauses.push(`${chave} = ?`);
            queryParams.push(valor);
        }
    }

    if (setClauses.length === 0) {
        return res.status(400).json({
            mensagem: 'Nenhum campo válido enviado.'
        });
    }

    queryParams.push(id);

    try {
        const [result] = await db.execute(
            `UPDATE usuarios SET ${setClauses.join(', ')} WHERE id = ?`,
            queryParams
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        res.status(200).json({
            mensagem: 'Usuário atualizado parcialmente com sucesso.'
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                mensagem: 'Email já cadastrado.'
            });
        }

        res.status(500).json({
            mensagem: 'Erro ao atualizar usuário.',
            detalhes: error.message
        });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.execute(
            'DELETE FROM usuarios WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        res.status(200).json({
            mensagem: 'Usuário removido com sucesso.'
        });

    } catch (error) {
        res.status(500).json({
            mensagem: 'Erro ao remover usuário.',
            detalhes: error.message
        });
    }
});

module.exports = router;