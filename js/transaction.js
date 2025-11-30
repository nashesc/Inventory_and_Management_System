document.addEventListener("DOMContentLoaded", () => {
   // Search elements
   const searchInput = document.querySelector(".search-box input");
   const searchBtn = document.querySelector(".search-box .search-btn");
   const productTable = document.querySelector(".product-table tbody");
   const searchResults = createSearchResults();

   // Create search results dropdown
   function createSearchResults() {
      const resultsDiv = document.createElement("div");
      resultsDiv.className = "search-results";
      document.querySelector(".search-box").appendChild(resultsDiv);
      return resultsDiv;
   }

   // Search functionality
   function searchProducts(query) {
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

      // Add click handlers to results
      searchResults.querySelectorAll('.search-result-item').forEach(item => {
         item.addEventListener('click', function() {
            selectProduct(
               this.dataset.name,
               parseInt(this.dataset.price),
               parseInt(this.dataset.quantity)
            );
         });
      });
   }

   // Select product and display in product table
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

   // Event listeners
   searchInput.addEventListener("input", (e) => {
      searchProducts(e.target.value);
   });

   searchBtn.addEventListener("click", () => {
      searchProducts(searchInput.value);
   });

   // Close search results when clicking outside
   document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-box")) {
         searchResults.classList.remove('show');
      }
   });

   // Press Enter to search
   searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
         searchProducts(searchInput.value);
      }
   });




   // ========== EXISTING ADD TO CART FUNCTIONALITY ==========
   const addBtn = document.querySelector(".add-button button");
   const qtyInput = document.querySelector(".qty-input");
   const cartTableBody = document.querySelector(".cart-table tbody");
   const totalBox = document.querySelector(".total-box h3");

   // Get selected product from product table
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



   // Add button click
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

      // Check if item already exists
      let existingRow = null;
      cartTableBody.querySelectorAll("tr").forEach(row => {
         if (row.children[0].textContent === itemName) {
            existingRow = row;
         }
      });

      if (existingRow) {
         // Update existing row
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
         // Add new row
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
      qtyInput.value = 1; // Reset quantity input
   });

   // Delete row from cart
   document.addEventListener("click", function (e) {
      if (e.target.classList.contains("delete-btn")) {
         e.target.closest("tr").remove();
         updateTotal();
      }
   });




   // PRINT RECEIPT → record into transaction history
   const printBtn = document.querySelector(".receipt-btn");
   const cartTable = document.getElementById("cart-table");
   const historyTable = document.getElementById("transaction-history-table");

   printBtn.addEventListener("click", () => {
      const cartRows = cartTable.querySelectorAll("tbody tr");

      if (cartRows.length === 0) {
         showAlert("Your cart is empty!");
         return;
      }

      const newTransactions = [];

      cartRows.forEach(row => {
         const cells = row.querySelectorAll("td");
         const itemName = cells[0].textContent;
         const qty = parseInt(cells[2].textContent);
         const total = parseInt(cells[3].textContent.replace("₱", ""));

         // Current date and time
         const now = new Date();
         const formattedDate = now.toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
         }).replace(",", ".");
         
         const time = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
         });

         // Create transaction object
         const transaction = {
            date: formattedDate,
            item: itemName,
            quantity: qty,
            total: total,
            time: time,
            timestamp: now.toISOString() // For sorting
         };

         // Save to localStorage
         newTransactions.push(transaction);

         // Append to transaction history table on this page
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

      // Save all transactions to localStorage
      TransactionStorage.saveMultipleTransactions(newTransactions);

      // Clear cart and product table after recording
      cartTable.querySelector("tbody").innerHTML = "";
      productTable.innerHTML = "";

      // Reset total
      updateTotal();

      showAlert("Transaction successful!");
   });

   function showAlert(message) {
      const alertBox = document.getElementById("custom-alert");
      alertBox.textContent = message;
      alertBox.classList.add("show");

      setTimeout(() => {
         alertBox.classList.remove("show");
      }, 2000);
   }
});

// Load last 20 transactions on page load
function loadSavedTransactions() {
   const historyTable = document.querySelector("#transaction-history-table tbody");
   const all = TransactionStorage.getAllTransactions();

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

   // Sort newest → oldest
   const latest20 = all
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
