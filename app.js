(function () {
  const C = window.BINGWA;
  if (!C) return;

  // —— Referral state ——
  const params = new URLSearchParams(location.search);
  let refCode = (params.get("ref") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  if (refCode) {
    try { localStorage.setItem("gds_ref", refCode); } catch (e) {}
  } else {
    try { refCode = (localStorage.getItem("gds_ref") || "").toUpperCase(); } catch (e) {}
  }

  function setRef(code) {
    refCode = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
    try {
      if (refCode) localStorage.setItem("gds_ref", refCode);
      else localStorage.removeItem("gds_ref");
    } catch (e) {}
    updateRefUI();
  }

  function updateRefUI() {
    const banner = document.getElementById("refBanner");
    const status = document.getElementById("refStatus");
    const input = document.getElementById("refInput");
    const refNote = document.getElementById("refNote");
    const pill = document.getElementById("pillRef");

    if (refCode) {
      if (banner) {
        banner.textContent = "✓ Referral active: " + refCode + " — this code is attached to your orders";
        banner.classList.add("show");
      }
      if (status) status.textContent = "Active code: " + refCode;
      if (input) input.value = refCode;
      if (refNote) {
        refNote.style.display = "block";
        refNote.textContent = "Referral: " + refCode;
      }
      if (pill) pill.classList.add("on");
    } else {
      if (banner) {
        banner.textContent = "";
        banner.classList.remove("show");
      }
      if (status) status.textContent = "No code applied yet";
      if (input && document.activeElement !== input) input.value = "";
      if (refNote) refNote.style.display = "none";
      if (pill) pill.classList.remove("on");
    }
  }
  updateRefUI();

  document.getElementById("applyRef").addEventListener("click", () => {
    const v = document.getElementById("refInput").value;
    if (!v.trim()) {
      showToast("Enter a referral code");
      return;
    }
    setRef(v);
    showToast("Referral " + refCode + " applied");
  });
  document.getElementById("clearRef").addEventListener("click", () => {
    setRef("");
    document.getElementById("refInput").value = "";
    showToast("Referral cleared");
  });
  document.getElementById("pillRef").addEventListener("click", () => {
    document.getElementById("refTool").scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("refInput").focus();
  });

  // —— Okoa filter ——
  let okoaOnly = false;
  function setOkoaFilter(on) {
    okoaOnly = !!on;
    document.querySelectorAll("[data-filter]").forEach((el) => {
      el.classList.toggle("on", el.dataset.filter === (okoaOnly ? "okoa" : "all"));
    });
    document.getElementById("pillOkoa").classList.toggle("on", okoaOnly);
    const note = document.getElementById("dataNote");
    if (note) {
      note.textContent = okoaOnly
        ? "Showing Okoa-friendly deals only"
        : "Some deals once per day · Okoa marked clearly";
    }
    renderData();
    switchTab("data");
  }
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => setOkoaFilter(btn.dataset.filter === "okoa"));
  });
  document.getElementById("pillOkoa").addEventListener("click", () => setOkoaFilter(!okoaOnly));

  // —— Tabs ——
  function switchTab(name) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + name));
    const bar = document.getElementById("dataFilters");
    if (bar) bar.style.display = name === "data" ? "flex" : "none";
  }
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
  document.getElementById("pillAirtel").addEventListener("click", () => {
    switchTab("airtel");
    document.getElementById("panel-airtel").scrollIntoView({ behavior: "smooth" });
  });

  // —— Base UI ——
  const generalWa = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(
    "Habari, niko na swali kuhusu Gamer Digital Services."
  )}`;
  ["waTop", "waSide", "waFloat"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = generalWa;
  });
  document.getElementById("footPhone").textContent = "+" + C.whatsapp;
  document.getElementById("tillText").textContent = C.till;
  if (C.subtitle) {
    const hs = document.getElementById("heroSub");
    if (hs) hs.textContent = C.subtitle;
  }
  const why = document.getElementById("whyList");
  (C.features || []).forEach((f) => {
    const li = document.createElement("li");
    li.textContent = f;
    why.appendChild(li);
  });
  C.till.split("").forEach((d) => {
    const span = document.createElement("span");
    span.className = "digit";
    span.textContent = d;
    document.getElementById("tillDigits").appendChild(span);
  });

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
      (item.okOa ? " · Okoa OK" : "") +
      `\nGamer Digital Services\nTill ${C.till}\n` +
      (C.siteUrl || location.origin) +
      (refCode ? "/?ref=" + refCode : "");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  async function createServerOrder(deal, phone, name, payMethod, isGift) {
    const res = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        amount: deal.price,
        title: deal.title,
        name,
        ref: refCode || "",
        network: deal.network || "Safaricom",
        payMethod,
        gift: !!isGift,
        okoa: !!deal.okOa,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Could not create order");
    return data;
  }

  // —— Gift / order modal ——
  let currentDeal = null;
  let giftMode = false;
  const modal = document.getElementById("orderModal");
  const phoneInput = document.getElementById("phoneInput");
  const nameInput = document.getElementById("nameInput");
  const phoneError = document.getElementById("phoneError");
  const phoneLabel = document.getElementById("phoneLabel");
  const phoneHint = document.getElementById("phoneHint");
  const nameLabel = document.getElementById("nameLabel");
  const orderPreview = document.getElementById("orderPreview");
  const modalTitle = document.getElementById("modalTitle");
  const modalSub = document.getElementById("modalSub");
  const stkStatus = document.getElementById("stkStatus");
  const btnStk = document.getElementById("modalStk");
  const btnWa = document.getElementById("modalConfirm");
  const okoaNote = document.getElementById("okoaNote");

  function setGiftMode(on) {
    giftMode = !!on;
    document.getElementById("modeSelf").classList.toggle("on", !giftMode);
    document.getElementById("modeGift").classList.toggle("on", giftMode);
    document.getElementById("pillGift").classList.toggle("on", giftMode);
    if (giftMode) {
      phoneLabel.textContent = "Friend's phone (receives deal) *";
      phoneHint.textContent = "You pay · they receive the bundle on this number.";
      nameLabel.textContent = "Friend's name (optional)";
      nameInput.placeholder = "e.g. friend's name";
    } else {
      phoneLabel.textContent = "Your phone (receives deal) *";
      phoneHint.textContent = "Bundle is loaded on this number.";
      nameLabel.textContent = "Your name (optional)";
      nameInput.placeholder = "e.g. Jane";
    }
  }
  document.getElementById("modeSelf").addEventListener("click", () => setGiftMode(false));
  document.getElementById("modeGift").addEventListener("click", () => setGiftMode(true));

  function openModal(item, forceGift) {
    currentDeal = item;
    setGiftMode(!!forceGift);
    modalTitle.textContent = item.title;
    modalSub.textContent =
      `Ksh ${item.price}` +
      (item.validity ? ` · ${item.validity}` : "") +
      (item.network ? ` · ${item.network}` : "");
    phoneInput.value = "";
    nameInput.value = "";
    phoneError.style.display = "none";
    orderPreview.style.display = "none";
    if (stkStatus) {
      stkStatus.style.display = "none";
      stkStatus.textContent = "";
    }
    if (okoaNote) okoaNote.style.display = item.okOa ? "block" : "none";
    updateRefUI();
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

  // Gift shortcuts: open first data deal in gift mode, or just set gift for next buy
  document.getElementById("startGift").addEventListener("click", () => {
    const list = (C.dataDeals || []).filter((d) => !okoaOnly || d.okOa);
    const deal = list[0] || (C.dataDeals || [])[0];
    if (deal) openModal(deal, true);
    else showToast("No deals available");
  });
  document.getElementById("pillGift").addEventListener("click", () => {
    setGiftMode(true);
    document.getElementById("startGift").scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Gift mode ready — pick a deal and tap Buy");
  });

  function validatePhone() {
    if (!currentDeal) return null;
    const phone = normalizePhone(phoneInput.value);
    if (!isValidKenyaPhone(phone)) {
      phoneError.style.display = "block";
      phoneInput.focus();
      return null;
    }
    phoneError.style.display = "none";
    return { phone, name: (nameInput.value || "").trim() };
  }

  function showPreview(orderId, phone, amount) {
    orderPreview.innerHTML =
      `<strong>Order ID: ${orderId}</strong><br>` +
      (giftMode ? "Gift to: " : "Delivery: ") +
      phone +
      `<br>Amount: Ksh ${amount}` +
      (refCode ? `<br>Ref: ${refCode}` : "") +
      (currentDeal && currentDeal.okOa ? "<br>Okoa-friendly" : "");
    orderPreview.style.display = "block";
  }

  btnWa.addEventListener("click", async () => {
    const v = validatePhone();
    if (!v) return;
    btnWa.disabled = true;
    if (btnStk) btnStk.disabled = true;
    if (stkStatus) {
      stkStatus.style.display = "block";
      stkStatus.textContent = "Creating order…";
      stkStatus.className = "stk-status";
    }
    try {
      const data = await createServerOrder(
        currentDeal,
        v.phone,
        v.name,
        "till_whatsapp",
        giftMode
      );
      const orderId = data.orderId;
      showPreview(orderId, v.phone, currentDeal.price);
      if (stkStatus) {
        stkStatus.textContent = "Order saved · opening WhatsApp…";
        stkStatus.className = "stk-status ok";
      }

      const lines = [
        `Habari, nataka order ${orderId}`,
        giftMode ? `GIFT to: ${v.phone}` : `Nambari ya kupokea: ${v.phone}`,
        `Deal: ${currentDeal.title}`,
        `Bei: Ksh ${currentDeal.price}`,
      ];
      if (currentDeal.okOa) lines.push(`Okoa-friendly: yes`);
      if (v.name) lines.push(giftMode ? `Friend: ${v.name}` : `Jina: ${v.name}`);
      if (refCode) lines.push(`Ref: ${refCode}`);
      lines.push(`Nitalipa till ${C.till} kisha nitapeleka M-Pesa SMS.`);
      lines.push(`Deliver kwa ${v.phone} baada ya confirmation.`);

      const url = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
      setTimeout(() => {
        window.open(url, "_blank", "noopener");
        closeModal();
        showToast("Order " + orderId + " created");
      }, 400);
    } catch (e) {
      if (stkStatus) {
        stkStatus.textContent = e.message || "Server error";
        stkStatus.className = "stk-status err";
      }
      btnWa.disabled = false;
      if (btnStk) btnStk.disabled = false;
    }
  });

  if (btnStk) {
    btnStk.addEventListener("click", async () => {
      const v = validatePhone();
      if (!v) return;
      btnStk.disabled = true;
      btnWa.disabled = true;
      if (stkStatus) {
        stkStatus.style.display = "block";
        stkStatus.textContent = "Creating order + STK…";
        stkStatus.className = "stk-status";
      }
      try {
        const data = await createServerOrder(currentDeal, v.phone, v.name, "stk", giftMode);
        const orderId = data.orderId;
        showPreview(orderId, v.phone, currentDeal.price);
        const res = await fetch("/api/mpesa/stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: v.phone,
            amount: currentDeal.price,
            orderId,
            dealTitle: currentDeal.title,
            deliveryPhone: v.phone,
          }),
        });
        const stk = await res.json();
        if (stk.ok) {
          if (stkStatus) {
            stkStatus.textContent = "Prompt sent! Enter PIN. Order: " + orderId;
            stkStatus.className = "stk-status ok";
          }
          showToast("Check phone for M-Pesa PIN");
          setTimeout(closeModal, 3200);
        } else {
          if (stkStatus) {
            stkStatus.textContent =
              (stk.error || "STK failed") + " — order " + orderId + " saved, use Till + WhatsApp";
            stkStatus.className = "stk-status err";
          }
          btnStk.disabled = false;
          btnWa.disabled = false;
        }
      } catch (e) {
        if (stkStatus) {
          stkStatus.textContent = e.message || "Error";
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
    if (!list || !list.length) {
      root.innerHTML = '<div class="empty">No deals in this filter</div>';
      return;
    }
    list.forEach((item) => {
      const chips = [];
      if (item.network) chips.push(`<span class="chip airtel">${item.network}</span>`);
      if (item.okOa) chips.push(`<span class="chip okoa">Okoa OK</span>`);
      if (item.badge) chips.push(`<span class="chip badge-${item.badge}">${item.badge}</span>`);
      if (item.validity) chips.push(`<span class="chip">${item.validity}</span>`);
      if (item.note && /once|unavailable/i.test(item.note))
        chips.push(`<span class="chip warn">${item.note}</span>`);

      const row = document.createElement("div");
      row.className = "deal";
      row.innerHTML = `
        <div>
          <b>${item.title}</b>
          <div class="meta">${chips.join("")}</div>
        </div>
        <div class="deal-actions">
          <div class="price">Ksh ${item.price}</div>
          <button type="button" class="btn-ghost share-btn">Share</button>
          <button type="button" class="btn btn-outline btn-sm gift-btn">Gift</button>
          <button type="button" class="btn btn-green btn-sm buy-btn">Buy</button>
        </div>`;
      row.querySelector(".buy-btn").addEventListener("click", () => openModal(item, false));
      row.querySelector(".gift-btn").addEventListener("click", () => openModal(item, true));
      row.querySelector(".share-btn").addEventListener("click", () => shareDeal(item));
      root.appendChild(row);
    });
  }

  function renderData() {
    let list = C.dataDeals || [];
    if (okoaOnly) list = list.filter((d) => d.okOa);
    render(list, "dataDeals");
  }

  renderData();
  render(C.minuteDeals, "minuteDeals");
  render(C.smsDeals, "smsDeals");
  render(C.tunuDeals, "tunuDeals");
  render(C.airtelDeals, "airtelDeals");

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
    setTimeout(() => (t.style.display = "none"), 2800);
  }

  fetch("/api/health")
    .then((r) => r.json())
    .then((d) => {
      if (d && d.mpesa && btnStk) btnStk.style.display = "inline-flex";
    })
    .catch(() => {});
})();
