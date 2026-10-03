-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS sistema_clientes;

USE sistema_clientes;

-- Criar a tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL,
 email VARCHAR(100) NOT NULL UNIQUE,
 telefone VARCHAR(20),
 status ENUM('ativo', 'inativo') DEFAULT 'ativo',
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar a tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL,
 descricao TEXT,
 preco DECIMAL(10, 2) NOT NULL,
 estoque INT DEFAULT 0,
 status ENUM('ativo', 'inativo') DEFAULT 'ativo',
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL,
 email VARCHAR(100) NOT NULL UNIQUE,
 senha VARCHAR(255) NOT NULL,
 perfil ENUM('admin', 'operador') DEFAULT 'operador',
 status ENUM('ativo', 'inativo') DEFAULT 'ativo',
 criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 cliente_id INT NOT NULL,
 data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 status ENUM('pendente', 'pago', 'cancelado') DEFAULT 'pendente',
 valor_total DECIMAL(10, 2) DEFAULT 0.00,
 FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE
RESTRICT
);

-- 3. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
 id INT AUTO_INCREMENT PRIMARY KEY,
 pedido_id INT NOT NULL,
 produto_id INT NOT NULL,
 quantidade INT NOT NULL,
 preco_unitario DECIMAL(10, 2) NOT NULL,
 FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE
CASCADE,
 FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE
RESTRICT
);

INSERT INTO clientes (nome, email, telefone)
VALUES ('Jaqueline Fanton', 'jaquelinefanton2@gmail.com', '47900000000');

INSERT INTO produtos (nome, descricao, preco, estoque)
VALUES ('Camisa', 'Camisa azul SAEP', 0, 1);

INSERT INTO usuarios (nome, email, senha, perfil)
VALUES ('Adriano Lucas', 'adriano.lucas@edu.sc.senai.br', '123456', 'professor');

DESC clientes;
DESC produtos;
DESC usuarios;
DESC pedidos;
DESC itens_pedido;