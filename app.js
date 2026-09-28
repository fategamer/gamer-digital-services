/* Gamer Digital Services — interactive shop v20260928b */
(function () {
  function showBoot(msg) {
    var el = document.getElementById("bootError");
    if (el) {
      el.style.display = "block";
      el.textContent = msg;
    }
    console.error(msg);
  }

  var C = window.BINGWA;
  if (!C) {
    showBoot("Config failed to load. Hard-refresh or open https://gamer-digital-services.vercel.app/?v=new");
    return;
  }

  function $(id) {
    return document.getElementById(id);
  }
  function on(el, ev, fn) {
    if (el) el.addEventListener(ev, fn);
  }
  function toast(msg) {
    var t = $("toast");
    if (!t) return alert(msg);
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(function () {
      t.style.display = "none";
    }, 2800);
  }

  // Referral
  var params = new URLSearchParams(location.search);
  var refCode = (params.get("ref") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  try {
    if (refCode) localStorage.setItem("gds_ref", refCode);
    else refCode = (localStorage.getItem("gds_ref") || "").toUpperCase();
  } catch (e) {}

  function setRef(code) {
    refCode = String(code || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 16);
    try {
      if (refCode) localStorage.setItem("gds_ref", refCode);
      else localStorage.removeItem("gds_ref");
    } catch (e) {}
    updateRefUI();
  }

  function updateRefUI() {
    var banner = $("refBanner");
    var status = $("refStatus");
    var input = $("refInput");
    var refNote = $("refNote");
    var pill = $("pillRef");
    if (refCode) {
      if (banner) {
        banner.textContent = "✓ Referral active: " + refCode;
        banner.classList.add("show");
      }
      if (status) status.textContent = "Active code: " + refCode;
      if (input && document.activeElement !== input) input.value = refCode;
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

  on($("applyRef"), "click", function () {
    var v = ($("refInput") && $("refInput").value) || "";
    if (!v.trim()) return toast("Enter a referral code");
    setRef(v);
    toast("Referral " + refCode + " applied");
  });
  on($("clearRef"), "click", function () {
    setRef("");
    if ($("refInput")) $("refInput").value = "";
    toast("Referral cleared");
  });
  on($("pillRef"), "click", function () {
    var tool = $("refTool");
    if (tool) tool.scrollIntoView({ behavior: "smooth", block: "center" });
    if ($("refInput")) $("refInput").focus();
  });

  // Okoa filter
  var okoaOnly = false;
  function setOkoaFilter(on) {
    okoaOnly = !!on;
    document.querySelectorAll("[data-filter]").forEach(function (el) {
      el.classList.toggle("on", el.dataset.filter === (okoaOnly ? "okoa" : "all"));
    });
    if ($("pillOkoa")) $("pillOkoa").classList.toggle("on", okoaOnly);
    if ($("dataNote"))
      $("dataNote").textContent = okoaOnly ? "Showing Okoa-friendly only" : "Tap Buy or Gift";
    renderData();
    switchTab("data");
    toast(okoaOnly ? "Okoa filter ON" : "Showing all data");
  }
  document.querySelectorAll("[data-filter]").forEach(function (btn) {
    on(btn, "click", function () {
      setOkoaFilter(btn.dataset.filter === "okoa");
    });
  });
  on($("pillOkoa"), "click", function () {
    setOkoaFilter(!okoaOnly);
  });

  // Tabs
  function switchTab(name) {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.tab === name);
    });
    document.querySelectorAll(".panel").forEach(function (p) {
      p.classList.toggle("active", p.id === "panel-" + name);
    });
    var bar = $("dataFilters");
    if (bar) bar.style.display = name === "data" ? "flex" : "none";
  }
  document.querySelectorAll(".tab").forEach(function (tab) {
    on(tab, "click", function () {
      switchTab(tab.dataset.tab);
    });
  });
  on($("pillAirtel"), "click", function () {
    switchTab("airtel");
    toast("Airtel deals");
  });

  // Base
  var wa =
    "https://wa.me/" +
    C.whatsapp +
    "?text=" +
    encodeURIComponent("Habari, niko na swali kuhusu Gamer Digital Services.");
  ["waTop", "waSide", "waFloat"].forEach(function (id) {
    if ($(id)) $(id).href = wa;
  });
  if ($("footPhone")) $("footPhone").textContent = "+" + C.whatsapp;
  if ($("tillText")) $("tillText").textContent = C.till;
  if (C.subtitle && $("heroSub")) $("heroSub").textContent = C.subtitle;
  var why = $("whyList");
  if (why) {
    (C.features || []).forEach(function (f) {
      var li = document.createElement("li");
      li.textContent = f;
      why.appendChild(li);
    });
  }
  var digits = $("tillDigits");
  if (digits) {
    String(C.till || "").split("").forEach(function (d) {
      var span = document.createElement("span");
      span.className = "digit";
      span.textContent = d;
      digits.appendChild(span);
    });
  }

  function normalizePhone(raw) {
    var p = String(raw || "").replace(/\D/g, "");
    if (p.indexOf("254") === 0 && p.length === 12) p = "0" + p.slice(3);
    return p;
  }
  function isValidKenyaPhone(p) {
    return /^0[17]\d{8}$/.test(p);
  }

  function shareDeal(item) {
    var text =
      "🔥 " +
      item.title +
      " — Ksh " +
      item.price +
      (item.okOa ? " · Okoa OK" : "") +
      "\nGamer Digital Services\nTill " +
      C.till +
      "\n" +
      (C.siteUrl || location.origin) +
      (refCode ? "/?ref=" + refCode : "");
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
  }

  function createServerOrder(deal, phone, name, payMethod, isGift) {
    return fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone,
        amount: deal.price,
        title: deal.title,
        name: name,
        ref: refCode || "",
        network: deal.network || "Safaricom",
        payMethod: payMethod,
        gift: !!isGift,
        okoa: !!deal.okOa,
      }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!data.ok) throw new Error(data.error || "Could not create order");
        return data;
      });
    });
  }

  var currentDeal = null;
  var giftMode = false;
  var modal = $("orderModal");
  var phoneInput = $("phoneInput");
  var nameInput = $("nameInput");
  var phoneError = $("phoneError");
  var orderPreview = $("orderPreview");
  var stkStatus = $("stkStatus");
  var btnStk = $("modalStk");
  var btnWa = $("modalConfirm");

  function setGiftMode(on) {
    giftMode = !!on;
    if ($("modeSelf")) $("modeSelf").classList.toggle("on", !giftMode);
    if ($("modeGift")) $("modeGift").classList.toggle("on", giftMode);
    if ($("pillGift")) $("pillGift").classList.toggle("on", giftMode);
    if ($("phoneLabel"))
      $("phoneLabel").textContent = giftMode
        ? "Friend's phone (receives deal) *"
        : "Your phone (receives deal) *";
    if ($("phoneHint"))
      $("phoneHint").textContent = giftMode
        ? "You pay · they receive the bundle."
        : "Bundle loads on this number.";
  }
  on($("modeSelf"), "click", function () {
    setGiftMode(false);
  });
  on($("modeGift"), "click", function () {
    setGiftMode(true);
  });

  function openModal(item, forceGift) {
    currentDeal = item;
    setGiftMode(!!forceGift);
    if ($("modalTitle")) $("modalTitle").textContent = item.title;
    if ($("modalSub"))
      $("modalSub").textContent =
        "Ksh " + item.price + (item.validity ? " · " + item.validity : "");
    if (phoneInput) phoneInput.value = "";
    if (nameInput) nameInput.value = "";
    if (phoneError) phoneError.style.display = "none";
    if (orderPreview) orderPreview.style.display = "none";
    if (stkStatus) {
      stkStatus.style.display = "none";
      stkStatus.textContent = "";
    }
    if ($("okoaNote")) $("okoaNote").style.display = item.okOa ? "block" : "none";
    updateRefUI();
    if (btnStk) btnStk.disabled = false;
    if (btnWa) btnWa.disabled = false;
    if (modal) modal.classList.add("open");
    setTimeout(function () {
      if (phoneInput) phoneInput.focus();
    }, 50);
  }

  function closeModal() {
    if (modal) modal.classList.remove("open");
    currentDeal = null;
  }
  on($("modalCancel"), "click", closeModal);
  on(modal, "click", function (e) {
    if (e.target === modal) closeModal();
  });

  on($("startGift"), "click", function () {
    var list = (C.dataDeals || []).filter(function (d) {
      return !okoaOnly || d.okOa;
    });
    var deal = list[0] || (C.dataDeals || [])[0];
    if (deal) openModal(deal, true);
    else toast("No deals");
  });
  on($("pillGift"), "click", function () {
    setGiftMode(true);
    toast("Gift mode — tap Gift on any deal");
  });

  function validatePhone() {
    if (!currentDeal) return null;
    var phone = normalizePhone(phoneInput && phoneInput.value);
    if (!isValidKenyaPhone(phone)) {
      if (phoneError) phoneError.style.display = "block";
      if (phoneInput) phoneInput.focus();
      return null;
    }
    if (phoneError) phoneError.style.display = "none";
    return { phone: phone, name: ((nameInput && nameInput.value) || "").trim() };
  }

  function showPreview(orderId, phone, amount) {
    if (!orderPreview) return;
    orderPreview.innerHTML =
      "<strong>Order ID: " +
      orderId +
      "</strong><br>" +
      (giftMode ? "Gift to: " : "Delivery: ") +
      phone +
      "<br>Amount: Ksh " +
      amount +
      (refCode ? "<br>Ref: " + refCode : "");
    orderPreview.style.display = "block";
  }

  on(btnWa, "click", function () {
    var v = validatePhone();
    if (!v) return;
    if (btnWa) btnWa.disabled = true;
    if (btnStk) btnStk.disabled = true;
    if (stkStatus) {
      stkStatus.style.display = "block";
      stkStatus.textContent = "Creating order…";
      stkStatus.className = "stk-status";
    }
    createServerOrder(currentDeal, v.phone, v.name, "till_whatsapp", giftMode)
      .then(function (data) {
        var orderId = data.orderId;
        showPreview(orderId, v.phone, currentDeal.price);
        if (stkStatus) {
          stkStatus.textContent = "Order saved · opening WhatsApp…";
          stkStatus.className = "stk-status ok";
        }
        var lines = [
          "Habari, nataka order " + orderId,
          giftMode ? "GIFT to: " + v.phone : "Nambari ya kupokea: " + v.phone,
          "Deal: " + currentDeal.title,
          "Bei: Ksh " + currentDeal.price,
        ];
        if (currentDeal.okOa) lines.push("Okoa-friendly: yes");
        if (v.name) lines.push(giftMode ? "Friend: " + v.name : "Jina: " + v.name);
        if (refCode) lines.push("Ref: " + refCode);
        lines.push("Nitalipa till " + C.till + " kisha nitapeleka M-Pesa SMS.");
        lines.push("Deliver kwa " + v.phone + " baada ya confirmation.");
        var url =
          "https://wa.me/" +
          C.whatsapp +
          "?text=" +
          encodeURIComponent(lines.join("\n"));
        setTimeout(function () {
          window.open(url, "_blank", "noopener");
          closeModal();
          toast("Order " + orderId + " created");
        }, 300);
      })
      .catch(function (e) {
        if (stkStatus) {
          stkStatus.textContent = e.message || "Server error";
          stkStatus.className = "stk-status err";
        }
        if (btnWa) btnWa.disabled = false;
        if (btnStk) btnStk.disabled = false;
        toast(e.message || "Order failed");
      });
  });

  on(btnStk, "click", function () {
    var v = validatePhone();
    if (!v) return;
    if (btnStk) btnStk.disabled = true;
    if (btnWa) btnWa.disabled = true;
    if (stkStatus) {
      stkStatus.style.display = "block";
      stkStatus.textContent = "Creating order + STK…";
      stkStatus.className = "stk-status";
    }
    createServerOrder(currentDeal, v.phone, v.name, "stk", giftMode)
      .then(function (data) {
        var orderId = data.orderId;
        showPreview(orderId, v.phone, currentDeal.price);
        return fetch("/api/mpesa/stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: v.phone,
            amount: currentDeal.price,
            orderId: orderId,
            dealTitle: currentDeal.title,
          }),
        }).then(function (res) {
          return res.json().then(function (stk) {
            return { orderId: orderId, stk: stk };
          });
        });
      })
      .then(function (r) {
        if (r.stk && r.stk.ok) {
          if (stkStatus) {
            stkStatus.textContent = "Prompt sent! PIN on phone. Order: " + r.orderId;
            stkStatus.className = "stk-status ok";
          }
          toast("Enter M-Pesa PIN on phone");
          setTimeout(closeModal, 3000);
        } else {
          if (stkStatus) {
            stkStatus.textContent =
              ((r.stk && r.stk.error) || "STK unavailable") +
              " — order " +
              r.orderId +
              " saved, use Till + WhatsApp";
            stkStatus.className = "stk-status err";
          }
          if (btnStk) btnStk.disabled = false;
          if (btnWa) btnWa.disabled = false;
        }
      })
      .catch(function (e) {
        if (stkStatus) {
          stkStatus.textContent = e.message || "Error";
          stkStatus.className = "stk-status err";
        }
        if (btnStk) btnStk.disabled = false;
        if (btnWa) btnWa.disabled = false;
      });
  });

  // Deal index for event delegation
  var dealIndex = {};

  function render(list, mountId) {
    var root = $(mountId);
    if (!root) return;
    root.innerHTML = "";
    if (!list || !list.length) {
      root.innerHTML = '<div class="empty">No deals here</div>';
      return;
    }
    list.forEach(function (item) {
      dealIndex[item.id] = item;
      var chips = [];
      if (item.network) chips.push('<span class="chip airtel">' + item.network + "</span>");
      if (item.okOa) chips.push('<span class="chip okoa">Okoa OK</span>');
      if (item.badge)
        chips.push('<span class="chip badge-' + item.badge + '">' + item.badge + "</span>");
      if (item.validity) chips.push('<span class="chip">' + item.validity + "</span>");

      var row = document.createElement("div");
      row.className = "deal";
      row.innerHTML =
        "<div><b>" +
        item.title +
        '</b><div class="meta">' +
        chips.join("") +
        '</div></div><div class="deal-actions">' +
        '<div class="price">Ksh ' +
        item.price +
        "</div>" +
        '<button type="button" class="btn-ghost" data-act="share" data-id="' +
        item.id +
        '">Share</button>' +
        '<button type="button" class="btn btn-outline btn-sm" data-act="gift" data-id="' +
        item.id +
        '">Gift</button>' +
        '<button type="button" class="btn btn-green btn-sm" data-act="buy" data-id="' +
        item.id +
        '">Buy</button></div>';
      root.appendChild(row);
    });
  }

  // One listener for all deal buttons (works even after re-render)
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    var id = btn.getAttribute("data-id");
    var item = dealIndex[id];
    if (!item) return;
    e.preventDefault();
    if (act === "buy") openModal(item, false);
    else if (act === "gift") openModal(item, true);
    else if (act === "share") shareDeal(item);
  });

  function renderData() {
    var list = C.dataDeals || [];
    if (okoaOnly)
      list = list.filter(function (d) {
        return d.okOa;
      });
    render(list, "dataDeals");
  }

  renderData();
  render(C.minuteDeals, "minuteDeals");
  render(C.smsDeals, "smsDeals");
  render(C.tunuDeals, "tunuDeals");
  render(C.airtelDeals, "airtelDeals");

  var faqRoot = $("faqList");
  if (faqRoot) {
    (C.faq || []).forEach(function (item) {
      var d = document.createElement("details");
      d.innerHTML = "<summary>" + item.q + "</summary><p>" + item.a + "</p>";
      faqRoot.appendChild(d);
    });
  }

  on($("copyTill"), "click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(C.till).then(
        function () {
          toast("Till " + C.till + " copied");
        },
        function () {
          toast("Till: " + C.till);
        }
      );
    } else toast("Till: " + C.till);
  });

  fetch("/api/health")
    .then(function (r) {
      return r.json();
    })
    .then(function (d) {
      if (d && d.mpesa && btnStk) btnStk.style.display = "inline-flex";
    })
    .catch(function () {});

  toast("Shop ready — tap Buy or Gift");
})();
