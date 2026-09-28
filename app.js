/* Gamer Digital Services — gift prompt goes TO friend */
(function () {
  function showBoot(msg) {
    var el = document.getElementById("bootError");
    if (el) {
      el.style.display = "block";
      el.textContent = msg;
    }
  }

  var C = window.BINGWA;
  if (!C) {
    showBoot("Config failed. Open https://gamer-digital-services.vercel.app/?v=gift1");
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
    }, 3000);
  }

  function normalizePhone(raw) {
    var p = String(raw || "").replace(/\D/g, "");
    if (p.indexOf("254") === 0 && p.length === 12) p = "0" + p.slice(3);
    return p;
  }
  function isValidKenyaPhone(p) {
    return /^0[17]\d{8}$/.test(p);
  }
  /** Open WhatsApp chat WITH that person (not the shop) */
  function openWhatsAppTo(phone07, text) {
    var p = normalizePhone(phone07);
    if (!isValidKenyaPhone(p)) {
      toast("Enter a valid friend number 07…");
      return false;
    }
    var intl = "254" + p.slice(1);
    var url = "https://wa.me/" + intl + "?text=" + encodeURIComponent(text);
    window.open(url, "_blank", "noopener");
    return true;
  }
  function openWhatsAppShop(text) {
    var url =
      "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(text);
    window.open(url, "_blank", "noopener");
  }

  /** Text the FRIEND sees on their WhatsApp */
  function giftMessageForFriend(opts) {
    var from = (opts.yourName || "").trim();
    var lines = ["Habari 👋", ""];
    if (from) {
      lines.push("*" + from + "* amekutumia gift ya data 🎁");
    } else {
      lines.push("Umetumiwa gift ya data 🎁");
    }
    lines.push("kupitia *Gamer Digital Services*.");
    lines.push("");
    if (opts.dealTitle) {
      lines.push("📦 *" + opts.dealTitle + "*");
      if (opts.price) lines.push("💰 Ksh " + opts.price);
      lines.push("");
    }
    if (opts.orderId) {
      lines.push("🧾 Order: " + opts.orderId);
      lines.push("");
    }
    if (opts.note) {
      lines.push("💬 " + opts.note);
      lines.push("");
    }
    lines.push("Bundle itawekwa kwenye nambari yako baada ya payment confirmation.");
    lines.push("");
    lines.push("Asante! 💚");
    return lines.join("\n");
  }

  function shopOrderText(opts) {
    var lines = [
      "*NEW ORDER* " + opts.orderId,
      "────────────",
      opts.gift ? "Type: GIFT (prompt friend)" : "Type: SELF",
      "Deliver to: " + opts.phone,
      "Deal: " + opts.title,
      "Amount: Ksh " + opts.price,
      "Till: " + C.till,
    ];
    if (opts.name) lines.push((opts.gift ? "From/Name: " : "Customer: ") + opts.name);
    if (opts.okoa) lines.push("Okoa: yes");
    if (opts.ref) lines.push("Ref: " + opts.ref);
    lines.push("────────────");
    lines.push("Nitalipa till " + C.till + " kisha nitatuma M-Pesa SMS.");
    lines.push("Deliver kwa " + opts.phone + " baada ya confirmation.");
    return lines.join("\n");
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
      if (status) status.textContent = "Active: " + refCode;
      if (input && document.activeElement !== input) input.value = refCode;
      if (refNote) {
        refNote.style.display = "block";
        refNote.textContent = "Referral: " + refCode;
      }
      if (pill) pill.classList.add("on");
    } else {
      if (banner) {
        banner.classList.remove("show");
        banner.textContent = "";
      }
      if (status) status.textContent = "No code yet";
      if (input && document.activeElement !== input) input.value = "";
      if (refNote) refNote.style.display = "none";
      if (pill) pill.classList.remove("on");
    }
  }
  updateRefUI();

  on($("applyRef"), "click", function () {
    var v = ($("refInput") && $("refInput").value) || "";
    if (!v.trim()) return toast("Enter referral code");
    setRef(v);
    toast("Referral " + refCode + " applied");
  });
  on($("clearRef"), "click", function () {
    setRef("");
    if ($("refInput")) $("refInput").value = "";
  });
  on($("pillRef"), "click", function () {
    if ($("refTool")) $("refTool").scrollIntoView({ behavior: "smooth" });
  });
  on($("pillPrompt"), "click", function () {
    if ($("promptCard")) $("promptCard").scrollIntoView({ behavior: "smooth" });
    if ($("promptPhone")) $("promptPhone").focus();
  });

  var okoaOnly = false;
  function setOkoaFilter(on) {
    okoaOnly = !!on;
    document.querySelectorAll("[data-filter]").forEach(function (el) {
      el.classList.toggle("on", el.dataset.filter === (okoaOnly ? "okoa" : "all"));
    });
    if ($("pillOkoa")) $("pillOkoa").classList.toggle("on", okoaOnly);
    renderData();
    switchTab("data");
  }
  document.querySelectorAll("[data-filter]").forEach(function (btn) {
    on(btn, "click", function () {
      setOkoaFilter(btn.dataset.filter === "okoa");
    });
  });
  on($("pillOkoa"), "click", function () {
    setOkoaFilter(!okoaOnly);
  });

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
  });

  var waShop =
    "https://wa.me/" +
    C.whatsapp +
    "?text=" +
    encodeURIComponent("Habari, niko na swali kuhusu Gamer Digital Services.");
  ["waTop", "waSide", "waFloat"].forEach(function (id) {
    if ($(id)) $(id).href = waShop;
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

  var allDeals = []
    .concat(C.dataDeals || [])
    .concat(C.minuteDeals || [])
    .concat(C.smsDeals || [])
    .concat(C.tunuDeals || [])
    .concat(C.airtelDeals || []);
  var dealIndex = {};
  allDeals.forEach(function (d) {
    dealIndex[d.id] = d;
  });

  var promptDealSel = $("promptDeal");
  if (promptDealSel) {
    allDeals.forEach(function (d) {
      var opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.title + " — Ksh " + d.price;
      promptDealSel.appendChild(opt);
    });
  }

  function currentFriendGiftText() {
    var dealId = promptDealSel && promptDealSel.value;
    var deal = dealId ? dealIndex[dealId] : null;
    return giftMessageForFriend({
      yourName: ($("promptName") && $("promptName").value) || "",
      dealTitle: deal ? deal.title : "",
      price: deal ? deal.price : "",
      note: ($("promptNote") && $("promptNote").value) || "",
    });
  }

  function refreshPromptPreview() {
    var box = $("promptPreview");
    if (!box) return;
    box.textContent = currentFriendGiftText();
    box.classList.add("show");
  }
  ["promptPhone", "promptName", "promptNote"].forEach(function (id) {
    on($(id), "input", refreshPromptPreview);
  });
  on(promptDealSel, "change", refreshPromptPreview);

  /** MAIN: send gift prompt text TO the friend */
  on($("btnPromptFriend"), "click", function () {
    var phone = normalizePhone($("promptPhone") && $("promptPhone").value);
    if (!isValidKenyaPhone(phone)) {
      toast("Andika nambari ya rafiki (07…)");
      if ($("promptPhone")) $("promptPhone").focus();
      return;
    }
    var text = currentFriendGiftText();
    refreshPromptPreview();
    var ok = openWhatsAppTo(phone, text);
    if (ok) toast("WhatsApp ya rafiki imefunguliwa — tuma message");
  });

  on($("btnOrderForFriend"), "click", function () {
    var phone = normalizePhone($("promptPhone") && $("promptPhone").value);
    if (!isValidKenyaPhone(phone)) {
      toast("Andika nambari ya rafiki kwanza");
      return;
    }
    var dealId = promptDealSel && promptDealSel.value;
    var deal = dealId ? dealIndex[dealId] : (C.dataDeals || [])[0];
    if (!deal) return toast("No deals");
    openModal(
      deal,
      true,
      phone,
      ($("promptName") && $("promptName").value) || ""
    );
  });

  function shareDeal(item) {
    var text =
      "🔥 " +
      item.title +
      " — Ksh " +
      item.price +
      "\nGamer Digital Services\nTill " +
      C.till +
      "\n" +
      (C.siteUrl || location.origin);
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
        if (!data.ok) throw new Error(data.error || "Order failed");
        return data;
      });
    });
  }

  var currentDeal = null;
  var giftMode = false;
  var lastGift = null;
  var modal = $("orderModal");
  var phoneInput = $("phoneInput");
  var nameInput = $("nameInput");
  var phoneError = $("phoneError");
  var orderPreview = $("orderPreview");
  var stkStatus = $("stkStatus");
  var btnStk = $("modalStk");
  var btnWa = $("modalConfirm");
  var btnNotify = $("modalNotifyFriend");

  function setGiftMode(on) {
    giftMode = !!on;
    if ($("modeSelf")) $("modeSelf").classList.toggle("on", !giftMode);
    if ($("modeGift")) $("modeGift").classList.toggle("on", giftMode);
    if ($("pillGift")) $("pillGift").classList.toggle("on", giftMode);
    if ($("phoneLabel"))
      $("phoneLabel").textContent = giftMode
        ? "Friend's phone (they receive + get WhatsApp prompt) *"
        : "Your phone *";
    if ($("phoneHint"))
      $("phoneHint").textContent = giftMode
        ? "Prompt text will open on THEIR WhatsApp."
        : "Bundle on this number.";
    if (btnNotify) btnNotify.style.display = giftMode ? "inline-flex" : "none";
  }
  on($("modeSelf"), "click", function () {
    setGiftMode(false);
  });
  on($("modeGift"), "click", function () {
    setGiftMode(true);
  });

  function openModal(item, forceGift, prefillPhone, prefillName) {
    currentDeal = item;
    lastGift = null;
    setGiftMode(!!forceGift);
    if ($("modalTitle")) $("modalTitle").textContent = item.title;
    if ($("modalSub"))
      $("modalSub").textContent =
        "Ksh " + item.price + (item.validity ? " · " + item.validity : "");
    if (phoneInput) phoneInput.value = prefillPhone || "";
    if (nameInput) nameInput.value = prefillName || "";
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
    }, 40);
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
    var deal = (C.dataDeals || [])[0];
    if (deal) openModal(deal, true);
  });
  on($("pillGift"), "click", function () {
    if ($("promptCard")) $("promptCard").scrollIntoView({ behavior: "smooth" });
    toast("Andika nambari → WhatsApp the friend");
  });

  function validatePhone() {
    if (!currentDeal) return null;
    var phone = normalizePhone(phoneInput && phoneInput.value);
    if (!isValidKenyaPhone(phone)) {
      if (phoneError) phoneError.style.display = "block";
      return null;
    }
    if (phoneError) phoneError.style.display = "none";
    return { phone: phone, name: ((nameInput && nameInput.value) || "").trim() };
  }

  /** Button: send gift text TO friend from modal */
  on(btnNotify, "click", function () {
    var phone =
      (lastGift && lastGift.phone) ||
      normalizePhone(phoneInput && phoneInput.value);
    var text = giftMessageForFriend({
      yourName: (nameInput && nameInput.value) || "",
      dealTitle: (currentDeal && currentDeal.title) || (lastGift && lastGift.title),
      price: (currentDeal && currentDeal.price) || (lastGift && lastGift.price),
      orderId: lastGift && lastGift.orderId,
      note: lastGift
        ? "Nimeweka order. Utapokea baada ya payment."
        : "Ninakuwekea data sasa.",
    });
    if (openWhatsAppTo(phone, text)) {
      toast("Message iko kwa WhatsApp ya rafiki — bofya Send");
    }
  });

  on(btnWa, "click", function () {
    var v = validatePhone();
    if (!v) return;
    if (btnWa) btnWa.disabled = true;
    if (stkStatus) {
      stkStatus.style.display = "block";
      stkStatus.textContent = "Creating order…";
      stkStatus.className = "stk-status";
    }
    createServerOrder(currentDeal, v.phone, v.name, "till_whatsapp", giftMode)
      .then(function (data) {
        lastGift = {
          orderId: data.orderId,
          phone: v.phone,
          title: currentDeal.title,
          price: currentDeal.price,
        };
        if (orderPreview) {
          orderPreview.textContent =
            "Order: " +
            data.orderId +
            "\n" +
            (giftMode ? "Gift to: " : "To: ") +
            v.phone +
            "\nKsh " +
            currentDeal.price;
          orderPreview.style.display = "block";
        }
        if (stkStatus) {
          stkStatus.textContent = giftMode
            ? "Order saved. 1) Shop WhatsApp  2) Friend gets gift prompt"
            : "Order saved · shop WhatsApp";
          stkStatus.className = "stk-status ok";
        }

        // 1) Message to SHOP
        openWhatsAppShop(
          shopOrderText({
            orderId: data.orderId,
            gift: giftMode,
            phone: v.phone,
            title: currentDeal.title,
            price: currentDeal.price,
            name: v.name,
            okoa: !!currentDeal.okOa,
            ref: refCode,
          })
        );

        // 2) If gift → message TO FRIEND (they see the gift prompt)
        if (giftMode) {
          if (btnNotify) btnNotify.style.display = "inline-flex";
          setTimeout(function () {
            var friendText = giftMessageForFriend({
              yourName: v.name,
              dealTitle: currentDeal.title,
              price: currentDeal.price,
              orderId: data.orderId,
              note: "Nimeweka order na nitalipa. Utapokea baada ya confirmation.",
            });
            openWhatsAppTo(v.phone, friendText);
            toast("Rafiki: tuma gift message kwenye WhatsApp yake");
          }, 800);
        } else {
          toast("Order " + data.orderId);
          setTimeout(closeModal, 500);
        }
      })
      .catch(function (e) {
        if (stkStatus) {
          stkStatus.textContent = e.message || "Error";
          stkStatus.className = "stk-status err";
        }
        if (btnWa) btnWa.disabled = false;
        toast(e.message || "Failed");
      });
  });

  on(btnStk, "click", function () {
    var v = validatePhone();
    if (!v) return;
    createServerOrder(currentDeal, v.phone, v.name, "stk", giftMode)
      .then(function (data) {
        lastGift = {
          orderId: data.orderId,
          phone: v.phone,
          title: currentDeal.title,
          price: currentDeal.price,
        };
        return fetch("/api/mpesa/stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: v.phone,
            amount: currentDeal.price,
            orderId: data.orderId,
            dealTitle: currentDeal.title,
          }),
        }).then(function (res) {
          return res.json().then(function (stk) {
            return { orderId: data.orderId, stk: stk };
          });
        });
      })
      .then(function (r) {
        if (r.stk && r.stk.ok) {
          if (giftMode) {
            setTimeout(function () {
              openWhatsAppTo(
                v.phone,
                giftMessageForFriend({
                  yourName: v.name,
                  dealTitle: currentDeal.title,
                  price: currentDeal.price,
                  orderId: r.orderId,
                  note: "Ninalipa sasa. Utapokea hivi karibuni.",
                })
              );
            }, 600);
          }
          toast("Enter M-Pesa PIN");
        } else toast((r.stk && r.stk.error) || "Use till instead");
      })
      .catch(function (e) {
        toast(e.message || "Error");
      });
  });

  function render(list, mountId) {
    var root = $(mountId);
    if (!root) return;
    root.innerHTML = "";
    if (!list || !list.length) {
      root.innerHTML = '<div class="empty">No deals</div>';
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

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var item = dealIndex[btn.getAttribute("data-id")];
    if (!item) return;
    e.preventDefault();
    var act = btn.getAttribute("data-act");
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
    if (navigator.clipboard)
      navigator.clipboard.writeText(C.till).then(function () {
        toast("Till " + C.till);
      });
    else toast("Till: " + C.till);
  });

  fetch("/api/health")
    .then(function (r) {
      return r.json();
    })
    .then(function (d) {
      if (d && d.mpesa && btnStk) btnStk.style.display = "inline-flex";
    })
    .catch(function () {});

  toast("Gift prompt → friend's WhatsApp");
})();
