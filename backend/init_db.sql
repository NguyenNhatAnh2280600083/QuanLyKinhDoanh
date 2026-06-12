-- Create database
CREATE DATABASE IF NOT EXISTS QLbanhangkinhdoanh;
USE QLbanhangkinhdoanh;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role_id INT,
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(255),
    region VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price FLOAT NOT NULL,
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    category_id INT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    user_id INT,
    total_amount FLOAT DEFAULT 0.0,
    status ENUM('PENDING', 'APPROVED', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price FLOAT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Inventory Logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    order_id INT NULL,
    type ENUM('IN', 'OUT', 'ADJUST', 'RETURN') NOT NULL,
    quantity INT NOT NULL,
    note TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Production Plans table
CREATE TABLE IF NOT EXISTS production_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NULL,
    product_id INT NOT NULL,
    required_quantity INT NOT NULL,
    planned_quantity INT NOT NULL,
    completed_quantity INT DEFAULT 0,
    status ENUM('WAITING_PRODUCTION', 'IN_PRODUCTION', 'PRODUCTION_DONE', 'CANCELLED') DEFAULT 'WAITING_PRODUCTION',
    expected_completion_date DATETIME,
    actual_completion_date DATETIME,
    note TEXT,
    is_stock_deducted TINYINT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Order Status Logs table
CREATE TABLE IF NOT EXISTS order_status_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    old_status ENUM('PENDING', 'APPROVED', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED'),
    new_status ENUM('PENDING', 'APPROVED', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED'),
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNIQUE,
    amount FLOAT NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Insert initial roles
INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('sales');

-- Insert initial categories
INSERT INTO categories (name, description) VALUES 
('Gia dụng', 'Các sản phẩm đồ dùng trong nhà'),
('Điện tử', 'Các sản phẩm điện tử, công nghệ'),
('Thực phẩm', 'Các loại thực phẩm, đồ uống');

-- Insert initial products
INSERT INTO products (name, description, price, stock_quantity, low_stock_threshold, category_id) VALUES 
('Nồi cơm điện Sunhouse', 'Nồi cơm điện dung tích 1.8L', 850000, 50, 10, 1),
('Bàn là hơi nước Philips', 'Bàn là công suất cao', 1200000, 5, 10, 1),
('Tai nghe Sony WH-1000XM4', 'Tai nghe chống ồn cao cấp', 6500000, 15, 5, 2),
('Chuột Logitech G502', 'Chuột gaming chuyên nghiệp', 1500000, 3, 5, 2),
('Sữa tươi TH True Milk', 'Thùng 48 hộp 180ml', 350000, 100, 20, 3);
