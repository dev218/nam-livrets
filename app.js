(function () {
  "use strict";

  /* ---------- Language packs ---------- */
  var T = {
    "en-US": {
      ask: function (a, b) { return "What is " + a + " times " + b + "?"; },
      again: ["Try again.", "Have another go."],
      reveal: function (a, b, r) { return a + " times " + b + " is " + r + "."; },
      askSub: function (a, b) { return "What is " + a + " minus " + b + "?"; },
      revealSub: function (a, b, r) { return a + " minus " + b + " is " + r + "."; },
      askAdd: function (a, b) { return "What is " + a + " plus " + b + "?"; },
      revealAdd: function (a, b, r) { return a + " plus " + b + " is " + r + "."; },
      noHear: "I did not hear you. Say the answer.",
      done: function (s, n) { return "You got " + s + " out of " + n + "."; },
      listening: "Listening…", speaking: "Listen…", tryAgain: "Try again!", right: "Yes!",
      startAns: "Say your answer"
    },
    "fr-FR": {
      ask: function (a, b) { return "Combien font " + a + " fois " + b + " ?"; },
      again: ["Essaie encore.", "Réessaie."],
      reveal: function (a, b, r) { return a + " fois " + b + " font " + r + "."; },
      askSub: function (a, b) { return "Combien font " + a + " moins " + b + " ?"; },
      revealSub: function (a, b, r) { return a + " moins " + b + " font " + r + "."; },
      askAdd: function (a, b) { return "Combien font " + a + " plus " + b + " ?"; },
      revealAdd: function (a, b, r) { return a + " plus " + b + " font " + r + "."; },
      noHear: "Je n'ai pas entendu. Dis la réponse.",
      done: function (s, n) { return "Tu as eu " + s + " sur " + n + "."; },
      listening: "J'écoute…", speaking: "Écoute…", tryAgain: "Réessaie !", right: "Oui !",
      startAns: "Dis ta réponse"
    },
    "vi-VN": {
      ask: function (a, b) { return a + " nhân " + b + " bằng mấy?"; },
      again: ["Thử lại nhé.", "Cố lên, thử lại nào."],
      reveal: function (a, b, r) { return a + " nhân " + b + " bằng " + r + "."; },
      askSub: function (a, b) { return a + " trừ " + b + " bằng mấy?"; },
      revealSub: function (a, b, r) { return a + " trừ " + b + " bằng " + r + "."; },
      askAdd: function (a, b) { return a + " cộng " + b + " bằng mấy?"; },
      revealAdd: function (a, b, r) { return a + " cộng " + b + " bằng " + r + "."; },
      noHear: "Mình chưa nghe thấy. Hãy nói đáp án.",
      done: function (s, n) { return "Con đúng " + s + " trên " + n + " câu."; },
      listening: "Đang nghe…", speaking: "Nghe nhé…", tryAgain: "Thử lại!", right: "Đúng rồi!",
      startAns: "Nói đáp án"
    }
  };

  T["fr-CH"] = T["fr-FR"];

  /* ---------- Spoken number parsing (digits first, then words) ---------- */
  var EN = { zero:0, oh:0, one:1, won:1, two:2, to:2, too:2, three:3, four:4, for:4, fore:4, five:5, six:6, seven:7, eight:8, ate:8, nine:9,
    ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19,
    twenty:20, thirty:30, forty:40, fourty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90 };
  var FR = { zero:0, un:1, une:1, deux:2, trois:3, quatre:4, cinq:5, six:6, sept:7, huit:8, neuf:9, dix:10, onze:11, douze:12, treize:13,
    quatorze:14, quinze:15, seize:16, vingt:20, vingts:20, trente:30, quarante:40, cinquante:50, soixante:60, septante:70, huitante:80, octante:80, nonante:90 };
  var VI = { "không":0, "một":1, "mốt":1, hai:2, ba:3, "bốn":4, "tư":4, "năm":5, "lăm":5, "sáu":6, "bảy":7, "bẩy":7, "tám":8, "chín":9 };

  function wordsToNumber(text, lang) {
    var t = text.toLowerCase().replace(/[.,!?]/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
    if (!t) return null;
    var tok = t.split(" "), i, n = 0, hit = false;
    if (lang === "en-US") {
      for (i = 0; i < tok.length; i++) if (EN.hasOwnProperty(tok[i])) { n += EN[tok[i]]; hit = true; }
      return hit ? n : null;
    }
    if (lang.indexOf("fr") === 0) {
      for (i = 0; i < tok.length; i++) {
        var w = tok[i];
        if (w === "et" || w === "cent") continue;
        if (w === "quatre" && (tok[i + 1] === "vingt" || tok[i + 1] === "vingts")) { n += 80; i++; hit = true; continue; }
        if (FR.hasOwnProperty(w)) { n += FR[w]; hit = true; }
      }
      return hit ? n : null;
    }
    if (lang === "vi-VN") {
      var idx = tok.indexOf("mươi");
      if (idx > 0 && VI.hasOwnProperty(tok[idx - 1])) {
        n = VI[tok[idx - 1]] * 10;
        if (idx + 1 < tok.length && VI.hasOwnProperty(tok[idx + 1])) n += VI[tok[idx + 1]];
        return n;
      }
      idx = tok.indexOf("mười");
      if (idx >= 0) {
        n = 10;
        if (idx + 1 < tok.length && VI.hasOwnProperty(tok[idx + 1])) n += VI[tok[idx + 1]];
        return n;
      }
      for (i = 0; i < tok.length; i++) if (VI.hasOwnProperty(tok[i])) return VI[tok[i]];
      return null;
    }
    return null;
  }
  function parseSpoken(text, lang) {
    var m = String(text).replace(/\s+/g, "").match(/\d+/);
    if (m) return parseInt(m[0], 10);
    return wordsToNumber(text, lang);
  }

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function store(k, v) { try { localStorage.setItem("ttt2_" + k, v); } catch (e) {} }
  function load(k, d) { try { var v = localStorage.getItem("ttt2_" + k); return v === null ? d : v; } catch (e) { return d; } }

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var hasTTS = "speechSynthesis" in window;

  /* ---------- Audio (feedback sounds) ---------- */
  var actx = null;
  function unlockAudio() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
    } catch (e) {}
  }
  function tone(freq, start, dur, type, vol) {
    if (!actx) return;
    var o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + start;
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.35, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function playCorrect() { tone(523.25, 0, .16, "triangle"); tone(659.25, .12, .16, "triangle"); tone(783.99, .24, .16, "triangle"); tone(1046.5, .36, .35, "triangle"); }
  function playWrong() { tone(220, 0, .22, "sawtooth", .18); tone(165, .18, .32, "sawtooth", .18); }
  function playFinish() { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach(function (f, i) { tone(f, i * .13, .2, "triangle"); }); }

  /* ---------- Speech output ---------- */
  var voices = [];
  function refreshVoices() { if (hasTTS) voices = speechSynthesis.getVoices() || []; }
  if (hasTTS) { refreshVoices(); speechSynthesis.onvoiceschanged = refreshVoices; }

  function speak(text, lang) {
    return new Promise(function (resolve) {
      if (!hasTTS) { resolve(); return; }
      var done = false;
      function fin() { if (!done) { done = true; clearTimeout(guard); resolve(); } }
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = 0.92; u.pitch = 1.05;
      var base = lang.split("-")[0], v = null, i;
      for (i = 0; i < voices.length; i++) if (voices[i].lang === lang) { v = voices[i]; break; }
      if (!v) for (i = 0; i < voices.length; i++) if (voices[i].lang.indexOf(base) === 0) { v = voices[i]; break; }
      if (v) u.voice = v;
      u.onend = fin; u.onerror = fin;
      var guard = setTimeout(fin, 7000);
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    });
  }

  /* ---------- State ---------- */
  // Per-mode settings and dispatch. Setting names double as localStorage keys.
  var MODES = {
    mul: { sign: "×", countKey: "count", ask: "ask", reveal: "reveal",
           answer: function (a, b) { return a * b; } },
    sub: { sign: "−", countKey: "subCount", digitKeys: ["subDigits1", "subDigits2"], ask: "askSub", reveal: "revealSub",
           answer: function (a, b) { return a - b; } },
    add: { sign: "+", countKey: "addCount", digitKeys: ["addDigits1", "addDigits2"], ask: "askAdd", reveal: "revealAdd",
           answer: function (a, b) { return a + b; } }
  };
  var S = { count: 15, max: 9, lang: "fr-CH",
            subCount: 5, subDigits1: 2, subDigits2: 1,
            addCount: 5, addDigits1: 2, addDigits2: 1 };
  S.mode = MODES.hasOwnProperty(document.body.getAttribute("data-mode")) ? document.body.getAttribute("data-mode") : "mul";
  var M = MODES[S.mode];
  function isMul() { return S.mode === "mul"; }
  function answerOf(q) { return M.answer(q[0], q[1]); }
  function opSign() { return M.sign; }
  function askText(P, q) { return P[M.ask](q[0], q[1]); }
  function revealText(P, q, r) { return P[M.reveal](q[0], q[1], r); }
  function digitsOf(i) { return M.digitKeys ? S[M.digitKeys[i]] : 0; }
  var run = 0;            // increments to cancel in-flight work
  var quiz = null;        // { qs, i, score, misses, attempts, awaiting }
  var rec = null;

  /* ---------- Setup screen ---------- */
  function buildCountChips() {
    var cc = $("countChips"), cur = S[M.countKey];
    cc.innerHTML = "";
    [5, 10, 15, 20].forEach(function (n) {
      var b = document.createElement("button");
      b.className = "chip"; b.type = "button"; b.textContent = n;
      b.setAttribute("aria-pressed", String(n === cur));
      b.onclick = function () {
        S[M.countKey] = n; store(M.countKey, n);
        Array.prototype.forEach.call(cc.children, function (c) { c.setAttribute("aria-pressed", String(c === b)); });
      };
      cc.appendChild(b);
    });
  }

  function buildDigitChips(dc, key) {
    if (!dc) return;
    dc.innerHTML = "";
    for (var d = 1; d <= 4; d++) (function (d) {
      var b = document.createElement("button");
      b.className = "chip"; b.type = "button"; b.textContent = d;
      b.setAttribute("aria-pressed", String(d === S[key]));
      b.onclick = function () {
        S[key] = d; store(key, d);
        Array.prototype.forEach.call(dc.children, function (c) { c.setAttribute("aria-pressed", String(c === b)); });
      };
      dc.appendChild(b);
    })(d);
  }

  function buildSetup() {
    var mc = $("maxChips");
    buildCountChips();
    if (M.digitKeys) {
      buildDigitChips($("digit1Chips"), M.digitKeys[0]);
      buildDigitChips($("digit2Chips"), M.digitKeys[1]);
    }
    if (mc) for (var t = 2; t <= 9; t++) (function (t) {
      var b = document.createElement("button");
      b.className = "chip"; b.type = "button"; b.textContent = t;
      b.setAttribute("aria-pressed", String(t === S.max));
      b.onclick = function () {
        S.max = t; store("max", t);
        Array.prototype.forEach.call(mc.children, function (c) { c.setAttribute("aria-pressed", String(c === b)); });
      };
      mc.appendChild(b);
    })(t);
    $("lang").value = S.lang;
    $("lang").onchange = function () { S.lang = this.value; store("lang", S.lang); document.documentElement.lang = S.lang.split("-")[0]; };

    var msgs = [];
    if (!SR) msgs.push("Voice answers need Safari on iPhone (iOS 14.5 or newer). You can still type answers.");
    if (!hasTTS) msgs.push("Spoken questions are not supported here.");
    if (msgs.length) { $("supportWarn").style.display = "block"; $("supportWarn").textContent = msgs.join(" "); }
  }

  function loadSettings() {
    var c = parseInt(load("count", "15"), 10); if ([5,10,15,20].indexOf(c) >= 0) S.count = c;
    var l = load("lang", "fr-CH"); if (T[l]) S.lang = l;
    var mx = parseInt(load("max", "9"), 10); if (mx >= 2 && mx <= 9) S.max = mx;
    ["subCount", "addCount"].forEach(function (k) {
      var v = parseInt(load(k, String(S[k])), 10); if ([5,10,15,20].indexOf(v) >= 0) S[k] = v;
    });
    ["subDigits1", "subDigits2", "addDigits1", "addDigits2"].forEach(function (k) {
      var v = parseInt(load(k, String(S[k])), 10); if (v >= 1 && v <= 4) S[k] = v;
    });
  }

  function show(id) {
    ["s-setup", "s-quiz", "s-result"].forEach(function (s) { $(s).classList.toggle("on", s === id); });
    window.scrollTo(0, 0);
  }

  /* ---------- Question generation ---------- */
  function makeQuestions(n, tables) {
    var pool = [], a, b;
    tables.forEach(function (a) { for (b = 2; b <= 9; b++) pool.push([a, b]); });
    // shuffle
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
    var out = [];
    while (out.length < n) {
      var chunk = pool.slice();
      for (var k = chunk.length - 1; k > 0; k--) { var m = Math.floor(Math.random() * (k + 1)); var t2 = chunk[k]; chunk[k] = chunk[m]; chunk[m] = t2; }
      out = out.concat(chunk);
    }
    return out.slice(0, n).map(function (p) { return Math.random() < 0.5 ? [p[1], p[0]] : p; });
  }

  function makeAddQuestions(n, digits1, digits2) {
    var top1 = Math.pow(10, digits1), top2 = Math.pow(10, digits2), out = [];
    while (out.length < n) {
      var a = Math.floor(Math.random() * top1), b = Math.floor(Math.random() * top2);
      if (a === 0 && b === 0) continue;
      out.push([a, b]);
    }
    return out;
  }

  function makeSubQuestions(n, digits1, digits2) {
    var top1 = Math.pow(10, digits1), top2 = Math.pow(10, digits2), out = [];
    while (out.length < n) {
      var a = Math.floor(Math.random() * top1);
      if (a === 0) continue;
      var b = Math.floor(Math.random() * Math.min(top2, a));
      out.push([a, b]);
    }
    return out;
  }

  /* ---------- Quiz flow ---------- */
  function setStatus(s, h) { $("status").textContent = s || "\u00a0"; $("heard").textContent = h || "\u00a0"; }
  function micState(on) { $("mic").classList.toggle("listen", !!on); }
  function warnMic(msg) { var w = $("micWarn"); w.style.display = msg ? "block" : "none"; w.textContent = msg || ""; }

  function stopRec() {
    micState(false);
    if (rec) { try { rec.onresult = rec.onerror = rec.onend = null; rec.abort(); } catch (e) {} rec = null; }
  }

  function startQuiz() {
    unlockAudio();
    if (hasTTS) { try { speechSynthesis.cancel(); var w = new SpeechSynthesisUtterance(" "); w.volume = 0; speechSynthesis.speak(w); } catch (e) {} }
    run++;
    var tbls = []; for (var t = 2; t <= S.max; t++) tbls.push(t);
    var qs = S.mode === "sub" ? makeSubQuestions(S.subCount, digitsOf(0), digitsOf(1))
           : S.mode === "add" ? makeAddQuestions(S.addCount, digitsOf(0), digitsOf(1))
           : makeQuestions(S.count, tbls);
    quiz = { qs: qs, i: 0, score: 0, misses: [], attempts: 0, listenTries: 0 };
    warnMic("");
    show("s-quiz");
    askCurrent();
  }

  function renderQuestion() {
    var q = quiz.qs[quiz.i], a = q[0], b = q[1];
    $("q").innerHTML = a + '<span class="x">' + opSign() + '</span>' + b;
    $("q").classList.toggle("long", Math.max(digitsOf(0), digitsOf(1)) >= 3);
    $("count").textContent = (quiz.i + 1) + "/" + quiz.qs.length;
    $("barFill").style.width = (quiz.i / quiz.qs.length * 100) + "%";
    var g = $("dots"); g.innerHTML = "";
    if (isMul()) {
      g.style.gridTemplateColumns = "repeat(" + b + ", auto)";
      for (var k = 0; k < a * b; k++) g.appendChild(document.createElement("i"));
    }
    $("card").className = "card";
    $("typed").value = "";
  }

  async function askCurrent() {
    var my = run;
    stopRec();
    renderQuestion();
    quiz.attempts = 0; quiz.listenTries = 0;
    var q = quiz.qs[quiz.i], P = T[S.lang];
    setStatus(P.speaking, "");
    await speak(askText(P, q), S.lang);
    if (my !== run) return;
    listen();
  }

  async function repeatQuestion() {
    var my = run; if (!quiz) return;
    stopRec();
    var q = quiz.qs[quiz.i], P = T[S.lang];
    setStatus(P.speaking, "");
    await speak(askText(P, q), S.lang);
    if (my !== run) return;
    listen();
  }

  function listen() {
    var my = run, P = T[S.lang];
    if (!SR) { setStatus("", ""); $("typed").focus(); return; }
    stopRec();
    var r = new SR(), got = false;
    rec = r;
    r.lang = S.lang; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
    r.onstart = function () { if (my === run) { micState(true); setStatus(P.listening, ""); } };
    r.onresult = function (e) {
      if (my !== run) return;
      got = true;
      var alts = [], res = e.results[e.results.length - 1];
      for (var i = 0; i < res.length; i++) alts.push(res[i].transcript);
      micState(false);
      handleHeard(alts);
    };
    r.onerror = function (e) {
      if (my !== run) return;
      micState(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        got = true;
        var framed = false;
        try { framed = window.top !== window.self; } catch (x) { framed = true; }
        var why = framed
          ? "This page is embedded in another page, and Safari blocks the microphone there. Open the page on its own address (see the notes) or host the file yourself."
          : e.error === "service-not-allowed"
            ? "Speech recognition is off on this iPhone. Turn on Settings > General > Keyboard > Enable Dictation, and Settings > Apple Intelligence & Siri."
            : "The microphone is blocked. In Safari, tap aA in the address bar, open Website Settings, and allow Microphone.";
        warnMic(why + " (code: " + e.error + ") You can type answers meanwhile.");
        setStatus("", "");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        got = true;
        warnMic("Speech recognition problem (code: " + e.error + "). Language: " + S.lang + ". You can type answers meanwhile.");
        setStatus("", "");
      }
    };
    r.onend = function () {
      if (my !== run || got) return;
      micState(false);
      quiz.listenTries++;
      if (quiz.listenTries >= 3) {
        setStatus("Tap the mic to answer", "");
        return;
      }
      (async function () {
        setStatus("", "");
        await speak(P.noHear, S.lang);
        if (my === run) listen();
      })();
    };
    try { r.start(); } catch (err) { setStatus("Tap the mic to answer", ""); }
  }

  function handleHeard(alts) {
    var q = quiz.qs[quiz.i], correct = answerOf(q);
    var nums = alts.map(function (a) { return parseSpoken(a, S.lang); });
    var shown = alts[0];
    var ok = nums.indexOf(correct) >= 0;
    var given = ok ? correct : nums.find(function (n) { return n !== null; });
    $("heard").textContent = "“" + shown + "”";
    judge(ok, given === undefined ? null : given);
  }

  async function judge(ok, given) {
    var my = run, P = T[S.lang], q = quiz.qs[quiz.i], correct = answerOf(q);
    stopRec();
    if (ok) {
      unlockAudio();
      $("card").className = "card good";
      setStatus(P.right, $("heard").textContent === "\u00a0" ? "" : $("heard").textContent);
      playCorrect();
      if (quiz.attempts === 0) quiz.score++; else quiz.misses.push(q);
      $("barFill").style.width = ((quiz.i + 1) / quiz.qs.length * 100) + "%";
      await sleep(1100);
      if (my !== run) return;
      nextQuestion();
      return;
    }
    quiz.attempts++;
    playWrong();
    var card = $("card"); card.className = "card"; void card.offsetWidth; card.className = "card bad";
    if (quiz.attempts >= 2) {
      quiz.misses.push(q);
      setStatus(correct + "", $("heard").textContent);
      await sleep(500);
      if (my !== run) return;
      await speak(revealText(P, q, correct), S.lang);
      if (my !== run) return;
      nextQuestion();
    } else {
      setStatus(P.tryAgain, $("heard").textContent);
      await sleep(500);
      if (my !== run) return;
      await speak(P.again[Math.floor(Math.random() * P.again.length)], S.lang);
      if (my !== run) return;
      quiz.listenTries = 0;
      listen();
    }
  }

  function nextQuestion() {
    quiz.i++;
    if (quiz.i >= quiz.qs.length) finish(); else askCurrent();
  }

  async function finish() {
    var my = run, P = T[S.lang], n = quiz.qs.length, s = quiz.score;
    stopRec();
    $("barFill").style.width = "100%";
    $("score").textContent = s + "/" + n;
    var ratio = s / n, stars = ratio >= .9 ? 3 : ratio >= .6 ? 2 : ratio > 0 ? 1 : 0;
    $("stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    $("stars").style.color = "var(--sun)";
    $("rtext").textContent = "Right on the first try: " + s + " of " + n + ".";
    var m = $("miss");
    if (quiz.misses.length) {
      var seen = {}, html = "<b>Practice these</b>";
      quiz.misses.forEach(function (q) {
        var key = q[0] + "x" + q[1];
        if (!seen[key]) { seen[key] = 1; html += "<span>" + q[0] + " " + opSign() + " " + q[1] + " = " + answerOf(q) + "</span>"; }
      });
      m.innerHTML = html; m.style.display = "block";
    } else m.style.display = "none";
    show("s-result");
    playFinish();
    await sleep(900);
    if (my !== run) return;
    await speak(P.done(s, n), S.lang);
  }

  function quit() {
    run++; stopRec();
    if (hasTTS) speechSynthesis.cancel();
    show("s-setup");
  }

  /* ---------- Wire up ---------- */
  loadSettings();
  buildSetup();
  document.documentElement.lang = S.lang.split("-")[0];

  $("startBtn").onclick = startQuiz;
  $("againBtn").onclick = startQuiz;
  $("homeBtn").onclick = quit;
  $("quitBtn").onclick = quit;
  $("repeatBtn").onclick = function () { unlockAudio(); repeatQuestion(); };
  $("skipBtn").onclick = function () {
    if (!quiz) return;
    run++; stopRec(); if (hasTTS) speechSynthesis.cancel();
    quiz.misses.push(quiz.qs[quiz.i]);
    nextQuestion();
  };
  $("mic").onclick = function () {
    if (!quiz) return;
    unlockAudio();
    if (hasTTS) speechSynthesis.cancel();
    quiz.listenTries = 0;
    listen();
  };
  function submitTyped() {
    if (!quiz) return;
    var v = parseInt($("typed").value, 10);
    if (isNaN(v)) return;
    unlockAudio();
    if (hasTTS) speechSynthesis.cancel();
    var correct = answerOf(quiz.qs[quiz.i]);
    $("heard").textContent = "“" + v + "”";
    judge(v === correct, v);
  }
  $("typeGo").onclick = submitTyped;
  $("typed").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submitTyped(); } });
})();
