document.addEventListener("DOMContentLoaded", () => {

    console.log("JS LOADED");

    const billList = document.getElementById("billList");
    const tabs = document.querySelectorAll(".tab");

    const salaryInput = document.getElementById("salaryInput");
    const saveBtn = document.getElementById("saveSalary");
    const totalAmount = document.getElementById("totalAmount");
    const balanceEl = document.getElementById("balance");

    let bills = [];
    let currentTab = "upcoming";

    let notifiedBills = new Set();

    // =========================
    // 🔔 REQUEST NOTIFICATION PERMISSION
    // =========================
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            console.log("Notification permission:", permission);
        });
    }

    // =========================
    // 🔥 LOAD BILLS
    // =========================
    function loadBills() {
        fetch('/get_bills')
        .then(res => res.json())
        .then(data => {
            console.log("DATA:", data);
            bills = data;
            renderBills();
            updateSummary();
            checkUpcomingBills();   // 🔔 CHECK NOTIFICATIONS
        })
        .catch(err => console.error(err));
    }

    // =========================
    // 🔥 STATUS LOGIC
    // =========================
    function getStatus(bill) {

        if (bill.status === "paid") return "paid";

        const today = new Date();
        const dueDate = new Date(bill.due);

        today.setHours(0,0,0,0);
        dueDate.setHours(0,0,0,0);

        if (dueDate < today) return "overdue";

        return "upcoming";
    }

    // =========================
    // 📅 FORMAT DATE
    // =========================
    function formatDate(dateStr) {
        if (!dateStr) return "No date";

        const date = new Date(dateStr);

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    // =========================
    // 🧾 RENDER BILLS
    // =========================
    function renderBills() {

        billList.innerHTML = "";

        if (!bills || bills.length === 0) {
            billList.innerHTML = "<p>No bills found</p>";
            return;
        }

        let filtered = bills.filter(bill => getStatus(bill) === currentTab);

        if (filtered.length === 0) {
            billList.innerHTML = "<p>No bills in this section</p>";
            return;
        }

        filtered.forEach(bill => {

            const card = document.createElement("div");
            card.classList.add("bill-card");

            card.innerHTML = `
                <h3>${bill.bill_name}</h3>
                <p>₹${bill.amount}</p>
                <p>Due: ${formatDate(bill.due)}</p>
            `;

            const btn = document.createElement("button");

            if (currentTab === "paid") {
                btn.innerText = "🗑";
                btn.classList.add("delete-btn");
                btn.onclick = () => removeWithAnimation(card, bill.id);
            } else {
                btn.innerText = "✔";
                btn.classList.add("pay-btn");
                btn.onclick = () => markPaid(bill.id);
            }

            card.appendChild(btn);
            billList.appendChild(card);
        });
    }

    // =========================
    // 💰 UPDATE SUMMARY
    // =========================
    function updateSummary() {

        const salary = parseFloat(localStorage.getItem("salary")) || 0;

        let totalBills = 0;

        bills.forEach(bill => {
            if (bill.status !== "paid" && bill.status !== "hidden") {
                totalBills += parseFloat(bill.amount) || 0;
            }
        });

        totalAmount.innerText = "₹" + totalBills;

        const remaining = salary - totalBills;

        balanceEl.innerText = "Remaining: ₹" + remaining;

        balanceEl.style.color = remaining < 0 ? "red" : "lightgreen";
    }

    // =========================
    // 💾 SAVE SALARY
    // =========================
    saveBtn.addEventListener("click", () => {

        const salary = salaryInput.value;

        if (!salary) {
            alert("Enter salary first");
            return;
        }

        localStorage.setItem("salary", salary);

        updateSummary();
    });

    // =========================
    // 🔁 TAB SWITCH
    // =========================
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {

            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            currentTab = tab.dataset.type;

            renderBills();
        });
    });

    // =========================
    // ✔ MARK PAID
    // =========================
    function markPaid(id) {
        fetch(`/mark_paid/${id}`)
        .then(() => loadBills())
        .catch(err => console.error(err));
    }

    // =========================
    // 🗑 DELETE
    // =========================
    function hideBill(id) {
        fetch(`/hide_bill/${id}`)
        .then(() => loadBills());
    }

    // =========================
    // ✨ ANIMATION
    // =========================
    function removeWithAnimation(card, id) {
        card.style.opacity = "0";
        card.style.transform = "translateX(50px)";

        setTimeout(() => {
            hideBill(id);
        }, 300);
    }

    // =========================
    // 🔔 CHECK UPCOMING BILLS
    // =========================
    function checkUpcomingBills() {

        const today = new Date();
        today.setHours(0,0,0,0);

        bills.forEach(bill => {

            if (bill.status === "paid") return;

            const dueDate = new Date(bill.due);
            dueDate.setHours(0,0,0,0);

            const diffDays = (dueDate - today) / (1000 * 60 * 60 * 24);

            if ((diffDays === 2 || diffDays === 3) && !notifiedBills.has(bill.id)) {

                showNotification(bill);
                notifiedBills.add(bill.id);
            }
        });
    }

    // =========================
    // 🔔 SHOW NOTIFICATION
    // =========================
    function showNotification(bill) {

        if (Notification.permission === "granted") {

            new Notification("⏰ Bill Reminder", {
                body: `${bill.bill_name} due soon!\nAmount: ₹${bill.amount}`,
                icon: "https://cdn-icons-png.flaticon.com/512/1827/1827370.png"
            });

        }
    }

    // =========================
    // 🚀 INITIAL LOAD
    // =========================
    loadBills();

    // load saved salary
    const savedSalary = localStorage.getItem("salary");
    if (savedSalary) {
        salaryInput.value = savedSalary;
    }

});