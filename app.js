/* Gift = SMS prompt to friend's number + Accept/Decline link */
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
    showBoot("Open https://gamer-digital-services.vercel.app/?v=sms1");
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
    }, 3200);
  }

  function normalizePhone(raw) {
    var p = String(raw || "").replace(/\D/g, "");
    if (p.indexOf("254") === 0 && p.length === 12) p = "0" + p.slice(3);
    return p;
  }
  function isValidKenyaPhone(p) {
    return /^0[17]\d{8}$/.test(p);
  }

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
        banner.textContent = "Referral: " + refCode;
        banner.classList.add("show");
      }
      if (status) status.textContent = "Active: " + refCode;
      if (input && document.activeElement !== input) input.value = refCode;
      if (refNote) {
        refNote.style.display = "block";
        refNote.textContent = "Ref: " + refCode;
      }
      if (pill) pill.classList.add("on");
    } else {
      if (banner) {
        banner.classList.remove("show");
        banner.textContent = "";
      }
      if (status) status.textContent = "No code";
      if (input && document.activeElement !== input) input.value = "";
      if (refNote) refNote.style.display = "none";
      if (pill) pill.classList.remove("on");
    }
  }
  updateRefUI();

  on($("applyRef"), "click", function () {
    var v = ($("refInput") && $("refInput").value) || "";
    if (!v.trim()) return toast("Enter code");
    setRef(v);
  });
  on($("clearRef"), "click", function () {
    setRef("");
    if ($("refInput")) $("refInput").value = "";
  });
  on($("pillRef"), "click", function () {
    if ($("refTool")) $("refTool").scrollIntoView({ behavior: "smooth" });
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

  var helpUrl =
    "https://wa.me/" +
    C.whatsapp +
    "?text=" +
    encodeURIComponent("Habari, naomba help.");
  ["waTop", "waSide"].forEach(function (id) {
    if ($(id)) $(id).href = helpUrl;
  });

  if ($("footPhone")) $("footPhone").textContent = "Till " + C.till;
  if ($("tillText")) $("tillText").textContent = C.till;
  if ($("tillHow")) $("tillHow").textContent = C.till;
  if (C.subtitle && $("heroSub")) $("heroSub").textContent = C.subtitle;

  var why = $("whyList");
  if (why) {
    [
      "Gift SMS goes to friend's number",
      "Friend Accepts or Declines",
      "You pay M-Pesa till",
      "Order ID on this site",
    ].forEach(function (f) {
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

  on($("copyTill"), "click", function () {
    if (navigator.clipboard)
      navigator.clipboard.writeText(C.till).then(function () {
        toast("Till " + C.till);
      });
  });

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
        payMethod: payMethod || "till",
        gift: !!isGift,
        okoa: !!deal.okOa,
        sendPrompt: !!isGift,
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
  var lastOrder = null;
  var modal = $("orderModal");
  var phoneInput = $("phoneInput");
  var nameInput = $("nameInput");
  var phoneError = $("phoneError");
  var formStep = $("formStep");
  var successBox = $("successBox");
  var stkStatus = $("stkStatus");
  var btnConfirm = $("modalConfirm");
  var btnStk = $("modalStk");

  function setGiftMode(on) {
    giftMode = !!on;
    if ($("modeSelf")) $("modeSelf").classList.toggle("on", !giftMode);
    if ($("modeGift")) $("modeGift").classList.toggle("on", giftMode);
    if ($("pillGift")) $("pillGift").classList.toggle("on", giftMode);
    if ($("phoneLabel"))
      $("phoneLabel").textContent = giftMode
        ? "Friend's phone (gets SMS prompt) *"
        : "Your phone *";
    if ($("phoneHint"))
      $("phoneHint").textContent = giftMode
        ? "We SMS them a link to Accept or Decline."
        : "Bundle loads on this number after you pay till.";
    if (btnConfirm)
      btnConfirm.textContent = giftMode
        ? "Send prompt to this number"
        : "Create order & show till";
  }
  on($("modeSelf"), "click", function () {
    setGiftMode(false);
  });
  on($("modeGift"), "click", function () {
    setGiftMode(true);
  });

  function openModal(item, forceGift) {
    currentDeal = item;
    lastOrder = null;
    setGiftMode(!!forceGift);
    if ($("modalTitle")) $("modalTitle").textContent = item.title;
    if ($("modalSub"))
      $("modalSub").textContent =
        "Ksh " + item.price + (item.validity ? " · " + item.validity : "");
    if (phoneInput) phoneInput.value = "";
    if (nameInput) nameInput.value = "";
    if (phoneError) phoneError.style.display = "none";
    if (stkStatus) {
      stkStatus.style.display = "none";
      stkStatus.textContent = "";
    }
    if ($("okoaNote")) $("okoaNote").style.display = item.okOa ? "block" : "none";
    updateRefUI();
    if (formStep) formStep.style.display = "block";
    if (successBox) successBox.classList.remove("show");
    if ($("giftLinkBlock")) $("giftLinkBlock").style.display = "none";
    if (btnConfirm) btnConfirm.disabled = false;
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
  on($("doneBtn"), "click", closeModal);
  on(modal, "click", function (e) {
    if (e.target === modal) closeModal();
  });

  on($("startGift"), "click", function () {
    var deal = (C.dataDeals || [])[0];
    if (deal) openModal(deal, true);
  });
  on($("pillGift"), "click", function () {
    toast("Tap Gift on a deal");
  });

  function validatePhone() {
    if (!currentDeal) return null;
    var phone = normalizePhone(phoneInput && phoneInput.value);
    if (!isValidKenyaPhone(phone)) {
      if (phoneError) phoneError.style.display = "block";
      return null;
    }
    if (phoneError) phoneError.style.display = "none";
    return {
      phone: phone,
      name: ((nameInput && nameInput.value) || "").trim(),
    };
  }

  function giftLinkFor(orderId) {
    return location.origin + "/gift.html?id=" + encodeURIComponent(orderId);
  }

  function showSuccess(order, api) {
    lastOrder = order;
    api = api || {};
    if (formStep) formStep.style.display = "none";
    if (successBox) successBox.classList.add("show");
    if ($("successOid")) $("successOid").textContent = order.orderId;

    var link = api.giftLink || (order.gift ? giftLinkFor(order.orderId) : "");
    order.giftLink = link;

    var promptEl = $("promptStatus");
    if (order.gift) {
      if (api.promptSent) {
        if ($("successPay"))
          $("successPay").textContent =
            "✓ Prompt sent to " + order.phone;
        if (promptEl) {
          promptEl.style.display = "block";
          promptEl.textContent =
            "Friend should receive an SMS with Accept / Decline. After they Accept, pay till " +
            C.till +
            " (Ksh " +
            order.price +
            ").";
        }
      } else if (api.smsConfigured === false) {
        if ($("successPay"))
          $("successPay").textContent =
            "SMS not set up yet — use link below";
        if (promptEl) {
          promptEl.style.display = "block";
          promptEl.textContent =
            "Add Africa's Talking keys on Vercel so the prompt SMS goes to " +
            order.phone +
            " automatically.";
        }
      } else {
        if ($("successPay"))
          $("successPay").textContent =
            "Could not SMS " + order.phone + " — share link";
        if (promptEl) {
          promptEl.style.display = "block";
          promptEl.textContent =
            (api.sms && api.sms.error) ||
            "SMS failed. Copy the gift link and send it to them.";
        }
      }
      if ($("successPhone"))
        $("successPhone").textContent = "Number: " + order.phone;
      if ($("giftLinkBlock") && link) {
        $("giftLinkBlock").style.display = "block";
        if ($("giftLinkText")) $("giftLinkText").textContent = link;
      }
      if ($("successTillHint"))
        $("successTillHint").textContent =
          "After Accept → pay Ksh " + order.price + " till " + C.till;
    } else {
      if ($("successPay"))
        $("successPay").textContent =
          "Pay Ksh " + order.price + " to till " + C.till;
      if ($("successPhone"))
        $("successPhone").textContent = "Deliver to: " + order.phone;
      if (promptEl) promptEl.style.display = "none";
      if ($("giftLinkBlock")) $("giftLinkBlock").style.display = "none";
      if ($("successTillHint"))
        $("successTillHint").textContent =
          "M-Pesa → Lipa na M-Pesa → Buy Goods → till → amount → PIN";
    }

    var help = $("helpAfter");
    if (help) {
      help.style.display = "inline-flex";
      help.href =
        "https://wa.me/" +
        C.whatsapp +
        "?text=" +
        encodeURIComponent("Order " + order.orderId);
    }
  }

  on(btnConfirm, "click", function () {
    var v = validatePhone();
    if (!v) return;
    btnConfirm.disabled = true;
    if (stkStatus) {
      stkStatus.style.display = "block";
      stkStatus.className = "stk-status";
      stkStatus.textContent = giftMode
        ? "Sending prompt to " + v.phone + "…"
        : "Creating order…";
    }
    createServerOrder(currentDeal, v.phone, v.name, "till", giftMode)
      .then(function (data) {
        showSuccess(
          {
            orderId: data.orderId,
            phone: v.phone,
            price: currentDeal.price,
            title: currentDeal.title,
            gift: giftMode,
          },
          data
        );
        if (giftMode && data.promptSent) {
          toast("Prompt sent to " + v.phone);
        } else if (giftMode) {
          toast("Gift created — SMS needs AT keys (link ready)");
        } else {
          toast("Order " + data.orderId + " — pay till");
        }
      })
      .catch(function (e) {
        if (stkStatus) {
          stkStatus.className = "stk-status err";
          stkStatus.textContent = e.message || "Failed";
        }
        btnConfirm.disabled = false;
        toast(e.message || "Failed");
      });
  });

  on($("copyOrderBtn"), "click", function () {
    if (!lastOrder) return;
    var text =
      lastOrder.gift && lastOrder.giftLink
        ? "Habari, nimekutengenezea gift.\n" +
          lastOrder.title +
          "\nAccept or Decline:\n" +
          lastOrder.giftLink
        : "Order " +
          lastOrder.orderId +
          "\nKsh " +
          lastOrder.price +
          " till " +
          C.till;
    if (navigator.clipboard)
      navigator.clipboard.writeText(text).then(function () {
        toast("Copied");
      });
  });

  on($("copyGiftLinkBtn"), "click", function () {
    if (!lastOrder || !lastOrder.giftLink) return;
    if (navigator.clipboard)
      navigator.clipboard.writeText(lastOrder.giftLink).then(function () {
        toast("Link copied");
      });
  });

  on(btnStk, "click", function () {
    var v = validatePhone();
    if (!v) return;
    createServerOrder(currentDeal, v.phone, v.name, "stk", giftMode).then(
      function (data) {
        showSuccess(
          {
            orderId: data.orderId,
            phone: v.phone,
            price: currentDeal.price,
            title: currentDeal.title,
            gift: giftMode,
          },
          data
        );
      }
    );
  });

  var dealIndex = {};

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
    if (btn.getAttribute("data-act") === "buy") openModal(item, false);
    else if (btn.getAttribute("data-act") === "gift") openModal(item, true);
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
    [
      {
        q: "How does the friend get the prompt?",
        a: "When you Gift and enter their number, the site sends them an SMS with Accept / Decline. You need Africa's Talking SMS keys on Vercel.",
      },
      {
        q: "Do I need WhatsApp?",
        a: "No. SMS prompt + till payment. WhatsApp is only optional help.",
      },
    ].forEach(function (item) {
      var d = document.createElement("details");
      d.innerHTML = "<summary>" + item.q + "</summary><p>" + item.a + "</p>";
      faqRoot.appendChild(d);
    });
  }

  fetch("/api/health")
    .then(function (r) {
      return r.json();
    })
    .then(function (d) {
      if (d && d.mpesa && btnStk) btnStk.style.display = "inline-flex";
    })
    .catch(function () {});
})();
