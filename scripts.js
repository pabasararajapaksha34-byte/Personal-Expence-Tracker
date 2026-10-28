
/* Get HTML Elements */

const transactionForm = document.getElementById("transactionForm");

const transactionType = document.getElementById("transactionType");
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const transactionDate = document.getElementById("transactionDate");

const totalIncomeElement = document.getElementById("totalIncome");
const totalExpensesElement = document.getElementById("totalExpenses");
const currentBalanceElement = document.getElementById("currentBalance");

const transactionTableBody = document.getElementById("transactionTableBody");

const filterType = document.getElementById("filterType");
const searchInput = document.getElementById("searchInput");
const clearFormBtn = document.getElementById("clearFormBtn");


/* Store Transactions */

const STORAGE_KEY = "personalExpenseTrackerTransactions";

let transactions = [];

try {
    const savedTransactions = localStorage.getItem(STORAGE_KEY);

    if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);

        if (Array.isArray(parsedTransactions)) {
            transactions = parsedTransactions.filter(transaction =>
                transaction &&
                typeof transaction.id === "string" &&
                ["Income", "Expense"].includes(transaction.type) &&
                typeof transaction.description === "string" &&
                transaction.description.trim() !== "" &&
                typeof transaction.amount === "number" &&
                Number.isFinite(transaction.amount) &&
                transaction.amount > 0 &&
                typeof transaction.category === "string" &&
                typeof transaction.date === "string"
            );
        }
    }
} catch (error) {
    console.error("Unable to load saved transactions:", error);
    transactions = [];
}


/* Helper Functions */

// Format amounts using Sri Lankan Rupees
function formatCurrency(value) {
    return "LKR " + value.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// Save transactions to localStorage
function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );
        return true;
    } catch (error) {
        console.error("Unable to save transactions:", error);
        alert("Unable to save data in this browser.");
        return false;
    }
}


// Set today's date in the form
function setTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    transactionDate.value = `${year}-${month}-${day}`;
}


/* Calculate Summary Totals */

function updateSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
        if (transaction.type === "Income") {
            totalIncome += transaction.amount;
        } else if (transaction.type === "Expense") {
            totalExpenses += transaction.amount;
        }
    });

    const balance = totalIncome - totalExpenses;

    totalIncomeElement.textContent = formatCurrency(totalIncome);
    totalExpensesElement.textContent = formatCurrency(totalExpenses);
    currentBalanceElement.textContent = formatCurrency(balance);

    currentBalanceElement.style.color =
        balance < 0 ? "#dc3545" : "#222222";
}


/* Display Transaction Table */

function renderTransactions() {
    transactionTableBody.replaceChildren();

    const selectedType = filterType.value;
    const searchText = searchInput.value.trim().toLowerCase();

    const filteredTransactions = transactions.filter(transaction => {
        const matchesType =
            selectedType === "All" ||
            transaction.type === selectedType;

        const matchesSearch =
            transaction.description.toLowerCase().includes(searchText) ||
            transaction.category.toLowerCase().includes(searchText);

        return matchesType && matchesSearch;
    });

    if (filteredTransactions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "No transactions found.";

        row.appendChild(cell);
        transactionTableBody.appendChild(row);

        return;
    }

    // Display newest transactions first

    filteredTransactions
        .slice()
        .sort((a, b) => {
            const dateComparison = b.date.localeCompare(a.date);

            if (dateComparison !== 0) {
                return dateComparison;
            }

            return b.id.localeCompare(a.id);
        })
        .forEach(transaction => {
            const row = document.createElement("tr");

            // Date
            const dateCell = document.createElement("td");
            dateCell.textContent = transaction.date;
            row.appendChild(dateCell);

            // Description
            const descriptionCell = document.createElement("td");
            descriptionCell.textContent = transaction.description;
            row.appendChild(descriptionCell);

            // Type
            const typeCell = document.createElement("td");
            const typeLabel = document.createElement("span");

            typeLabel.textContent = transaction.type;
            typeLabel.className =
                transaction.type === "Income"
                    ? "type-income"
                    : "type-expense";

            typeCell.appendChild(typeLabel);
            row.appendChild(typeCell);

            // Category
            const categoryCell = document.createElement("td");
            categoryCell.textContent = transaction.category;
            row.appendChild(categoryCell);

            // Amount
            const amountCell = document.createElement("td");

            const sign =
                transaction.type === "Income" ? "+" : "-";

            amountCell.textContent =
                sign + " " + formatCurrency(transaction.amount);

            row.appendChild(amountCell);

            // Actions - Delete button
            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "btn-delete";
            deleteButton.dataset.id = transaction.id;

            deleteButton.setAttribute(
                "aria-label",
                "Delete transaction: " + transaction.description
            );

            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            transactionTableBody.appendChild(row);
        });
}


/* Add a Transaction */

transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const selectedType = transactionType.value;
    const enteredDescription = description.value.trim();
    const enteredAmount = Number(amount.value);
    const selectedCategory = category.value;
    const selectedDate = transactionDate.value;

    // Validate required fields
    if (
        !selectedType ||
        !enteredDescription ||
        !selectedCategory ||
        !selectedDate
    ) {
        alert("Please complete all required fields.");
        return;
    }

    // Validate transaction type
    if (!["Income", "Expense"].includes(selectedType)) {
        alert("Please select a valid transaction type.");
        return;
    }

    // Validate amount
    if (
        amount.value.trim() === "" ||
        !Number.isFinite(enteredAmount) ||
        enteredAmount <= 0
    ) {
        alert("Amount must be greater than zero.");
        amount.focus();
        return;
    }

    // Create a new transaction
    const newTransaction = {
        id: crypto.randomUUID(),
        type: selectedType,
        description: enteredDescription,
        amount: enteredAmount,
        category: selectedCategory,
        date: selectedDate
    };

    // Add transaction to the array
    transactions.push(newTransaction);

    // Save and update the page
    const saved = saveTransactions();

    updateSummary();
    renderTransactions();

    // Reset the form
    transactionForm.reset();
    setTodayDate();

    // Success alert
    if (saved) {
        alert("Transaction added successfully!");
    }
});


/* Delete a Transaction */

transactionTableBody.addEventListener("click", function (event) {
    const deleteButton = event.target.closest(".btn-delete");

    if (!deleteButton) {
        return;
    }

    const transactionId = deleteButton.dataset.id;

    const transactionToDelete = transactions.find(
        transaction => transaction.id === transactionId
    );

    if (!transactionToDelete) {
        return;
    }

    // Confirm before deleting
    const confirmed = confirm(
        `Are you sure you want to delete "${transactionToDelete.description}"?`
    );

    if (!confirmed) {
        return;
    }

    transactions = transactions.filter(
        transaction => transaction.id !== transactionId
    );

    const saved = saveTransactions();

    updateSummary();
    renderTransactions();

    if (saved) {
        alert("Transaction deleted successfully!");
    }
});


/* Filter Transactions */

filterType.addEventListener("change", function () {
    renderTransactions();
});


/* Search Transactions */

searchInput.addEventListener("input", function () {
    renderTransactions();
});


/* Clear Form */

clearFormBtn.addEventListener("click", function () {
    transactionForm.reset();
    setTodayDate();

    alert("Form cleared successfully!");
});


/* Initialize Application */

// Set today's date
setTodayDate();

// Display saved transactions and totals
updateSummary();
renderTransactions();
