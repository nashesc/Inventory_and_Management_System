// MAIN SCRIPT - Works on all pages

document.addEventListener("DOMContentLoaded", () => {
   
   // ------------- DISPLAY CURRENT DATE IN HEADER --------------
   const headerDate = document.querySelector('.header-date');
   
   if (headerDate) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString("en-US", {
         month: "short",
         day: "numeric",
         year: "numeric"
      }).replace(",", ".");
      
      headerDate.textContent = formattedDate;
   }

   // ------------- DROPDOWN BUTTON (ALL PAGES) --------------
   const dropdowns = document.querySelectorAll('.dropdown');

   dropdowns.forEach(dropdown => {
      const btn = dropdown.querySelector('.dropdown-btn');
      const options = dropdown.querySelector('.dropdown-options');
      const items = options.querySelectorAll('a');

      btn.addEventListener('click', (e) => {
         e.preventDefault();
         dropdown.classList.toggle('open');
         options.style.display = options.style.display === "flex" ? "none" : "flex";
      });

      items.forEach(item => {
         item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Check if this is the role dropdown in settings
            const isRoleDropdown = dropdown.id === 'roleDropdown';
            
            if (isRoleDropdown) {
               // Handle role dropdown specially
               const value = item.getAttribute('data-value');
               const text = item.textContent;
               const hiddenInput = document.getElementById('accountRole');
               
               btn.querySelector("span").textContent = text;
               if (hiddenInput) {
                  hiddenInput.value = value;
               }
               
               if (value) {
                  btn.classList.add('has-value');
               } else {
                  btn.classList.remove('has-value');
               }
            } else {
               // Handle regular dropdowns
               btn.querySelector("span").textContent = item.textContent;
            }
            
            options.style.display = "none";
            dropdown.classList.remove('open');
         });
      });
   });

   // Close when click outside
   document.addEventListener('click', (e) => {
      dropdowns.forEach(dropdown => {
         if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
            dropdown.querySelector('.dropdown-options').style.display = "none";
         }
      });
   });

   
   
   // ------------- DATE PICKER & FILTER (Dashboard only) --------------
   const dateInput = document.querySelector(".date-input");
   const salesTable = document.querySelector(".sales-table tbody");
   
   if (dateInput && salesTable) {
      // Function to format date into "Nov. 14, 2025"
      function formatPrettyDate(dateObj) {
         return dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
         }).replace(",", ".");
      }

      // Set today's date as default
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      
      dateInput.value = `${year}-${month}-${day}`;

      // Load transactions from localStorage (filter out inventory changes)
      function loadTransactions() {
         const transactions = TransactionStorage.getAllTransactions();
         // Only return sales transactions (filter out inventory changes)
         return transactions.filter(t => !t.action || t.action === 'sale');
      }

      // Load 10 most recent transactions (default view)
      function loadRecentTransactions() {
         const allTransactions = loadTransactions();
         
         salesTable.innerHTML = '';
         
         if (allTransactions.length === 0) {
            salesTable.innerHTML = `
               <tr>
                  <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                     No transactions yet
                  </td>
               </tr>
            `;
            return;
         }
         
         // Sort by timestamp (newest first) and take top 10
         const recent10 = allTransactions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
         
         recent10.forEach(transaction => {
            const row = `
               <tr>
                  <td>${transaction.date}</td>
                  <td>${transaction.item}</td>
                  <td>${transaction.quantity}</td>
                  <td>₱${transaction.total}</td>
                  <td>${transaction.time}</td>
               </tr>
            `;
            salesTable.insertAdjacentHTML('beforeend', row);
         });
      }

      // Filter transactions by date
      function filterTransactionsByDate(selectedDate) {
         const allTransactions = loadTransactions();
         const formattedSelectedDate = formatPrettyDate(selectedDate);
         
         salesTable.innerHTML = '';
         
         const matchingTransactions = allTransactions.filter(transaction => 
            transaction.date === formattedSelectedDate
         );
         
         if (matchingTransactions.length === 0) {
            salesTable.innerHTML = `
               <tr>
                  <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                     No transactions found for ${formattedSelectedDate}
                  </td>
               </tr>
            `;
         } else {
            matchingTransactions.forEach(transaction => {
               const row = `
                  <tr>
                     <td>${transaction.date}</td>
                     <td>${transaction.item}</td>
                     <td>${transaction.quantity}</td>
                     <td>₱${transaction.total}</td>
                     <td>${transaction.time}</td>
                  </tr>
               `;
               salesTable.insertAdjacentHTML('beforeend', row);
            });
         }
      }

      // Initial load - show 10 most recent transactions
      loadRecentTransactions();

      // Update when user picks a new date
      dateInput.addEventListener("change", () => {
         if (!dateInput.value) {
            // If date is cleared, show recent 10 again
            loadRecentTransactions();
            return;
         }
         const selectedDate = new Date(dateInput.value + 'T00:00:00');
         filterTransactionsByDate(selectedDate);
      });
   }

});