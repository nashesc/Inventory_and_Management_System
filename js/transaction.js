document.addEventListener("DOMContentLoaded", () => {
   
   const searchInput = document.querySelector(".search-box input");
   const searchBtn = document.querySelector(".search-box .search-btn");
   const productTable = document.querySelector(".product-table tbody");
   const searchResults = createSearchResults();

   const RECENT_SEARCHES_KEY = 'recent_searches';
   const MAX_RECENT_SEARCHES = 5;

   function getRecentSearches() {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
   }

   // Save search to recent searches
   function saveRecentSearch(searchTerm) {
      if (!searchTerm || searchTerm.trim() === '') return;
      
      let recents = getRecentSearches();
      
      recents = recents.filter(item => item.toLowerCase() !== searchTerm.toLowerCase());
      
      recents.unshift(searchTerm);
      
      recents = recents.slice(0, MAX_RECENT_SEARCHES);
      
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recents));
   }

   // Show recent searches
   function showRecentSearches() {
      const recents = getRecentSearches();
      
      if (recents.length === 0) {
         searchResults.innerHTML = '<div class="no-results">No recent searches</div>';
         searchResults.classList.add('show');
         return;
      }

      searchResults.innerHTML = `
         <div style="padding: 10px 12px; font-size: 12px; color: #999; font-weight: 600; border-bottom: 1px solid #eee;">
            RECENT SEARCHES
         </div>
         ${recents.map(search => `
            <div class="search-result-item recent-search-item" data-search="${search}">
               <div style="display: flex; align-items: center; gap: 10px;">
                  <i class="bi bi-clock-history" style="color: #5a58ff; font-size: 16px;"></i>
                  <span style="font-weight: 500;">${search}</span>
               </div>
            </div>
         `).join('')}
      `;

      searchResults.classList.add('show');

      searchResults.querySelectorAll('.recent-search-item').forEach(item => {
         item.addEventListener('click', function() {
            const searchTerm = this.dataset.search;
            searchInput.value = searchTerm;
            searchProducts(searchTerm);
         });
      });
   }

   function getProductsFromInventory() {
      const inventoryData = localStorage.getItem('inventory_data');
      if (inventoryData) {
         try {
            const inventory = JSON.parse(inventoryData);
            return inventory.map(item => ({
               name: item.type,
               price: item.price,
               quantity: item.qty,
               category: item.category
            }));
         } catch (e) {
            console.error('Error loading inventory:', e);
            return [];
         }
      }
      return [];
   }

   function createSearchResults() {
      const resultsDiv = document.createElement("div");
      resultsDiv.className = "search-results";
      document.querySelector(".search-box").appendChild(resultsDiv);
      return resultsDiv;
   }

   // Search functionality
   function searchProducts(query) {
      const productsDatabase = getProductsFromInventory();
      
      if (!query.trim()) {
         searchResults.classList.remove('show');
         return;
      }

      const filtered = productsDatabase.filter(product =>
         product.name.toLowerCase().includes(query.toLowerCase())
      );

      if (filtered.length === 0) {
         searchResults.innerHTML = '<div class="no-results">No products found</div>';
         searchResults.classList.add('show');
         return;
      }

      searchResults.innerHTML = filtered.map(product => `
         <div class="search-result-item" data-name="${product.name}" data-price="${product.price}" data-quantity="${product.quantity}">
            <div class="item-name">${product.name}</div>
            <div class="item-details">₱${product.price} • ${product.quantity} available</div>
         </div>
      `).join('');

      searchResults.classList.add('show');

      searchResults.querySelectorAll('.search-result-item').forEach(item => {
         item.addEventListener('click', function() {
            const productName = this.dataset.name;
            saveRecentSearch(productName); 
            selectProduct(
               productName,
               parseInt(this.dataset.price),
               parseInt(this.dataset.quantity)
            );
         });
      });
   }

   function selectProduct(name, price, quantity) {
      productTable.innerHTML = `
         <tr>
            <td>${name}</td>
            <td>₱${price}</td>
            <td>${quantity}</td>
         </tr>
      `;
      
      searchInput.value = "";
      searchResults.classList.remove('show');
   }

   searchInput.addEventListener("input", (e) => {
      if (e.target.value.trim() === '') {
         searchResults.classList.remove('show');
      } else {
         searchProducts(e.target.value);
      }
   });

   searchInput.addEventListener("focus", (e) => {
      if (e.target.value.trim() === '') {
         showRecentSearches();
      }
   });

   searchBtn.addEventListener("click", () => {
      searchProducts(searchInput.value);
   });

   document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-box")) {
         searchResults.classList.remove('show');
      }
   });

   searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
         searchProducts(searchInput.value);
      }
   });



   
   // ========== ADD TO CART FUNCTIONALITY ==========
   const addBtn = document.querySelector(".add-button button");
   const qtyInput = document.querySelector(".qty-input");
   const cartTableBody = document.querySelector(".cart-table tbody");
   const totalBox = document.querySelector(".total-box h3");

   function getSelectedProduct() {
      const row = productTable.querySelector("tr");
      if (!row) {
         showAlert("Please select a product first!");
         return null;
      }
      const itemName = row.children[0].textContent;
      const priceText = row.children[1].textContent.replace("₱", "");
      const price = parseInt(priceText);
      const availableQty = parseInt(row.children[2].textContent);
      return { itemName, price, availableQty };
   }

   // Update total price
   function updateTotal() {
      let total = 0;
      cartTableBody.querySelectorAll("tr").forEach(row => {
         const subtotal = parseInt(row.children[3].textContent.replace("₱", ""));
         total += subtotal;
      });
      totalBox.textContent = "₱" + total;
   }

   addBtn.addEventListener("click", () => {
      const product = getSelectedProduct();
      if (!product) return;

      const quantity = parseInt(qtyInput.value);
      if (quantity < 1) {
         showAlert("Please enter a valid quantity!");
         return;
      }

      if (quantity > product.availableQty) {
         showAlert(`Only ${product.availableQty} items available!`);
         return;
      }

      const { itemName, price } = product;
      const subtotal = price * quantity;

      let existingRow = null;
      cartTableBody.querySelectorAll("tr").forEach(row => {
         if (row.children[0].textContent === itemName) {
            existingRow = row;
         }
      });

      if (existingRow) {
         const oldQty = parseInt(existingRow.children[2].textContent);
         const newQty = oldQty + quantity;
         
         if (newQty > product.availableQty) {
            showAlert(`Only ${product.availableQty} items available!`);
            return;
         }
         
         const newSubtotal = price * newQty;
         existingRow.children[2].textContent = newQty;
         existingRow.children[3].textContent = "₱" + newSubtotal;
      } else {
         const newRow = document.createElement("tr");
         newRow.innerHTML = `
            <td>${itemName}</td>
            <td>₱${price}</td>
            <td>${quantity}</td>
            <td>₱${subtotal}</td>
            <td><button class="delete-btn">Delete</button></td>
         `;
         cartTableBody.appendChild(newRow);
      }

      updateTotal();
      qtyInput.value = 1;
   });

   document.addEventListener("click", function (e) {
      if (e.target.classList.contains("delete-btn")) {
         e.target.closest("tr").remove();
         updateTotal();
      }
   });


   
   // PRINT RECEIPT 
   const printBtn = document.querySelector(".receipt-btn");
   const cartTable = document.getElementById("cart-table");
   const historyTable = document.getElementById("transaction-history-table");

   //  deduct quantity from inventory
   function deductFromInventory(itemName, amount) {
      const inventoryData = localStorage.getItem('inventory_data');
      if (!inventoryData) return false;

      try {
         const inventory = JSON.parse(inventoryData);
         const item = inventory.find(i => i.type.toLowerCase() === itemName.toLowerCase());
         
         if (!item) {
            console.error('Item not found:', itemName);
            return false;
         }

         if (item.qty < amount) {
            console.error('Insufficient quantity for:', itemName);
            return false;
         }

         item.qty -= amount;

         localStorage.setItem('inventory_data', JSON.stringify(inventory));
         return true;
         
      } catch (e) {
         console.error('Error deducting quantity:', e);
         return false;
      }
   }



   // generate print receipt
   function printReceipt(transactions, total) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString("en-US", {
         month: "long", day: "numeric", year: "numeric"
      });
      const time = now.toLocaleTimeString("en-US", {
         hour: "2-digit",
         minute: "2-digit"
      });

      let itemsHTML = '';
      transactions.forEach(t => {
         itemsHTML += `
            <tr>
               <td style="padding: 8px 0; border-bottom: 1px dashed #ddd;">${t.item}</td>
               <td style="padding: 8px 0; border-bottom: 1px dashed #ddd; text-align: center;">${t.quantity}</td>
               <td style="padding: 8px 0; border-bottom: 1px dashed #ddd; text-align: right;">₱${(t.total / t.quantity).toFixed(2)}</td>
               <td style="padding: 8px 0; border-bottom: 1px dashed #ddd; text-align: right;">₱${t.total.toFixed(2)}</td>
            </tr>
         `;
      });

      const receiptHTML = `
         <!DOCTYPE html>
         <html lang="en">
         <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt</title>
            <style>
               * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
               }
               body {
                  font-family: 'Courier New', monospace;
                  padding: 20px;
                  max-width: 400px;
                  margin: 0 auto;
               }
               .receipt {
                  border: 2px solid #000;
                  padding: 20px;
                  background: white;
               }
               .header {
                  text-align: center;
                  margin-bottom: 20px;
                  border-bottom: 2px solid #000;
                  padding-bottom: 15px;
               }
               .header h1 {
                  font-size: 24px;
                  margin-bottom: 5px;
               }
               .header p {
                  font-size: 12px;
                  margin: 2px 0;
               }
               .info {
                  margin-bottom: 15px;
                  font-size: 13px;
               }
               .info p {
                  margin: 5px 0;
               }
               table {
                  width: 100%;
                  margin-bottom: 15px;
                  font-size: 13px;
               }
               table th {
                  text-align: left;
                  padding: 8px 0;
                  border-bottom: 2px solid #000;
               }
               table th:nth-child(2),
               table th:nth-child(3),
               table th:nth-child(4) {
                  text-align: center;
               }
               table th:nth-child(4) {
                  text-align: right;
               }
               .total-section {
                  border-top: 2px solid #000;
                  padding-top: 10px;
                  margin-top: 10px;
               }
               .total-row {
                  display: flex;
                  justify-content: space-between;
                  font-size: 14px;
                  margin: 5px 0;
               }
               .total-row.grand-total {
                  font-size: 18px;
                  font-weight: bold;
                  margin-top: 10px;
                  padding-top: 10px;
                  border-top: 2px solid #000;
               }
               .footer {
                  text-align: center;
                  margin-top: 20px;
                  padding-top: 15px;
                  border-top: 2px dashed #000;
                  font-size: 12px;
               }
               @media print {
                  body {
                     padding: 0;
                  }
                  .receipt {
                     border: none;
                  }
               }
            </style>
         </head>
         <body>
            <div class="receipt">
               <div class="header">
                  <h1>SALES RECEIPT</h1>
                  <p>Inventory & Sales Management</p>
               </div>
               
               <div class="info">
                  <p><strong>Date:</strong> ${formattedDate}</p>
                  <p><strong>Time:</strong> ${time}</p>
                  <p><strong>Transaction ID:</strong> ${Date.now()}</p>
               </div>

               <table>
                  <thead>
                     <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                     </tr>
                  </thead>
                  <tbody>
                     ${itemsHTML}
                  </tbody>
               </table>

               <div class="total-section">
                  <div class="total-row">
                     <span>Subtotal:</span>
                     <span>₱${total.toFixed(2)}</span>
                  </div>
                  <div class="total-row grand-total">
                     <span>TOTAL:</span>
                     <span>₱${total.toFixed(2)}</span>
                  </div>
               </div>

               <div class="footer">
                  <p>Thank you for your purchase!</p>
                  <p>Please come again</p>
               </div>
            </div>
         </body>
         </html>
      `;

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(receiptHTML);
      iframeDoc.close();

      iframe.onload = function() {
         iframe.contentWindow.focus();
         iframe.contentWindow.print();
         
         setTimeout(() => {
            document.body.removeChild(iframe);
         }, 1000);
      };
   }

   printBtn.addEventListener("click", () => {
      const cartRows = cartTable.querySelectorAll("tbody tr");

      if (cartRows.length === 0) {
         showAlert("Your cart is empty!");
         return;
      }

      const newTransactions = [];
      let allDeducted = true;
      let grandTotal = 0;

      cartRows.forEach(row => {
         const cells = row.querySelectorAll("td");
         const itemName = cells[0].textContent;
         const qty = parseInt(cells[2].textContent);
         const total = parseInt(cells[3].textContent.replace("₱", ""));

         const success = deductFromInventory(itemName, qty);
         if (!success) {
            showAlert(`Failed to deduct ${itemName}. Insufficient stock!`);
            allDeducted = false;
            return;
         }

         const now = new Date();
         const formattedDate = now.toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
         }).replace(",", ".");
         
         const time = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
         });

         const transaction = {
            date: formattedDate,
            item: itemName,
            quantity: qty,
            total: total,
            time: time,
            timestamp: now.toISOString()
         };

         newTransactions.push(transaction);
         grandTotal += total;

         const newRow = `
            <tr>
               <td>${formattedDate}</td>
               <td>${itemName}</td>
               <td>${qty}</td>
               <td>₱${total}</td>
               <td>${time}</td>
            </tr>
         `;

         historyTable.querySelector("tbody").insertAdjacentHTML("afterbegin", newRow);
      });

      if (!allDeducted) {
         return;
      }

      if (window.TransactionStorage) {
         window.TransactionStorage.saveMultipleTransactions(newTransactions);
      }

      printReceipt(newTransactions, grandTotal);

      cartTable.querySelector("tbody").innerHTML = "";
      productTable.innerHTML = "";

      updateTotal();
      showAlert("Transaction successful! Receipt printed.");
   });

   function showAlert(message) {
      const alertBox = document.getElementById("custom-alert");
      alertBox.textContent = message;
      alertBox.classList.add("show");

      setTimeout(() => {
         alertBox.classList.remove("show");
      }, 2000);
   }

   loadSavedTransactions();
});

// Load last 20 transactions
function loadSavedTransactions() {
   const historyTable = document.querySelector("#transaction-history-table tbody");
   
   if (!window.TransactionStorage) {
      historyTable.innerHTML = `
         <tr>
            <td colspan="5" style="text-align:center; padding:20px; color:#666;">
               Transaction storage not available
            </td>
         </tr>
      `;
      return;
   }

   const all = window.TransactionStorage.getAllTransactions();

   historyTable.innerHTML = "";

   if (all.length === 0) {
      historyTable.innerHTML = `
         <tr>
            <td colspan="5" style="text-align:center; padding:20px; color:#666;">
               No past transactions
            </td>
         </tr>
      `;
      return;
   }

   const latest20 = all
      .filter(t => t.total > 0)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);

   latest20.forEach(t => {
      const row = `
         <tr>
            <td>${t.date}</td>
            <td>${t.item}</td>
            <td>${t.quantity}</td>
            <td>₱${t.total}</td>
            <td>${t.time}</td>
         </tr>
      `;
      historyTable.insertAdjacentHTML("beforeend", row);
   });
}