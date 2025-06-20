// Tab switching
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Confirmation modal
function confirmAction(message, callback) {
  const modal = document.getElementById("confirmModal");
  document.getElementById("confirmText").textContent = message;
  modal.style.display = "flex";

  const yes = document.getElementById("confirmYes");
  const no = document.getElementById("confirmNo");

  function cleanup() {
    modal.style.display = "none";
    yes.removeEventListener("click", onYes);
    no.removeEventListener("click", onNo);
  }

  function onYes() {
    callback(true);
    cleanup();
  }

  function onNo() {
    callback(false);
    cleanup();
  }

  yes.addEventListener("click", onYes);
  no.addEventListener("click", onNo);
}

// Load items on page load
window.addEventListener("DOMContentLoaded", loadItems);

// Form submission with N/A handling for optional fields
document.getElementById("itemForm").addEventListener("submit", async e => {
  e.preventDefault();
  confirmAction("Are you sure you want to add this item?", async confirmed => {
    if (!confirmed) return;

    const data = {
      name: document.getElementById("name").value,
      manufacturer: document.getElementById("manufacturer").value.trim() || "N/A",
      model: document.getElementById("model").value.trim() || "N/A",
      quantity: document.getElementById("quantity").value,
      location: document.getElementById("location").value,
      description: document.getElementById("description").value.trim() || "N/A",
    };

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        e.target.reset();
        loadItems();
        showNotification("✅ Item added successfully!", "success");
      } else {
        showNotification("❌ Error adding item", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("❌ Network error", "error");
    }
  });
});

// Load inventory items
async function loadItems() {
  try {
    const res = await fetch("/api/items");
    const items = await res.json();
    const tbody = document.getElementById("itemTable");
    const emptyState = document.getElementById("emptyState");
    
    tbody.innerHTML = "";

    if (items.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    items.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td contenteditable="true" data-field="name" data-id="${item.id}" data-label="Item Name">${item.name}</td>
        <td contenteditable="true" data-field="manufacturer" data-id="${item.id}" data-label="Manufacturer">
          <span class="${item.manufacturer === 'N/A' ? 'na-text' : ''}">${item.manufacturer}</span>
        </td>
        <td contenteditable="true" data-field="model" data-id="${item.id}" data-label="Model">
          <span class="${item.model === 'N/A' ? 'na-text' : ''}">${item.model}</span>
        </td>
        <td contenteditable="true" data-field="quantity" data-id="${item.id}" data-label="Quantity">${item.quantity}</td>
        <td contenteditable="true" data-field="location" data-id="${item.id}" data-label="Location">${item.location}</td>
        <td contenteditable="true" data-field="description" data-id="${item.id}" data-label="Description">
          <span class="${item.description === 'N/A' ? 'na-text' : ''}">${item.description}</span>
        </td>
        <td class="actions" data-label="Actions">
          <button class="btn-sm btn-update" onclick="updateItem(${item.id}, this)">Update</button>
          <button class="btn-sm btn-delete" onclick="deleteItem(${item.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading items:", error);
    showNotification("❌ Error loading items", "error");
  }
}

// Update item with N/A handling
async function updateItem(id, button) {
  confirmAction("Update this item?", async confirmed => {
    if (!confirmed) return;

    const row = button.closest("tr");
    const cells = row.querySelectorAll("[contenteditable]");
    const data = {};
    
    cells.forEach(cell => {
      const field = cell.dataset.field;
      let value = cell.textContent.trim();
      
      // Handle N/A for optional fields
      if ((field === 'manufacturer' || field === 'model' || field === 'description') && !value) {
        value = 'N/A';
      }
      
      data[field] = value;
    });

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        loadItems();
        showNotification("✅ Item updated successfully!", "success");
      } else {
        showNotification("❌ Error updating item", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("❌ Network error", "error");
    }
  });
}

// Delete item
async function deleteItem(id) {
  confirmAction("Delete this item permanently?", async confirmed => {
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      
      if (response.ok) {
        loadItems();
        showNotification("🗑️ Item deleted successfully!", "success");
      } else {
        showNotification("❌ Error deleting item", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("❌ Network error", "error");
    }
  });
}

// Enhanced search functionality
document.getElementById("searchInput").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  const rows = document.querySelectorAll("#itemTable tr");
  const emptyState = document.getElementById("emptyState");
  let visibleCount = 0;
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const isVisible = text.includes(term);
    row.style.display = isVisible ? "" : "none";
    if (isVisible) visibleCount++;
  });
  
  // Show/hide empty state based on search results
  if (visibleCount === 0 && term && rows.length > 0) {
    emptyState.style.display = "block";
    emptyState.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <h3>No Results Found</h3>
      <p>Try searching with different keywords</p>
    `;
  } else if (rows.length === 0) {
    emptyState.style.display = "block";
    emptyState.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <h3>No Items Found</h3>
      <p>Start by adding your first inventory item!</p>
    `;
  } else if (!term) {
    emptyState.style.display = "none";
  }
});

// Notification system
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  `;

  if (type === 'success') {
    notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
  } else if (type === 'error') {
    notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
  } else {
    notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
  }

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }

  /* Mobile notification positioning */
  @media (max-width: 768px) {
    .notification {
      top: 10px !important;
      right: 10px !important;
      left: 10px !important;
      max-width: none !important;
      text-align: center;
    }
  }
`;
document.head.appendChild(notificationStyles);