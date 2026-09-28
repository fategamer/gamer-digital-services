(function () {
  const C = window.BINGWA;
  if (!C) return;

  const generalWa = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(
    "Habari, niko na swali kuhusu Gamer Digital Services."
  )}`;
  ["waTop", "waSide", "waFloat"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = generalWa;
  });

  document.getElementById("footPhone").textContent = "+" + C.whatsapp;
  document.getElementById("tillText").textContent = C.till;
  if (C.subtitle) document.getElementById("heroSub").textContent = C.subtitle;

  const why = document.getElementById("whyList");
  (C.features || []).forEach((f) => {
    const li = document.createElement("li");
    li.textContent = f;
    why.appendChild(li);
  });

  const digits = document.getElementById("tillDigits");
  C.till.split("").forEach((d) => {
    const span = document.createElement("span");
    span.className = "digit";
    span.textContent = d;
    digits.appendChild(span);
  });

  // Tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById("panel-" + tab.dataset.tab);
      if (panel) panel.classList.add("active");
    });
  });

  function makeOrderId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "GDS-";
    for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  function normalizePhone(raw) {
    let p = String(raw || "").replace(/\D/g, "");
    if (p.startsWith("254") && p.length === 12) p = "0" + p.slice(3);
    if (p.startsWith("2540") && p.length === 13) p = p.slice(3);
    return p;
  }

  function isValidKenyaPhone(p) {
    return /^0[17]\d{8}$/.test(p);
  }

  function shareDeal(item) {
    const text =
      `🔥 ${item.title} — Ksh ${item.price}` +
      (item.validity ? ` (${item.validity})` : "") +
      `\nGamer Digital Services\nTill ${C.till}\nWhatsApp: https://wa.me/${C.whatsapp}`;
    if (navigator.share) {
      navigator.share({ title: C.brand, text }).catch(() => copyShare(text));
    } else {
      copyShare(text);
    }
  }

  function copyShare(text) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
  }

  let currentDeal = null;
  let lastOrderId = null;
  const modal = document.getElementById("orderModal");
  const phoneInput = document.getElementById("phoneInput");
  const nameInput = document.getElementById("nameInput");
  const phoneError = document.getElementById("phoneError");
  const orderPreview = document.getElementById("orderPreview");
  const modalTitle = document.getElementById("modalTitle");
  const modalSub = document.getElementById("modalSub");
  const stkStatus = document.getElementById("stkStatus");
  const btnStk = document.getElementById("modalStk");
  const btnWa = document.getElementById("modalConfirm");

  function openModal(item) {
    currentDeal = item;
    lastOrderId = null;
    modalTitle.textContent = item.title;
    modalSub.textContent = `Ksh ${item.price}` + (item.validity ? ` · ${item.validity}` : "") + " · Who receives it?";
    phoneInput.value = "";
    nameInput.value = "";
    phoneError.style.display = "none";
    orderPreview.style.display = "none";
    if (stkStatus) {
      stkStatus.style.display = "none";
      stkStatus.textContent = "";
    }
    if (btnStk) btnStk.disabled = false;
    if (btnWa) btnWa.disabled = false;
    modal.classList.add("open");
    setTimeout(() => phoneInput.focus(), 40);
  }

  function closeModal() {
    modal.classList.remove("open");
    currentDeal = null;
  }

  document.getElementById("modalCancel").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  function validate() {
    if (!currentDeal) return null;
    const phone = normalizePhone(phoneInput.value);
    if (!isValidKenyaPhone(phone)) {
      phoneError.style.display = "block";
      phoneInput.focus();
      return null;
    }
    phoneError.style.display = "none";
    return {
      phone,
      name: (nameInput.value || "").trim(),
      orderId: lastOrderId || makeOrderId(),
    };
  }

  function showPreview(orderId, phone, amount) {
    lastOrderId = orderId;
    orderPreview.innerHTML = `<strong>Order ID: ${orderId}</strong><br>Delivery to: ${phone}<br>Amount: Ksh ${amount}`;
    orderPreview.style.display = "block";
  }

  btnWa.addEventListener("click", () => {
    const v = validate();
    if (!v) return;
    showPreview(v.orderId, v.phone, currentDeal.price);
    const lines = [
      `Habari, nataka order ${v.orderId}`,
      `Deal: ${currentDeal.title}`,
      `Bei: Ksh ${currentDeal.price}`,
      `Nambari ya kupokea (gift): ${v.phone}`,
    ];
    if (v.name) lines.push(`Jina: ${v.name}`);
    lines.push(`Nitalipa till ${C.till} kisha nitapeleka M-Pesa SMS.`);
    lines.push(`Deliver kwa ${v.phone} baada ya confirmation.`);
    const url = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
    setTimeout(() => {
      window.open(url, "_blank", "noopener");
      closeModal();
      showToast("Order " + v.orderId + " — pay till, then send SMS");
    }, 350);
  });

  if (btnStk) {
    btnStk.addEventListener("click", async () => {
      const v = validate();
      if (!v) return;
      showPreview(v.orderId, v.phone, currentDeal.price);
      btnStk.disabled = true;
      btnWa.disabled = true;
      if (stkStatus) {
        stkStatus.style.display = "block";
        stkStatus.textContent = "Sending M-Pesa prompt…";
        stkStatus.className = "stk-status";
      }
      try {
        const res = await fetch("/api/mpesa/stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: v.phone,
            amount: currentDeal.price,
            orderId: v.orderId,
            dealTitle: currentDeal.title,
            deliveryPhone: v.phone,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          if (stkStatus) {
            stkStatus.textContent =
              "Prompt sent! Enter PIN on phone. Order: " + v.orderId;
            stkStatus.className = "stk-status ok";
          }
          showToast("Check phone — enter M-Pesa PIN");
          setTimeout(closeModal, 3200);
        } else {
          if (stkStatus) {
            stkStatus.textContent =
              (data.error || "STK unavailable") + " — use Till + WhatsApp";
            stkStatus.className = "stk-status err";
          }
          btnStk.disabled = false;
          btnWa.disabled = false;
        }
      } catch (e) {
        if (stkStatus) {
          stkStatus.textContent = "API offline — use Till + WhatsApp";
          stkStatus.className = "stk-status err";
        }
        btnStk.disabled = false;
        btnWa.disabled = false;
      }
    });
  }

  function render(list, mountId) {
    const root = document.getElementById(mountId);
    if (!root) return;
    root.innerHTML = "";
    (list || []).forEach((item) => {
      const chips = [];
      if (item.badge) chips.push(`<span class="chip badge-${item.badge}">${item.badge}</span>`);
      if (item.validity) chips.push(`<span class="chip">${item.validity}</span>`);
      if (item.okOa) chips.push(`<span class="chip">Okoa OK</span>`);
      if (item.note && /once|unavailable/i.test(item.note))
        chips.push(`<span class="chip warn">${item.note}</span>`);

      const row = document.createElement("div");
      row.className = "deal";
      row.innerHTML = `
        <div>
          <b>${item.title}</b>
          <div class="meta">${chips.join("")}</div>
          ${item.note && !/once|unavailable/i.test(item.note) ? `<small>${item.note}</small>` : ""}
        </div>
        <div class="deal-actions">
          <div class="price">Ksh ${item.price}</div>
          <button type="button" class="btn-ghost share-btn" title="Share">Share</button>
          <button type="button" class="btn btn-green btn-sm buy-btn">Buy</button>
        </div>
      `;
      row.querySelector(".buy-btn").addEventListener("click", () => openModal(item));
      row.querySelector(".share-btn").addEventListener("click", () => shareDeal(item));
      root.appendChild(row);
    });
  }

  render(C.dataDeals, "dataDeals");
  render(C.minuteDeals, "minuteDeals");
  render(C.smsDeals, "smsDeals");
  render(C.tunuDeals, "tunuDeals");

  const faqRoot = document.getElementById("faqList");
  (C.faq || []).forEach((item) => {
    const d = document.createElement("details");
    d.innerHTML = `<summary>${item.q}</summary><p>${item.a}</p>`;
    faqRoot.appendChild(d);
  });

  document.getElementById("copyTill").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(C.till);
      showToast("Till " + C.till + " copied");
    } catch (e) {
      alert("Till: " + C.till);
    }
  });

  function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => (t.style.display = "none"), 3000);
  }

  fetch("/api/mpesa/status")
    .then((r) => r.json())
    .then((d) => {
      if (d && d.mpesaConfigured && btnStk) btnStk.style.display = "inline-flex";
    })
    .catch(() => {});
})();
