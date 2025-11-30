// MAIN SCRIPT - Works on all pages

document.addEventListener("DOMContentLoaded", () => {
   
   // ------------- DROPDOWN BUTTON --------------
   const dropdowns = document.querySelectorAll('.dropdown');

   dropdowns.forEach(dropdown => {
      const btn = dropdown.querySelector('.dropdown-btn');
      const options = dropdown.querySelector('.dropdown-options');
      const items = options.querySelectorAll('a');

      btn.addEventListener('click', () => {
         dropdown.classList.toggle('open');
         options.style.display = options.style.display === "flex" ? "none" : "flex";
      });

      items.forEach(item => {
         item.addEventListener('click', (e) => {
            e.preventDefault();
            btn.querySelector("span").textContent = item.textContent;
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

      const allTransactions = loadTransactions();

      // Filter transactions by date
      function filterTransactionsByDate(selectedDate) {
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

      // Initial filter with today's date
      filterTransactionsByDate(today);

      // Update when user picks a new date
      dateInput.addEventListener("change", () => {
         if (!dateInput.value) return;
         const selectedDate = new Date(dateInput.value + 'T00:00:00');
         filterTransactionsByDate(selectedDate);
      });
   }

});