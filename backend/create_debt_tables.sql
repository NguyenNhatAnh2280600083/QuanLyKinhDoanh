-- Create customer_debts table
CREATE TABLE IF NOT EXISTS customer_debts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT NOT NULL,
    total_amount FLOAT NOT NULL DEFAULT 0,
    paid_amount FLOAT NOT NULL DEFAULT 0,
    remaining_amount FLOAT NOT NULL DEFAULT 0,
    due_date DATETIME NOT NULL,
    status ENUM('unpaid', 'partial', 'paid', 'overdue') DEFAULT 'unpaid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    UNIQUE KEY unique_order_debt (order_id)
);

-- Create debt_payments table
CREATE TABLE IF NOT EXISTS debt_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    debt_id INT NOT NULL,
    amount FLOAT NOT NULL,
    payment_method VARCHAR(50),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES customer_debts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
