// Product Database Manager
const ProductDatabase = {
  // Initialize database from localStorage or use defaults
  initialize() {
    const stored = localStorage.getItem("productsDatabase");
    if (!stored) {
      const defaultProducts = [
        { category: "Tops", name: "T-shirts", price: 120, quantity: 25 },
        { category: "Tops", name: "Polo-shirts", price: 150, quantity: 18 },
        { category: "Tops", name: "Long sleeves", price: 180, quantity: 22 },
        { category: "Bottoms", name: "Shorts", price: 100, quantity: 12 },
        { category: "Bottoms", name: "Baggy Pants", price: 130, quantity: 20 },
        { category: "Bottoms", name: "Jeans", price: 200, quantity: 28 },
        { category: "Bottoms", name: "Skirts", price: 150, quantity: 16 },
        { category: "Bottoms", name: "Slacks", price: 180, quantity: 9 },
        { category: "Outerwear", name: "Jackets", price: 250, quantity: 21 },
        { category: "Outerwear", name: "Hoodies", price: 200, quantity: 15 },
        { category: "Outerwear", name: "Coats", price: 300, quantity: 0 },
        { category: "Outerwear", name: "Cardigans", price: 180, quantity: 23 },
        { category: "Footwear", name: "Sneakers", price: 220, quantity: 17 },
        { category: "Footwear", name: "Sandals", price: 120, quantity: 30 },
        { category: "Footwear", name: "Boots", price: 250, quantity: 0 },
        { category: "Footwear", name: "Heels", price: 200, quantity: 19 }
      ];
      this.save(defaultProducts);
    }
  },

  // Get all products
  getAll() {
    const stored = localStorage.getItem("productsDatabase");
    return stored ? JSON.parse(stored) : [];
  },

  // Save all products
  save(products) {
    localStorage.setItem("productsDatabase", JSON.stringify(products));
  },

  // Find product by name
  findByName(name) {
    const products = this.getAll();
    return products.find(p => p.name === name);
  },

  // Update product quantity
  updateQuantity(name, newQuantity) {
    const products = this.getAll();
    const product = products.find(p => p.name === name);
    if (product) {
      product.quantity = newQuantity;
      this.save(products);
      return true;
    }
    return false;
  },

  // Deduct quantity (for sales)
  deductQuantity(name, amount) {
    const products = this.getAll();
    const product = products.find(p => p.name === name);
    if (product && product.quantity >= amount) {
      product.quantity -= amount;
      this.save(products);
      return true;
    }
    return false;
  },

  // Add new product
  add(product) {
    const products = this.getAll();
    products.push(product);
    this.save(products);
  },

  // Delete product
  delete(name) {
    const products = this.getAll();
    const filtered = products.filter(p => p.name !== name);
    this.save(filtered);
  },

  // Update existing product
  update(oldName, updatedProduct) {
    const products = this.getAll();
    const index = products.findIndex(p => p.name === oldName);
    if (index !== -1) {
      products[index] = updatedProduct;
      this.save(products);
      return true;
    }
    return false;
  }
};

// Initialize on load
ProductDatabase.initialize();

// Export for use in other files
window.ProductDatabase = ProductDatabase;

// Also create a global productsDatabase variable for backward compatibility
window.productsDatabase = ProductDatabase.getAll();