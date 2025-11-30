// INVENTORY PAGE SPECIFIC FUNCTIONALITY

document.addEventListener("DOMContentLoaded", () => {
  
  const editBtn = document.getElementById("edit-btn");
  const saveBtn = document.getElementById("save-btn");
  const table = document.getElementById("inventory-table");

  // Only run if we're on the inventory page
  if (!editBtn || !saveBtn || !table) return;

  let isEditing = false;
  let originalProducts = []; // Store original state for comparison

  // Function to update status based on quantity
  function updateStatusDisplay(qty, statusCell) {
    if (qty <= 0) {
        statusCell.textContent = "Out of stock";
        statusCell.style.color = "red";
    } 
    else if (qty < 15) {
        statusCell.textContent = "Low stock";
        statusCell.style.color = "orange";
    } 
    else {
        statusCell.textContent = "In stock";
        statusCell.style.color = "green";
    }
  }

  // Load inventory from localStorage
  function loadInventory() {
    const stored = localStorage.getItem('inventory_data');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  // Save inventory to localStorage
  function saveInventory(products) {
    localStorage.setItem('inventory_data', JSON.stringify(products));
  }

  // Populate table from data
  function populateTable(products) {
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = '';
    
    products.forEach(product => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.category}</td>
        <td>${product.type}</td>
        <td>₱${product.price}</td>
        <td>${product.qty}</td>
        <td class="status-cell"></td>
      `;
      tbody.appendChild(row);
      
      // Update status
      const statusCell = row.querySelector('.status-cell');
      updateStatusDisplay(product.qty, statusCell);
    });
  }

  // Initialize inventory on page load
  function initializeInventory() {
    const storedInventory = loadInventory();
    
    if (storedInventory) {
      // Use stored inventory
      populateTable(storedInventory);
    } else {
      // First time - capture current table data
      const rows = table.querySelectorAll("tbody tr");
      const products = Array.from(rows).map(row => {
        const cells = row.querySelectorAll("td");
        return {
          category: cells[0].textContent.trim(),
          type: cells[1].textContent.trim(),
          price: parseFloat(cells[2].textContent.replace('₱', '').trim()),
          qty: parseInt(cells[3].textContent.trim())
        };
      });
      saveInventory(products);
    }
    
    // Apply status colors
    initializeStatuses();
  }

  // Apply status colors and text on page load
  function initializeStatuses() {
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const qty = parseInt(cells[3].textContent);
        const statusCell = cells[4];
        
        updateStatusDisplay(qty, statusCell);
    });
  }

  // Capture original state
  function captureOriginalState() {
    const rows = table.querySelectorAll("tbody tr");
    originalProducts = Array.from(rows).map(row => {
        const cells = row.querySelectorAll("td");
        return {
          category: cells[0].textContent.trim(),
          type: cells[1].textContent.trim(),
          price: parseFloat(cells[2].textContent.replace('₱', '').trim()),
          qty: parseInt(cells[3].textContent.trim())
        };
    });
  }

  // Log changes to history
  function logInventoryChanges(changes) {
    if (!window.TransactionStorage) return;
    
    changes.forEach(change => {
        const now = new Date();
        const transaction = {
          date: now.toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric"
          }).replace(",", "."),
          item: change.type,
          quantity: change.qty,
          total: 0, // Not a sale
          time: now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit"
          }),
          timestamp: now.toISOString(),
          action: change.action, // 'added', 'updated', 'deleted'
          details: change.details
        };
        
        window.TransactionStorage.saveTransaction(transaction);
    });
  }

  // Run on page load
  initializeInventory();
  captureOriginalState();

  // --------------------------- EDIT MODE ---------------------------
  editBtn.addEventListener("click", () => {
    isEditing = true;

    const rows = table.querySelectorAll("tbody tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        // CATEGORY / TYPE / PRICE become editable
        cells[0].contentEditable = true;
        cells[1].contentEditable = true;
        cells[2].contentEditable = true;

        // QUANTITY → convert into controls
        let qty = parseInt(cells[3].textContent);
        cells[3].innerHTML = `
          <button class="minus button">-</button>
          <input type="number" class="qty-box" value="${qty}">
          <button class="plus button">+</button>
        `;

        const minus = cells[3].querySelector(".minus");
        const plus = cells[3].querySelector(".plus");
        const qtyBox = cells[3].querySelector(".qty-box");
        const statusCell = cells[4];

        function updateStatus() {
          let q = parseInt(qtyBox.value);
          updateStatusDisplay(q, statusCell);
        }

        minus.addEventListener("click", () => {
          qtyBox.value = Math.max(0, parseInt(qtyBox.value) - 1);
          updateStatus();
        });

        plus.addEventListener("click", () => {
          qtyBox.value = parseInt(qtyBox.value) + 1;
          updateStatus();
        });

        qtyBox.addEventListener("input", updateStatus);

        // Add delete button in new Actions column
        if (cells.length === 5) {
          const actionCell = document.createElement('td');
          actionCell.innerHTML = '<button class="delete-btn button" style="background: #dc3545;">Delete</button>';
          row.appendChild(actionCell);
          
          actionCell.querySelector('.delete-btn').addEventListener('click', () => {
              if (confirm('Are you sure you want to delete this item?')) {
                row.remove();
              }
          });
        }
    });

    // Add Actions column header
    const headerRow = table.querySelector("thead tr");
    if (headerRow.children.length === 5) {
        const actionHeader = document.createElement('th');
        actionHeader.textContent = 'Actions';
        headerRow.appendChild(actionHeader);
    }

    // Swap buttons
    editBtn.parentElement.style.display = "none";
    saveBtn.parentElement.style.display = "block";


    // --- Add Product Button beside Save ---
    let addProductBtn = document.getElementById("add-product-btn");

    if (!addProductBtn) {
      addProductBtn = document.createElement("button");
      addProductBtn.id = "add-product-btn";
      addProductBtn.className = "button";
      addProductBtn.style.marginLeft = "10px";
      addProductBtn.textContent = "Add Product";

      saveBtn.parentElement.appendChild(addProductBtn);

      // Add new editable row
      addProductBtn.addEventListener("click", () => {
          const newRow = document.createElement("tr");
          newRow.classList.add("new-product");

          newRow.innerHTML = `
            <td contenteditable="true">Category</td>
            <td contenteditable="true">New Item</td>
            <td contenteditable="true">₱0</td>
            <td>
                <button class="minus button">-</button>
                <input type="number" class="qty-box" value="0">
                <button class="plus button">+</button>
            </td>
            <td class="status-cell">Out of stock</td>
            <td><button class="delete-btn button" style="background:#dc3545;">Delete</button></td>
          `;

          // Insert at top
          table.querySelector("tbody").insertBefore(newRow, table.querySelector("tbody").firstChild);

          // Make + and - work
          const minus = newRow.querySelector(".minus");
          const plus = newRow.querySelector(".plus");
          const qtyBox = newRow.querySelector(".qty-box");
          const statusCell = newRow.querySelector(".status-cell");

          const update = () => updateStatusDisplay(parseInt(qtyBox.value), statusCell);

          minus.addEventListener("click", () => {
            qtyBox.value = Math.max(0, parseInt(qtyBox.value) - 1);
            update();
          });
          plus.addEventListener("click", () => {
            qtyBox.value = parseInt(qtyBox.value) + 1;
            update();
          });
          qtyBox.addEventListener("input", update);

          // Delete button for new row
          newRow.querySelector('.delete-btn').addEventListener('click', () => {
              if (confirm('Are you sure you want to delete this item?')) {
                newRow.remove();
              }
          });

          update();
      });
    }

  });

  // --------------------------- SAVE MODE ---------------------------
  saveBtn.addEventListener("click", () => {
    if (!isEditing) return;
    isEditing = false;

    const rows = table.querySelectorAll("tbody tr");
    const currentProducts = [];
    const changes = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        // Save editable content
        cells[0].contentEditable = false;
        cells[1].contentEditable = false;
        cells[2].contentEditable = false;

        // Get final quantity
        const qtyBox = cells[3].querySelector(".qty-box");
        const finalQty = parseInt(qtyBox.value);

        // Replace controls with plain number
        cells[3].textContent = finalQty;

        // Update status based on final quantity
        updateStatusDisplay(finalQty, cells[4]);

        // Remove delete button
        if (cells.length === 6) {
          cells[5].remove();
        }

        // Store current state
        const priceText = cells[2].textContent.replace('₱', '').trim();
        currentProducts.push({
          category: cells[0].textContent.trim(),
          type: cells[1].textContent.trim(),
          price: parseFloat(priceText),
          qty: finalQty
        });
    });

    // Detect changes
    // Check for deleted items
    originalProducts.forEach(original => {
        const exists = currentProducts.find(p => p.type === original.type);
        if (!exists) {
          changes.push({
              action: 'deleted',
              type: original.type,
              qty: original.qty,
              details: `${original.type} deleted from inventory (was: ${original.category}, ₱${original.price}, Qty: ${original.qty})`
          });
        }
    });

    // Check for new and updated items
    currentProducts.forEach(current => {
        const original = originalProducts.find(p => p.type === current.type);
        if (original) {
          const qtyChanged = original.qty !== current.qty;
          const priceChanged = original.price !== current.price;
          const categoryChanged = original.category !== current.category;
          
          if (qtyChanged || priceChanged || categoryChanged) {
              let details = `${current.type} updated: `;
              if (qtyChanged) details += `Qty ${original.qty}→${current.qty} `;
              if (priceChanged) details += `Price ₱${original.price}→₱${current.price} `;
              if (categoryChanged) details += `Category ${original.category}→${current.category}`;
              
              changes.push({
                action: 'updated',
                type: current.type,
                qty: current.qty,
                details: details.trim()
              });
          }

        } else {
          // New item added
          changes.push({
            action: "added",
            type: current.type,
            qty: current.qty,
            details: `${current.type} added (Category: ${current.category}, ₱${current.price}, Qty: ${current.qty})`
          });
        }
    });

    // Save to localStorage FIRST
    saveInventory(currentProducts);

    // Then log changes to history
    if (changes.length > 0) {
        logInventoryChanges(changes);
    }

    // Update original state
    captureOriginalState();

    // Remove Actions column header
    const headerRow = table.querySelector("thead tr");
    if (headerRow.children.length === 6) {
        headerRow.children[5].remove();
    }

    // Swap buttons back
    saveBtn.parentElement.style.display = "none";
    editBtn.parentElement.style.display = "block";

    const addProductBtn = document.getElementById("add-product-btn");
    if (addProductBtn){
      addProductBtn.remove();
    } 

  });

  // ------------- SORT BUTTON --------------
  const sortStates = {
    category: 'asc',
    type: 'asc',
    price: 'asc',
    quantity: 'asc',
    status: 'default'
  };

  const sortDropdown = document.querySelector('.sort-inventory');
  const sortLinks = document.querySelectorAll('.sort-inventory .dropdown-options a');
  const tableBody = document.querySelector('#inventory-table tbody');

  if (sortDropdown && sortLinks.length > 0 && tableBody) {
    sortLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const key = link.getAttribute('data-key');
          sortTable(key, link);
        });
    });

    function sortTable(key, linkElement) {
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        
        let ascending = true;
        if (key === 'status') {
          sortStates[key] = 'default';
        } else {
          ascending = sortStates[key] === 'asc';
          sortStates[key] = ascending ? 'desc' : 'asc';
        }
        
        updateLinkText(linkElement, key, ascending);
        
        rows.sort((a, b) => {
          let aValue, bValue;
          
          switch(key) {
              case 'category':
                aValue = a.cells[0].textContent.trim();
                bValue = b.cells[0].textContent.trim();
                return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                
              case 'type':
                aValue = a.cells[1].textContent.trim();
                bValue = b.cells[1].textContent.trim();
                return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                
              case 'price':
                aValue = parseFloat(a.cells[2].textContent.replace('₱', '').trim());
                bValue = parseFloat(b.cells[2].textContent.replace('₱', '').trim());
                return ascending ? aValue - bValue : bValue - aValue;
                
              case 'quantity':
                aValue = parseInt(a.cells[3].textContent.trim());
                bValue = parseInt(b.cells[3].textContent.trim());
                return ascending ? aValue - bValue : bValue - aValue;
                
              case 'status':
                const statusOrder = { 'Out of stock': 0, 'Low stock': 1, 'In stock': 2 };
                aValue = statusOrder[a.cells[4].textContent.trim()];
                bValue = statusOrder[b.cells[4].textContent.trim()];
                return aValue - bValue;
                
              default:
                return 0;
          }
        });
        
        tableBody.innerHTML = '';
        rows.forEach(row => tableBody.appendChild(row));
    }

    function updateLinkText(linkElement, key, wasAscending) {
        switch(key) {
          case 'category':
              linkElement.textContent = wasAscending ? 'Category (Z-A)' : 'Category (A-Z)';
              break;
          case 'type':
              linkElement.textContent = wasAscending ? 'Type (Z-A)' : 'Type (A-Z)';
              break;
          case 'price':
              linkElement.textContent = wasAscending ? 'Price (High-Low)' : 'Price (Low-High)';
              break;
          case 'quantity':
              linkElement.textContent = wasAscending ? 'Quantity (High-Low)' : 'Quantity (Low-High)';
              break;
          case 'status':
              linkElement.textContent = 'Status';
              break;
        }
    }
  }

});