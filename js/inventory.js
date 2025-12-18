document.addEventListener("DOMContentLoaded", () => {
  
  const editBtn = document.getElementById("edit-btn");
  const saveBtn = document.getElementById("save-btn");
  const table = document.getElementById("inventory-table");
  const searchInput = document.querySelector(".search-box input");
  const searchBtn = document.querySelector(".search-btn");

  if (!editBtn || !saveBtn || !table) {
    return;
  } 

  let isEditing = false;
  let originalProducts = []; 
  let rowToDelete = null;
  let allProducts = []; 

  
  // ========== SEARCH FUNCTIONALITY ==========
  // search highlight
  function highlightText(text, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return text;
    }
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #7674f8; padding: 2px 4px; border-radius: 3px; font-weight: 600;">$1</mark>');
  }
  
  function matchesSearch(product, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return true;
    }
    
    const term = searchTerm.toLowerCase();
    const category = (product.category || '').toLowerCase();
    const type = (product.type || '').toLowerCase();
    const price = product.price.toString().toLowerCase();
    const qty = product.qty.toString().toLowerCase();
    
    return category.includes(term) || 
           type.includes(term) || 
           price.includes(term) ||
           qty.includes(term);
  }
  
  function filterProducts(searchTerm = null) {
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = '';
    
    let filteredProducts = allProducts;
    if (searchTerm && searchTerm.trim() !== '') {
      filteredProducts = allProducts.filter(product => matchesSearch(product, searchTerm));
    }
    
    if (filteredProducts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
            No products ${searchTerm ? 'matching your search' : 'found'}
          </td>
        </tr>
      `;
      return;
    }
    
    filteredProducts.forEach(product => {
      const row = document.createElement("tr");
      
      const highlightedCategory = highlightText(product.category, searchTerm);
      const highlightedType = highlightText(product.type, searchTerm);
      const highlightedPrice = highlightText('₱' + product.price, searchTerm);
      const highlightedQty = highlightText(product.qty.toString(), searchTerm);
      
      row.innerHTML = `
        <td>${highlightedCategory}</td>
        <td>${highlightedType}</td>
        <td>${highlightedPrice}</td>
        <td>${highlightedQty}</td>
        <td class="status-cell"></td>
      `;
      tbody.appendChild(row);
      
      const statusCell = row.querySelector('.status-cell');
      updateStatusDisplay(product.qty, statusCell);
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value;
      filterProducts(searchTerm);
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = searchInput.value;
        filterProducts(searchTerm);
      }
    });
  }
  
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const searchTerm = searchInput ? searchInput.value : null;
      filterProducts(searchTerm);
    });
  }

  
  // STATUS
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

  function loadInventory() {
    const stored = localStorage.getItem('inventory_data');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  function saveInventory(products) {
    localStorage.setItem('inventory_data', JSON.stringify(products));
    allProducts = [...products]; 
  }

  function populateTable(products) {
    allProducts = [...products]; 
    filterProducts();
  }

  function initializeInventory() {
    const storedInventory = loadInventory();
    
    if (storedInventory) {
      populateTable(storedInventory);
    } else {
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
      populateTable(products);
    }
  }

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
              month: "short", 
              day: "numeric", 
              year: "numeric"
          }).replace(",", "."),
          item: change.type,
          quantity: change.qty,
          total: 0, 
          time: now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit"
          }),
          timestamp: now.toISOString(),
          action: change.action, 
          details: change.details
        };
        
        window.TransactionStorage.saveTransaction(transaction);
    });
  }

  initializeInventory();
  captureOriginalState();



  // Delete Modal Functionality
  const deleteModal = document.getElementById('deleteModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  function showDeleteModal(row) {
    rowToDelete = row;
    deleteModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    deleteModal.style.display = 'none';
    rowToDelete = null;
  }

  confirmDeleteBtn.addEventListener('click', () => {
    if (rowToDelete) {
      rowToDelete.remove();
      closeDeleteModal();
    }
  });

  cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      closeDeleteModal();
    }
  });




  
  // --------------------------- EDIT MODE ---------------------------
  editBtn.addEventListener("click", () => {
    isEditing = true;

    if (searchInput) searchInput.value = '';
    filterProducts();

    const rows = table.querySelectorAll("tbody tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        cells[0].contentEditable = true;
        cells[1].contentEditable = true;
        cells[2].contentEditable = true;

        cells[0].innerHTML = cells[0].textContent;
        cells[1].innerHTML = cells[1].textContent;
        cells[2].innerHTML = cells[2].textContent;

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

        if (cells.length === 5) {
          const actionCell = document.createElement('td');
          actionCell.innerHTML = '<button class="delete-btn button" style="background: #e63939;">Delete</button>';
          row.appendChild(actionCell);
          
          actionCell.querySelector('.delete-btn').addEventListener('click', () => {
            showDeleteModal(row);
          });
        }
    });


    const headerRow = table.querySelector("thead tr");
    if (headerRow.children.length === 5) {
        const actionHeader = document.createElement('th');
        actionHeader.textContent = 'Actions';
        headerRow.appendChild(actionHeader);
    }

    editBtn.parentElement.style.display = "none";
    saveBtn.parentElement.style.display = "block";

    if (searchInput) searchInput.disabled = true;
    if (searchBtn) searchBtn.disabled = true;




    // ------------- ADD PRODUCT BUTTON  -------------
    let addProductBtn = document.getElementById("add-product-btn");

    if (!addProductBtn) {
      addProductBtn = document.createElement("button");
      addProductBtn.id = "add-product-btn";
      addProductBtn.className = "button";
      addProductBtn.style.marginLeft = "10px";
      addProductBtn.textContent = "Add Product";

      saveBtn.parentElement.appendChild(addProductBtn);

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

          table.querySelector("tbody").insertBefore(newRow, table.querySelector("tbody").firstChild);

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

          newRow.querySelector('.delete-btn').addEventListener('click', () => {
            showDeleteModal(newRow);
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

        cells[0].contentEditable = false;
        cells[1].contentEditable = false;
        cells[2].contentEditable = false;

        const qtyBox = cells[3].querySelector(".qty-box");
        const finalQty = parseInt(qtyBox.value);

        cells[3].textContent = finalQty;

        updateStatusDisplay(finalQty, cells[4]);

        if (cells.length === 6) {
          cells[5].remove();
        }

        const priceText = cells[2].textContent.replace('₱', '').trim();
        currentProducts.push({
          category: cells[0].textContent.trim(),
          type: cells[1].textContent.trim(),
          price: parseFloat(priceText),
          qty: finalQty
        });
    });

    // Detect changes
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

    saveInventory(currentProducts);

    if (changes.length > 0) {
        logInventoryChanges(changes);
    }

    captureOriginalState();

    const headerRow = table.querySelector("thead tr");
    if (headerRow.children.length === 6) {
        headerRow.children[5].remove();
    }

    saveBtn.parentElement.style.display = "none";
    editBtn.parentElement.style.display = "block";

    if (searchInput) {
      searchInput.disabled = false;
      searchInput.value = '';
    }
    if (searchBtn) searchBtn.disabled = false;

    const addProductBtn = document.getElementById("add-product-btn");
    if (addProductBtn){
      addProductBtn.remove();
    }

    filterProducts();

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
        let ascending = true;
        if (key === 'status') {
          sortStates[key] = 'default';
        } else {
          ascending = sortStates[key] === 'asc';
          sortStates[key] = ascending ? 'desc' : 'asc';
        }
        
        updateLinkText(linkElement, key, ascending);
        
        allProducts.sort((a, b) => {
          switch(key) {
              case 'category':
                return ascending ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
                
              case 'type':
                return ascending ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
                
              case 'price':
                return ascending ? a.price - b.price : b.price - a.price;
                
              case 'quantity':
                return ascending ? a.qty - b.qty : b.qty - a.qty;
                
              case 'status':
                const statusOrder = { 'Out of stock': 0, 'Low stock': 1, 'In stock': 2 };
                const getStatus = (qty) => {
                  if (qty <= 0) return 'Out of stock';
                  if (qty < 15) return 'Low stock';
                  return 'In stock';
                };
                const aStatus = statusOrder[getStatus(a.qty)];
                const bStatus = statusOrder[getStatus(b.qty)];
                return aStatus - bStatus;
                
              default:
                return 0;
          }
        });
        
        const searchTerm = searchInput ? searchInput.value : null;
        filterProducts(searchTerm);
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