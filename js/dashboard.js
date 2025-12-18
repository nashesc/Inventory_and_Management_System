document.addEventListener("DOMContentLoaded", () => {
   
   function getInventory() {
      const stored = localStorage.getItem('inventory_data');
      return stored ? JSON.parse(stored) : [];
   }

   function getUniqueCategories() {
      const inventory = getInventory();
      const categories = [...new Set(inventory.map(item => item.category))];
      return categories.sort();
   }

   function getAllTransactions() {
      const all = window.TransactionStorage.getAllTransactions();
      return all.filter(t => !t.action || t.action === 'sale');
   }

   function getSalesTransactionsByPeriod(period = 'weekly') {
      const all = getAllTransactions();
      const now = new Date();
      
      if (period === 'alltime') {
         return all.filter(t => t.total > 0);
      }
      
      if (period === 'today') {
         return all.filter(t => {
            const date = new Date(t.timestamp);
            return date.toDateString() === now.toDateString() && t.total > 0;
         });
      }
      
      if (period === 'weekly') {
         const weekAgo = new Date(now);
         weekAgo.setDate(weekAgo.getDate() - 7);
         return all.filter(t => {
            const date = new Date(t.timestamp);
            return date >= weekAgo && date <= now && t.total > 0;
         });
      }
      
      if (period === 'monthly') {
         const monthAgo = new Date(now);
         monthAgo.setMonth(monthAgo.getMonth() - 1);
         return all.filter(t => {
            const date = new Date(t.timestamp);
            return date >= monthAgo && date <= now && t.total > 0;
         });
      }
      
      if (period === 'yearly') {
         const yearAgo = new Date(now);
         yearAgo.setFullYear(yearAgo.getFullYear() - 1);
         return all.filter(t => {
            const date = new Date(t.timestamp);
            return date >= yearAgo && date <= now && t.total > 0;
         });
      }
      
      return all.filter(t => t.total > 0);
   }

   function calculateTotalSales(transactions) {
      return transactions.reduce((sum, t) => sum + t.total, 0);
   }

   function calculateProductsSold(transactions) {
      return transactions.reduce((sum, t) => sum + t.quantity, 0);
   }

   function getLowStockItems() {
      const inventory = getInventory();
      return inventory.filter(item => item.qty < 15 && item.qty > 0);
   }

   function getOutOfStockItems() {
      const inventory = getInventory();
      return inventory.filter(item => item.qty === 0);
   }

   function updateDashboardBoxes(period = 'weekly') {
      const transactions = getSalesTransactionsByPeriod(period);
      const totalSales = calculateTotalSales(transactions);
      const productsSold = calculateProductsSold(transactions);
      
      const lowStock = getLowStockItems().length;
      const outOfStock = getOutOfStockItems().length;
      const totalLowStock = lowStock + outOfStock;

      document.getElementById('total-sales-amount').textContent = '₱' + totalSales.toLocaleString();
      document.getElementById('products-sold-amount').textContent = productsSold + ' products';
      document.getElementById('low-stock-amount').textContent = totalLowStock + ' products';
   }

   function updateSalesTable(period = 'weekly') {
      const salesTable = document.querySelector(".sales-table tbody");
      const transactions = getSalesTransactionsByPeriod(period);
      
      const recentTransactions = transactions
         .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
         .slice(0, 10);
      
      salesTable.innerHTML = '';
      
      if (recentTransactions.length === 0) {
         salesTable.innerHTML = `
            <tr>
               <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                  No transactions found for this period
               </td>
            </tr>
         `;
         return;
      }
      
      recentTransactions.forEach(transaction => {
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

   function updateDashboard(period = 'weekly') {
      updateDashboardBoxes(period);
      updateSalesTable(period);
   }







   // ==================== TOP DROPDOWN FUNCTIONALITY ====================
   let currentPeriod = 'weekly';
   
   function initializeTopDropdown() {
      const topDropdown = document.querySelector('.top-buttons .dropdown');
      const topDropdownBtn = topDropdown.querySelector('.dropdown-btn');
      const topDropdownOptions = topDropdown.querySelector('.dropdown-options');
      const topDropdownSpan = topDropdownBtn.querySelector('span');
      const dateInput = document.querySelector(".date-input");
      
      topDropdownSpan.textContent = 'Weekly';
      currentPeriod = 'weekly';
      
      topDropdownOptions.querySelectorAll('a').forEach(link => {
         link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const period = link.getAttribute('data-period');
            
            topDropdownSpan.textContent = link.textContent;
            topDropdownOptions.style.display = 'none';
            
            currentPeriod = period;
            
            updateDashboard(period);
         });
      });
   }





   // ==================== DATE PICKER FUNCTIONALITY ====================
   function initializeDatePicker() {
      const dateInput = document.querySelector(".date-input");
      const salesTable = document.querySelector(".sales-table tbody");
      
      if (!dateInput || !salesTable) return;
      
      function formatPrettyDate(dateObj) {
         return dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
         }).replace(",", ".");
      }

      function filterTransactionsByDate(selectedDate) {
         const allTransactions = getAllTransactions();
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
            const sortedTransactions = matchingTransactions
               .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
               
            sortedTransactions.forEach(transaction => {
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

      dateInput.addEventListener("change", () => {
         if (!dateInput.value) {
            updateDashboard(currentPeriod);
            return;
         }
         
         const selectedDate = new Date(dateInput.value + 'T00:00:00');
         filterTransactionsByDate(selectedDate);
      });
   }





   // ==================== MODAL FUNCTIONS ====================
   window.closeModal = function(modalId) {
      document.getElementById(modalId).classList.remove('show');
      document.querySelectorAll('.dropdown-options').forEach(dropdown => {
         dropdown.classList.remove('show');
      });
   };

   document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
         if (e.target === overlay) {
            overlay.classList.remove('show');
         }
      });
   });





   // ==================== TOTAL SALES MODAL ====================
   let salesChart = null;
   
   document.getElementById('total-sales-box').addEventListener('click', () => {
      document.getElementById('sales-modal').classList.add('show');
      renderSalesChart('monthly'); 
   });

   const salesModal = document.getElementById('sales-modal');
   const salesDropdownBtn = salesModal.querySelector('.dropdown-btn');
   const salesDropdownOptions = salesModal.querySelector('.dropdown-options');
   const salesPeriodSpan = document.getElementById('sales-period');

   salesDropdownOptions.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
         e.preventDefault();
         e.stopPropagation();
         const period = link.getAttribute('data-period');
         salesPeriodSpan.textContent = link.textContent;
         salesDropdownOptions.style.display = 'none';
         renderSalesChart(period);
      });
   });


   function renderSalesChart(period) {
      const ctx = document.getElementById('sales-chart').getContext('2d');
      
      if (salesChart) {
         salesChart.destroy();
      }

      const data = getSalesChartData(period);
      
      salesChart = new Chart(ctx, {
         type: 'line',
         data: {
            labels: data.labels,
            datasets: [{
               label: 'Sales (₱)',
               data: data.values,
               borderColor: '#5a58ff',
               backgroundColor: 'rgba(90, 88, 255, 0.1)',
               borderWidth: 3,
               fill: true,
               tension: 0.4
            }]
         },
         options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
               legend: {
                  display: true,
                  position: 'top'
               }
            },
            scales: {
               y: {
                  beginAtZero: true,
                  ticks: {
                     callback: function(value) {
                        return '₱' + value.toLocaleString();
                     }
                  }
               }
            }
         }
      });
   }


   function getSalesChartData(period) {
      const transactions = getAllTransactions();
      const now = new Date();
      
      if (period === 'today') {
         const hours = Array.from({length: 24}, (_, i) => {
            const hour = i % 12 || 12;
            const ampm = i < 12 ? 'AM' : 'PM';
            return `${hour}:00 ${ampm}`;
         });
         const values = new Array(24).fill(0);
         
         transactions.forEach(t => {
            const date = new Date(t.timestamp);
            if (date.toDateString() === now.toDateString()) {
               const hour = date.getHours();
               values[hour] += t.total;
            }
         });
         
         return { labels: hours, values };
      }
      
      if (period === 'weekly') {
         const labels = [];
         const values = new Array(7).fill(0);
         
         for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
         }
         
         transactions.forEach(t => {
            const date = new Date(t.timestamp);
            const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 7) {
               values[6 - daysDiff] += t.total;
            }
         });
         
         return { labels, values };
      }
      
      if (period === 'monthly') {
         const labels = [];
         const values = new Array(30).fill(0);
         
         for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
         }
         
         transactions.forEach(t => {
            const date = new Date(t.timestamp);
            const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff < 30) {
               values[29 - daysDiff] += t.total;
            }
         });
         
         return { labels, values };
      }
      
      if (period === 'yearly') {
         const labels = [];
         const values = new Array(12).fill(0);
         
         for (let i = 11; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
         }
         
         transactions.forEach(t => {
            const date = new Date(t.timestamp);
            const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
            if (monthsDiff >= 0 && monthsDiff < 12) {
               values[11 - monthsDiff] += t.total;
            }
         });
         
         return { labels, values };
      }
   }




   // ==================== PRODUCTS SOLD MODAL ====================
   let productsChart = null;
   let modalCurrentPeriod = 'alltime';
   let modalCurrentCategory = 'all';

   function populateCategoryDropdown() {
      const categoryDropdownOptions = productsModal.querySelectorAll('.dropdown')[1].querySelector('.dropdown-options');
      const categories = getUniqueCategories();
      
      categoryDropdownOptions.innerHTML = '<a href="#" data-period="all">All Categories</a>';
      
      categories.forEach(category => {
         const link = document.createElement('a');
         link.href = '#';
         link.setAttribute('data-period', category);
         link.textContent = category;
         categoryDropdownOptions.appendChild(link);
         
         link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const selectedCategory = link.getAttribute('data-period');
            productsCategorySpan.textContent = link.textContent;
            categoryDropdownOptions.style.display = 'none';
            modalCurrentCategory = selectedCategory;
            renderProductsChart(modalCurrentPeriod, modalCurrentCategory);
         });
      });
   }
   
   document.getElementById('products-sold-box').addEventListener('click', () => {
      document.getElementById('products-modal').classList.add('show');
      modalCurrentPeriod = 'alltime';
      modalCurrentCategory = 'all';
      document.getElementById('products-period').textContent = 'All Time';
      document.getElementById('products-category').textContent = 'All Categories';
      
      populateCategoryDropdown();
      
      renderProductsChart(modalCurrentPeriod, modalCurrentCategory);
   });



   const productsModal = document.getElementById('products-modal');
   const periodDropdownBtn = productsModal.querySelectorAll('.dropdown')[0].querySelector('.dropdown-btn');
   const periodDropdownOptions = productsModal.querySelectorAll('.dropdown')[0].querySelector('.dropdown-options');
   const productsPeriodSpan = document.getElementById('products-period');
   
   const categoryDropdownBtn = productsModal.querySelectorAll('.dropdown')[1].querySelector('.dropdown-btn');
   const categoryDropdownOptions = productsModal.querySelectorAll('.dropdown')[1].querySelector('.dropdown-options');
   const productsCategorySpan = document.getElementById('products-category');

   periodDropdownOptions.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
         e.preventDefault();
         e.stopPropagation();
         const period = link.getAttribute('data-period');
         productsPeriodSpan.textContent = link.textContent;
         periodDropdownOptions.style.display = 'none'; 
         modalCurrentPeriod = period;
         renderProductsChart(modalCurrentPeriod, modalCurrentCategory);
      });
   });


   document.addEventListener('click', (e) => {
      const isInsideSalesDropdown = salesDropdownBtn.contains(e.target) || salesDropdownOptions.contains(e.target);
      const isInsidePeriodDropdown = periodDropdownBtn.contains(e.target) || periodDropdownOptions.contains(e.target);
      const isInsideCategoryDropdown = categoryDropdownBtn.contains(e.target) || categoryDropdownOptions.contains(e.target);
      
      if (!isInsideSalesDropdown) {
         salesDropdownOptions.style.display = 'none';
      }
      if (!isInsidePeriodDropdown) {
         periodDropdownOptions.style.display = 'none';
      }
      if (!isInsideCategoryDropdown) {
         categoryDropdownOptions.style.display = 'none';
      }
   });

   // ===== PRODUCTS SOLD CHARTS =====
   function renderProductsChart(period, category) {
      const ctx = document.getElementById('products-chart').getContext('2d');
      
      if (productsChart) {
         productsChart.destroy();
      }

      const data = getTopProductsData(period, category);
      
      productsChart = new Chart(ctx, {
         type: 'bar',
         data: {
            labels: data.labels,
            datasets: [{
               label: 'Quantity Sold',
               data: data.values,
               backgroundColor: [
                  '#5a58ff',
                  '#7674f8',
                  '#9e9dff',
                  '#C2C0FF',
                  '#8280ff',
                  '#6664f9',
                  '#4a48e8'
               ],
               borderWidth: 0
            }]
         },
         options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
               legend: {
                  display: false
               },
               tooltip: {
                  callbacks: {
                     label: function(context) {
                        return `Sold: ${context.parsed.y} units`;
                     }
                  }
               }
            },
            scales: {
               y: {
                  beginAtZero: true,
                  ticks: {
                     stepSize: 1
                  }
               }
            }
         }
      });
   }


   // ===== Top Products =====
   function getTopProductsData(period, category) {
      const transactions = getAllTransactions();
      const inventory = getInventory();
      const now = new Date();
      const productTotals = {};
      
      let filteredTransactions = transactions;
      
      if (period !== 'alltime') {
         filteredTransactions = transactions.filter(t => {
            const date = new Date(t.timestamp);
            
            if (period === 'today') {
               return date.toDateString() === now.toDateString();
            } else if (period === 'weekly') {
               const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
               return daysDiff >= 0 && daysDiff < 7;
            } else if (period === 'monthly') {
               const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
               return daysDiff >= 0 && daysDiff < 30;
            } else if (period === 'yearly') {
               const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
               return monthsDiff >= 0 && monthsDiff < 12;
            }
            return true;
         });
      }
      
      if (category !== 'all') {
         filteredTransactions = filteredTransactions.filter(t => {
            const inventoryItem = inventory.find(item => item.type === t.item);
            return inventoryItem && inventoryItem.category === category;
         });
      }
      
      filteredTransactions.forEach(t => {
         if (productTotals[t.item]) {
            productTotals[t.item] += t.quantity;
         } else {
            productTotals[t.item] = t.quantity;
         }
      });
      
      const sorted = Object.entries(productTotals)
         .sort((a, b) => b[1] - a[1])
         .slice(0, 10);
      
      return {
         labels: sorted.map(item => item[0]),
         values: sorted.map(item => item[1])
      };
   }



   
   // ==================== LOW STOCK MODAL ====================
   document.getElementById('low-stock-box').addEventListener('click', () => {
      document.getElementById('stock-modal').classList.add('show');
      renderLowStockList();
   });

   function renderLowStockList() {
      const stockList = document.getElementById('stock-list');
      const outOfStock = getOutOfStockItems();
      const lowStock = getLowStockItems();
      
      stockList.innerHTML = '';
      
      if (outOfStock.length === 0 && lowStock.length === 0) {
         stockList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
               <i class="bi bi-check-circle" style="font-size: 48px; color: #4caf50;"></i>
               <h3 style="margin-top: 15px;">All items are well stocked!</h3>
            </div>
         `;
         return;
      }
      
      // Show out of stock first
      outOfStock.forEach(item => {
         const itemDiv = document.createElement('div');
         itemDiv.className = 'stock-item out-of-stock';
         itemDiv.innerHTML = `
            <div class="stock-item-info">
               <h3>${item.type}</h3>
               <p>${item.category} • ₱${item.price.toLocaleString()}</p>
            </div>
            <span class="stock-badge out">Out of Stock (${item.qty})</span>
         `;
         stockList.appendChild(itemDiv);
      });
      
      // Then low stock
      lowStock.forEach(item => {
         const itemDiv = document.createElement('div');
         itemDiv.className = 'stock-item low-stock';
         itemDiv.innerHTML = `
            <div class="stock-item-info">
               <h3>${item.type}</h3>
               <p>${item.category} • ₱${item.price.toLocaleString()}</p>
            </div>
            <span class="stock-badge low">Low Stock (${item.qty})</span>
         `;
         stockList.appendChild(itemDiv);
      });
   }





   // ==================== REPORT MODAL ====================
   document.querySelector('.export-report-button .button').addEventListener('click', () => {
      document.getElementById('report-modal').classList.add('show');
      generateReport(currentPeriod);
   });

   function generateReport(period) {
      const now = new Date();
      const currentTransactions = getSalesTransactionsByPeriod(period);
      const previousTransactions = getPreviousPeriodTransactions(period);
      
      // Calculate current period data
      const currentSales = calculateTotalSales(currentTransactions);
      const currentProductsSold = calculateProductsSold(currentTransactions);
      
      // Calculate previous period data
      const previousSales = calculateTotalSales(previousTransactions);
      
      // Calculate percentage change
      const salesDifference = currentSales - previousSales;
      const percentageChange = previousSales === 0 ? 0 : ((salesDifference / previousSales) * 100).toFixed(1);
      const changeSign = salesDifference >= 0 ? '+' : '';
      
      // Get low stock count (always current)
      const lowStock = getLowStockItems().length;
      const outOfStock = getOutOfStockItems().length;
      const totalLowStock = lowStock + outOfStock;
      
      // Update report title and date range
      const periodInfo = getPeriodInfo(period, now);
      document.getElementById('report-period-title').textContent = periodInfo.title;
      document.getElementById('report-date-range').textContent = periodInfo.dateRange;
      
      // Update report cards
      document.getElementById('report-total-sales').textContent = '₱' + currentSales.toLocaleString();
      document.getElementById('report-products-sold').textContent = currentProductsSold.toLocaleString();
      document.getElementById('report-low-stock').textContent = totalLowStock.toLocaleString();
      
      // Update sales change with color
      const salesChangeElement = document.getElementById('report-sales-change');
      salesChangeElement.textContent = changeSign + percentageChange + '%';
      salesChangeElement.style.color = salesDifference >= 0 ? '#4caf50' : '#ff4e4e';
      
      // Update comparison labels and values
      document.getElementById('current-period-label').textContent = periodInfo.currentLabel;
      document.getElementById('previous-period-label').textContent = periodInfo.previousLabel;
      document.getElementById('current-period-value').textContent = '₱' + currentSales.toLocaleString();
      document.getElementById('previous-period-value').textContent = '₱' + previousSales.toLocaleString();
      
      // Update difference
      const differenceElement = document.getElementById('difference-value');
      differenceElement.textContent = changeSign + '₱' + Math.abs(salesDifference).toLocaleString();
      differenceElement.style.color = salesDifference >= 0 ? '#4caf50' : '#ff4e4e';
   }

   // Period Info
   function getPeriodInfo(period, now) {
      const formatDate = (date) => {
         return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };
      
      if (period === 'today') {
         const yesterday = new Date(now);
         yesterday.setDate(yesterday.getDate() - 1);
         return {
            title: 'Daily Report',
            dateRange: formatDate(now),
            currentLabel: 'Today',
            previousLabel: 'Yesterday'
         };
      }
      
      if (period === 'weekly') {
         const weekAgo = new Date(now);
         weekAgo.setDate(weekAgo.getDate() - 7);
         return {
            title: 'Weekly Report',
            dateRange: formatDate(weekAgo) + ' - ' + formatDate(now),
            currentLabel: 'This Week',
            previousLabel: 'Last Week'
         };
      }
      
      if (period === 'monthly') {
         const monthAgo = new Date(now);
         monthAgo.setMonth(monthAgo.getMonth() - 1);
         return {
            title: 'Monthly Report',
            dateRange: formatDate(monthAgo) + ' - ' + formatDate(now),
            currentLabel: 'This Month',
            previousLabel: 'Last Month'
         };
      }
      
      if (period === 'yearly') {
         const yearAgo = new Date(now);
         yearAgo.setFullYear(yearAgo.getFullYear() - 1);
         return {
            title: 'Yearly Report',
            dateRange: formatDate(yearAgo) + ' - ' + formatDate(now),
            currentLabel: 'This Year',
            previousLabel: 'Last Year'
         };
      }
      
      if (period === 'alltime') {
         return {
            title: 'All Time Report',
            dateRange: 'All recorded transactions',
            currentLabel: 'Total',
            previousLabel: 'N/A'
         };
      }
      
      return {
         title: 'Report',
         dateRange: '',
         currentLabel: 'Current',
         previousLabel: 'Previous'
      };
   }



   // Previous Period Transaction
   function getPreviousPeriodTransactions(period) {
      const all = getAllTransactions();
      const now = new Date();
      
      if (period === 'alltime') {
         return []; // No previous period for all time
      }
      
      if (period === 'today') {
         // Yesterday's transactions
         const yesterday = new Date(now);
         yesterday.setDate(yesterday.getDate() - 1);
         const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
         const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
         
         return all.filter(t => {
            const date = new Date(t.timestamp);
            return date >= yesterdayStart && date <= yesterdayEnd && t.total > 0;
         });
      }
      
      if (period === 'weekly') {
         // Last week (7-14 days ago)
         const twoWeeksAgo = new Date(now);
         twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
         const oneWeekAgo = new Date(now);
         oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
         
         return all.filter(t => {
            const date = new Date(t.timestamp);
            return date >= twoWeeksAgo && date < oneWeekAgo && t.total > 0;
         });
      }
      
      if (period === 'monthly') {
         // Last month (30-60 days ago)
         const twoMonthsAgo = new Date(now);
         twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
         const oneMonthAgo = new Date(now);
         oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
         
         return all.filter(t => {
            const date = new Date(t.timestamp);
            return date >= twoMonthsAgo && date < oneMonthAgo && t.total > 0;
         });
      }
      
      if (period === 'yearly') {
         // Last year (12-24 months ago)
         const twoYearsAgo = new Date(now);
         twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
         const oneYearAgo = new Date(now);
         oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
         
         return all.filter(t => {
            const date = new Date(t.timestamp);
            return date >= twoYearsAgo && date < oneYearAgo && t.total > 0;
         });
      }
      
      return [];
   }

   // Print report function (global so HTML can call it)
   window.printReport = function() {
      // Get the report content
      const reportContent = document.getElementById('report-content').cloneNode(true);
      const periodTitle = document.getElementById('report-period-title').textContent;
      const dateRange = document.getElementById('report-date-range').textContent;
      
      // Create a new window
      const printWindow = window.open('', '_blank');
      
      // Write the HTML for the print page
      printWindow.document.write(`
         <!DOCTYPE html>
         <html lang="en">
         <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${periodTitle} - Sales Report</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
               * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                  font-family: "Poppins", Arial, sans-serif;
               }
               body {
                  padding: 40px;
                  background: white;
               }
               .report-header {
                  text-align: center;
                  margin-bottom: 40px;
                  padding-bottom: 20px;
                  border-bottom: 3px solid #5a58ff;
               }
               .report-header h1 {
                  font-size: 32px;
                  color: #5a58ff;
                  margin-bottom: 10px;
               }
               .report-header p {
                  font-size: 16px;
                  color: #666;
               }
               .report-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 25px;
                  margin-bottom: 40px;
               }
               .report-card {
                  background: linear-gradient(135deg, #f5f5ff 0%, #e8e7ff 100%);
                  padding: 25px;
                  border-radius: 16px;
                  display: flex;
                  align-items: center;
                  gap: 20px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
               }
               .report-card-icon {
                  width: 60px;
                  height: 60px;
                  background: #5a58ff;
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 28px;
                  color: white;
               }
               .report-card-content {
                  flex: 1;
               }
               .report-label {
                  font-size: 14px;
                  color: #666;
                  margin-bottom: 8px;
               }
               .report-card h3 {
                  font-size: 28px;
                  color: #333;
                  margin: 0;
               }
               .report-comparison {
                  background: #f8f8f8;
                  padding: 25px;
                  border-radius: 16px;
                  margin-bottom: 30px;
               }
               .report-comparison h4 {
                  font-size: 20px;
                  margin-bottom: 20px;
                  color: #5a58ff;
               }
               .comparison-table {
                  display: flex;
                  flex-direction: column;
                  gap: 15px;
               }
               .comparison-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 15px 20px;
                  background: white;
                  border-radius: 10px;
               }
               .comparison-row.highlight {
                  background: #5a58ff;
                  color: white;
                  font-weight: 600;
               }
               .comparison-label {
                  font-size: 16px;
               }
               .comparison-value {
                  font-size: 18px;
                  font-weight: 600;
               }
               .report-footer {
                  text-align: center;
                  margin-top: 50px;
                  padding-top: 20px;
                  border-top: 2px solid #f0f0f0;
                  color: #999;
                  font-size: 14px;
               }
               @media print {
                  body {
                     padding: 20px;
                  }
                  .report-card {
                     break-inside: avoid;
                  }
               }
            </style>
         </head>
         <body>
            <div class="report-header">
               <h1>${periodTitle}</h1>
               <p>${dateRange}</p>
            </div>
            ${reportContent.innerHTML}
            <div class="report-footer">
               <p>Generated on ${new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
               })}</p>
            </div>
         </body>
         </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load, then trigger print dialog
      printWindow.onload = function() {
         printWindow.focus();
         setTimeout(() => {
            printWindow.print();
         }, 250);
      };
   };

   // ==================== INITIALIZE DASHBOARD ====================
   function initializeDashboard() {
      // Initialize top dropdown
      initializeTopDropdown();
      
      // Initialize date picker
      initializeDatePicker();
      
      // Populate category dropdown on page load
      populateCategoryDropdown();
      
      // Set Weekly as default and update dashboard
      updateDashboard('weekly');
   }
   // Initialize the dashboard
   initializeDashboard();

});