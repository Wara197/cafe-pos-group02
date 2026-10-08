// src/models/Order.js
class OrderItem {
  constructor(item, quantity) {
    this.menuItem = item;
    this.quantity = quantity;
    this.unitPrice = item.price;
  }

  getSubtotal() {
    return this.unitPrice * this.quantity;
  }
}

class Order {
  constructor(paymentMethod) {
    this.orderId = null;
    this.createdAt = new Date();
    this.paymentMethod = paymentMethod;
    this.items = [];
  }

  addItem(item, quantity) {
    this.items.push(new OrderItem(item, quantity));
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
  }

  submit() {
    if (this.items.length === 0) return false;
    return true;
  }
}

module.exports = { Order, OrderItem };
