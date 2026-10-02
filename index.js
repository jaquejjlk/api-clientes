const express = require('express');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json()); // Permite receber dados em formato JSON

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
 console.log(`Servidor rodando na porta ${PORT}`);
});

app.post('/clientes', async (req, res) => {
    const { nome, email, telefone } = req.body;
    if (!nome || !email) {
        return res.status(400).json({ mensagem: 'Nome e email são obrigatórios.' });
    }
    
    try {
        const [result] = await db.execute(
            'INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)',
            [nome, email, telefone || null]
        );
        
        res.status(201).json({
            id: result.insertId,
            nome,
            email,
            telefone,
            status: 'ativo'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ mensagem: 'Email já cadastrado.'

            });
        }
        res.status(500).json({ mensagem: 'Erro interno no servidor.',
    detalhes: error.message });
        }
    });
    
    // Listar todos os clientes
    app.get('/clientes', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM clientes');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar clientes.',
    detalhes: error.message });
    }
    });

    // Buscar cliente específico por ID
    app.get('/clientes/:id', async (req, res) => {
        const { id } = req.params;
    
    try {
        const [rows] = await db.execute('SELECT * FROM clientes WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar o cliente.',
    detalhes: error.message });
    }
});

app.put('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, status } = req.body;
    
    // Validação estrita dos campos requeridos no PUT
    if (!nome || !email || !status) {
        return res.status(400).json({
            mensagem: 'Para atualização completa (PUT), informe: nome, email e status.'
        });
    }
    
    try {
        const [result] = await db.execute(
            'UPDATE clientes SET nome = ?, email = ?, telefone = ?, status = ? WHERE id = ?',
            [nome, email, telefone || null, status, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }
        
        res.status(200).json({ mensagem: 'Cliente atualizado completamente com sucesso.' });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao atualizar cliente.',
    detalhes: error.message });
    }
});

app.patch('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const campos = req.body;
    
    if (Object.keys(campos).length === 0) {
        return res.status(400).json({ mensagem: 'Nenhum campo fornecido para atualização.' });
    }
    
    // Constrói dinamicamente os fragmentos da instrução SQL e os parâmetros
    const setClauses = [];
    const queryParams = [];
    
    for (const [chave, valor] of Object.entries(campos)) {
        // Permite atualização apenas de colunas autorizadas
        if (['nome', 'email', 'telefone', 'status'].includes(chave)) {
            setClauses.push(`${chave} = ?`);
            queryParams.push(valor);
        }
    }
    
    if (setClauses.length === 0) {
        return res.status(400).json({ mensagem: 'Nenhum campo válido enviado.' });
    }
    
    queryParams.push(id); // Adiciona o ID no final dos parâmetros da query
    
    const sql = `UPDATE clientes SET ${setClauses.join(', ')} WHERE id = ?`;
    
    try {
        const [result] = await db.execute(sql, queryParams);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }
        
        res.status(200).json({ mensagem: 'Cliente atualizado parcialmente com sucesso.' });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao atualizar parcialmente o cliente.', detalhes: error.message });
    }
});

app.delete('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.execute('DELETE FROM clientes WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }
        
        res.status(200).json({ mensagem: 'Cliente removido com sucesso.'
        });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao remover cliente.', 
    detalhes: error.message });
    }
});

const express = require('express');
require('dotenv').config();

// Importação das rotas
const clientesRouter = require('./routes/clientes');
const produtosRouter = require('./routes/produtos');

const app = express();
app.use(express.json());

// Vinculação dos roteadores aos seus respectivos prefixos de URL
app.use('/clientes', clientesRouter);
app.use('/produtos', produtosRouter);

// Tratamento de rota não encontrada (404)
app.use((req, res) => {
    res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});