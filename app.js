(function () {
  const C = window.BINGWA;
  const waLink = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent("Habari, nataka bundle. Nimetuma M-Pesa kwa till " + C.till)}`;

  ["waTop", "waSide", "waFloat"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = waLink;
  });

  document.getElementById("footPhone").textContent = "+" + C.whatsapp;
  document.getElementById("tillText").textContent = C.till;

  const digits = document.getElementById("tillDigits");
  C.till.split("").forEach((d) => {
    const span = document.createElement("span");
    span.className = "digit";
    span.textContent = d;
    digits.appendChild(span);
  });

  function dealWa(item) {
    const text = `Habari, nataka ${item.title} — Ksh ${item.price}. Nitalipa till ${C.till} kisha nitapeleka M-Pesa SMS.`;
    return `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  function render(list, mountId) {
    const root = document.getElementById(mountId);
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
          <a class="btn btn-green btn-sm" target="_blank" rel="noopener" href="${dealWa(item)}">Buy</a>
        </div>
      `;
      root.appendChild(row);
    });
  }

  render(C.dataDeals, "dataDeals");
  render(C.minuteDeals, "minuteDeals");
  render(C.smsDeals, "smsDeals");
  render(C.tunuDeals, "tunuDeals");

  document.getElementById("copyTill").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(C.till);
      const t = document.getElementById("toast");
      t.textContent = "Till " + C.till + " copied";
      t.style.display = "block";
      setTimeout(() => (t.style.display = "none"), 1800);
    } catch (e) {
      alert("Till: " + C.till);
    }
  });
})();
