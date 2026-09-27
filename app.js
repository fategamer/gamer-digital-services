(function () {
  const C = window.BINGWA;
  if (!C) {
    console.error("config.js missing or BINGWA not defined");
    return;
  }

  const generalWa = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(
    "Habari, niko na swali kuhusu Gamer Digital Services."
  )}`;

  ["waTop", "waSide", "waFloat"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = generalWa;
  });

  document.getElementById("footPhone").textContent = "+" + C.whatsapp;
  document.getElementById("tillText").textContent = C.till;
  const howTill = document.getElementById("howTill");
  if (howTill) howTill.textContent = C.till;

  const digits = document.getElementById("tillDigits");
  C.till.split("").forEach((d) => {
    const span = document.createElement("span");
    span.className = "digit";
    span.textContent = d;
    digits.appendChild(span);
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

  // Modal state
  let currentDeal = null;
  const modal = document.getElementById("orderModal");
  const phoneInput = document.getElementById("phoneInput");
  const nameInput = document.getElementById("nameInput");
  const phoneError = document.getElementById("phoneError");
  const orderPreview = document.getElementById("orderPreview");
  const modalTitle = document.getElementById("modalTitle");
  const modalSub = document.getElementById("modalSub");

  function openModal(item) {
    currentDeal = item;
    modalTitle.textContent = item.title;
    modalSub.textContent = `Ksh ${item.price} · Enter the phone that will receive this deal.`;
    phoneInput.value = "";
    nameInput.value = "";
    phoneError.style.display = "none";
    orderPreview.style.display = "none";
    modal.classList.add("open");
    setTimeout(() => phoneInput.focus(), 50);
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

  document.getElementById("modalConfirm").addEventListener("click", () => {
    if (!currentDeal) return;
    const phone = normalizePhone(phoneInput.value);
    if (!isValidKenyaPhone(phone)) {
      phoneError.style.display = "block";
      phoneInput.focus();
      return;
    }
    phoneError.style.display = "none";

    const orderId = makeOrderId();
    const name = (nameInput.value || "").trim();

    const lines = [
      `Habari, nataka order ${orderId}`,
      `Deal: ${currentDeal.title}`,
      `Bei: Ksh ${currentDeal.price}`,
      `Nambari ya kupokea: ${phone}`,
    ];
    if (name) lines.push(`Jina: ${name}`);
    lines.push(`Nitalipa till ${C.till} kisha nitapeleka M-Pesa SMS.`);
    lines.push(`Tafadhali deliver kwa ${phone} baada ya confirmation.`);

    const text = lines.join("\n");
    const url = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;

    orderPreview.innerHTML = `<strong>Order ID: ${orderId}</strong><br>Delivery to: ${phone}<br>Amount: Ksh ${currentDeal.price}`;
    orderPreview.style.display = "block";

    // Small delay so user can see Order ID, then open WA
    setTimeout(() => {
      window.open(url, "_blank", "noopener");
      closeModal();
      showToast("Order " + orderId + " ready — send M-Pesa SMS after paying");
    }, 600);
  });

  function render(list, mountId) {
    const root = document.getElementById(mountId);
    if (!root) return;
    root.innerHTML = "";
    list.forEach((item) => {
      const row = document.createElement("div");
      row.className = "deal";
      row.innerHTML = `
        <div>
          <b>${item.title}</b>
          ${item.note ? `<small>${item.note}</small>` : ""}
        </div>
        <div class="deal-actions">
          <div class="price">Ksh ${item.price}</div>
          <button type="button" class="btn btn-green btn-sm buy-btn">Buy</button>
        </div>
      `;
      row.querySelector(".buy-btn").addEventListener("click", () => openModal(item));
      root.appendChild(row);
    });
  }

  render(C.dataDeals || [], "dataDeals");
  render(C.minuteDeals || [], "minuteDeals");
  render(C.smsDeals || [], "smsDeals");
  render(C.tunuDeals || [], "tunuDeals");

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
    setTimeout(() => (t.style.display = "none"), 2800);
  }
})();
