document.addEventListener("DOMContentLoaded", () => {
    const itemsBody = document.getElementById("items-body");
    const btnAddItem = document.getElementById("btn-add-item");
    const btnPrint = document.getElementById("btn-print");
    const btnReset = document.getElementById("btn-reset");
    const invoiceCanvas = document.getElementById("invoice-canvas");
    const companyNameHeader = document.getElementById("company-name");
    const sigCompanyName = document.getElementById("sig-company-name");

    companyNameHeader.addEventListener('input', () => {
        sigCompanyName.innerText = companyNameHeader.innerText;
    });

    const createRowHTML = () => `
        <td class="center sr-no">1</td>
        <td contenteditable="true" class="desc" placeholder="Item description">Item Name</td>
        <td contenteditable="true" class="center hsn" placeholder="1234"></td>
        <td contenteditable="true" class="num-input qty">1</td>
        <td contenteditable="true" class="num-input price">0.00</td>
        <td contenteditable="true" class="num-input discount">0.00</td>
        <td class="calc-val taxable">0.00</td>
        <td contenteditable="true" class="num-input gst-rate">18</td>
        <td class="calc-val gst-amt">0.00</td>
        <td class="calc-val row-total">0.00</td>
        <td class="center no-print"><button class="btn-remove">X</button></td>
    `;

    function addRow(data) {
        const tr = document.createElement("tr");
        tr.innerHTML = createRowHTML();
        if (data) {
            tr.querySelector('.desc').innerText = data.desc ?? '';
            tr.querySelector('.hsn').innerText = data.hsn ?? '';
            tr.querySelector('.qty').innerText = data.qty ?? '1';
            tr.querySelector('.price').innerText = data.price ?? '0.00';
            tr.querySelector('.discount').innerText = data.discount ?? '0.00';
            tr.querySelector('.gst-rate').innerText = data.gstRate ?? '18';
        }
        itemsBody.appendChild(tr);
        updateSrNo();
        attachRowListeners(tr);
        calculateTotals();
    }

    function updateSrNo() {
        itemsBody.querySelectorAll("tr:not(.empty-row)").forEach((row, i) => {
            row.querySelector(".sr-no").innerText = i + 1;
        });
        renderEmptyRow();
    }

    function renderEmptyRow() {
        const existing = itemsBody.querySelector(".empty-row");
        const dataRows = itemsBody.querySelectorAll("tr:not(.empty-row)");
        if (dataRows.length === 0 && !existing) {
            const tr = document.createElement("tr");
            tr.className = "empty-row no-print";
            tr.innerHTML = `<td colspan="11"><button class="btn btn-primary" id="empty-add">+ Add Line Item</button></td>`;
            itemsBody.appendChild(tr);
            tr.querySelector("#empty-add").addEventListener("click", () => addRow());
        } else if (dataRows.length > 0 && existing) {
            existing.remove();
        }
    }

    function attachRowListeners(row) {
        row.querySelector(".btn-remove").addEventListener("click", () => {
            row.remove();
            updateSrNo();
            calculateTotals();
        });
        row.querySelectorAll(".num-input").forEach(input => {
            input.addEventListener("input", calculateTotals);
        });
    }


    function calculateTotals() {
        let subtotal = 0, totalGst = 0;
        itemsBody.querySelectorAll("tr:not(.empty-row)").forEach(row => {
            const qty = parseFloat(row.querySelector(".qty").innerText) || 0;
            const price = parseFloat(row.querySelector(".price").innerText) || 0;
            const discount = parseFloat(row.querySelector(".discount").innerText) || 0;
            const gstRate = parseFloat(row.querySelector(".gst-rate").innerText) || 0;

            const taxable = Math.max(0, (qty * price) - discount);
            const gstAmt = taxable * (gstRate / 100);
            const total = taxable + gstAmt;

            row.querySelector(".taxable").innerText = taxable.toFixed(2);
            row.querySelector(".gst-amt").innerText = gstAmt.toFixed(2);
            row.querySelector(".row-total").innerText = total.toFixed(2);

            subtotal += taxable;
            totalGst += gstAmt;
        });

        const cgst = totalGst / 2;
        const sgst = totalGst / 2;
        const grandTotal = subtotal + cgst + sgst;

        document.getElementById("calc-subtotal").innerText = `₹${subtotal.toFixed(2)}`;
        document.getElementById("calc-cgst").innerText = `₹${cgst.toFixed(2)}`;
        document.getElementById("calc-sgst").innerText = `₹${sgst.toFixed(2)}`;
        document.getElementById("calc-total").innerText = `₹${grandTotal.toFixed(2)}`;
        document.getElementById("amount-words").innerText = numberToWordsIndian(Math.round(grandTotal)) + " Rupees Only";

        saveData();
    }

    function numberToWordsIndian(num) {
        if (num === 0) return "Zero";
        const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
        const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
        if ((num = num.toString()).length > 9) return 'Overflow';
        const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str.trim();
    }

    const metaIds = ['company-name','company-address','company-phone','company-email','company-gstin','invoice-number','invoice-date','place-supply','customer-name','customer-address','customer-phone','customer-gstin','bank-details','terms'];

    function saveData() {
        const meta = {};
        metaIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) meta[id] = el.innerHTML;
        });
        const items = [];
        itemsBody.querySelectorAll("tr:not(.empty-row)").forEach(row => {
            items.push({
                desc: row.querySelector('.desc').innerText,
                hsn: row.querySelector('.hsn').innerText,
                qty: row.querySelector('.qty').innerText,
                price: row.querySelector('.price').innerText,
                discount: row.querySelector('.discount').innerText,
                gstRate: row.querySelector('.gst-rate').innerText
            });
        });
        localStorage.setItem('invoiceData', JSON.stringify({ meta, items }));
    }

    function loadData() {
        const saved = JSON.parse(localStorage.getItem('invoiceData'));
        if (!saved) {
            const today = new Date();
            document.getElementById("invoice-date").innerText = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            document.getElementById("invoice-number").innerText = `INV-${Math.floor(Math.random()*10000)}`;
            addRow();
            return;
        }
        if (saved.meta) {
            for (const key in saved.meta) {
                const el = document.getElementById(key);
                if (el) el.innerHTML = saved.meta[key];
            }
        }
        sigCompanyName.innerText = document.getElementById("company-name").innerText;
        if (saved.items && saved.items.length > 0) {
            saved.items.forEach(item => addRow(item));
        } else {
            addRow();
        }
    }

    invoiceCanvas.addEventListener('input', (e) => {
        if (e.target.hasAttribute('contenteditable')) saveData();
    });

    btnAddItem.addEventListener("click", () => addRow());
    btnPrint.addEventListener("click", () => {
        const inv = (document.getElementById("invoice-number").innerText || "Invoice").trim();
        const prev = document.title;
        document.title = inv;
        window.print();
        setTimeout(() => { document.title = prev; }, 500);
    });

    // Keep document.title in sync so the browser print header shows the invoice number, not the page title
    const setDocTitle = () => {
        const inv = (document.getElementById("invoice-number").innerText || "Invoice").trim();
        document.title = inv;
    };
    document.getElementById("invoice-number").addEventListener("input", setDocTitle);
    btnReset.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear the entire invoice?")) {
            localStorage.removeItem('invoiceData');
            location.reload();
        }
    });

    loadData();
    setDocTitle();
});
