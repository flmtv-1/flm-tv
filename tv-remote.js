/* ═══════════════════════════════════════════════════════════════════
   FLM TV — Smart TV remote control (LG webOS + Samsung Tizen)
   Add to any page with:  <script src="tv-remote.js" defer></script>
   • Does nothing on PCs, phones or Fire TV (Fire TV keeps its own code)
   • Arrow keys move a gold highlight to the nearest thing you can click
   • OK / Enter clicks it; Back goes back (or exits the app on the home page)
   • Shows a "no internet" message if the connection drops
   ═══════════════════════════════════════════════════════════════════ */
(function () {
    var ua = navigator.userAgent || '';
    var isLG = /Web0S|webOS|NetCast/i.test(ua);
    var isSamsung = /Tizen|SMART-TV/i.test(ua);
    var isFireTV = /AFT|FireTV|Silk/i.test(ua);
    if (isFireTV || !(isLG || isSamsung)) return;
    if (window.__flmTvRemote) return;
    window.__flmTvRemote = true;

    var KEY = {
        LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,
        BACK_LG: 461, BACK_SAMSUNG: 10009, BACKSPACE: 8, ESC: 27
    };

    document.documentElement.classList.add('is-smart-tv', isLG ? 'is-lg-tv' : 'is-samsung-tv');

    // Samsung: ask for the remote keys we use (arrows/OK/Back are on by default)
    try { if (isSamsung && window.tizen && tizen.tvinputdevice) tizen.tvinputdevice.registerKey('MediaPlayPause'); } catch (e) {}

    // ── Look ──────────────────────────────────────────────────────
    var css = document.createElement('style');
    css.textContent =
        '.flm-tv-focus{outline:4px solid #ffd700 !important;outline-offset:3px !important;' +
        'box-shadow:0 0 0 6px rgba(255,215,0,.35),0 0 28px rgba(255,215,0,.55) !important;' +
        'transition:transform .15s ease,box-shadow .15s ease;}' +
        '.flm-tv-focus.content-card,.flm-tv-focus.ch-card,.flm-tv-focus[class*="card"]{transform:scale(1.07);}' +
        '#flmTvOffline{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;' +
        'background:rgba(7,7,9,.94);color:#F0EDE8;font-family:Arial,sans-serif;text-align:center;}' +
        '#flmTvOffline.show{display:flex;}' +
        '#flmTvOffline h2{color:#ffd700;font-size:44px;margin:0 0 16px;letter-spacing:2px;}' +
        '#flmTvOffline p{font-size:26px;margin:0 0 30px;color:#cfcfd6;}' +
        '#flmTvOffline button{font-size:26px;padding:14px 40px;border:none;border-radius:8px;background:#ffd700;color:#000;font-weight:700;}';
    (document.head || document.documentElement).appendChild(css);

    // ── What can be highlighted ───────────────────────────────────
    var SELECTOR = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"]),[onclick],[role="button"],' +
                   '[class*="card"],[class*="btn"],[class*="item"],[class*="tile"],[class*="poster"],[class*="ftab"]';

    function isVisible(el) {
        if (!el || el.disabled) return false;
        var r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return false;
        var s = window.getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) === 0) return false;
        if (el.closest('[aria-hidden="true"]')) return false;
        // must be within reach vertically (the page scrolls)...
        var vh = window.innerHeight, vw = window.innerWidth;
        if (r.bottom < -vh * 2 || r.top > vh * 3) return false;
        // ...and on screen sideways, unless it sits in a row that scrolls sideways
        if (r.right <= 0 || r.left >= vw) return inScrollRow(el);
        return true;
    }
    function inScrollRow(el) {
        var p = el.parentElement;
        while (p && p !== document.body) {
            if (p.scrollWidth > p.clientWidth + 4) {
                var ox = window.getComputedStyle(p).overflowX;
                if (ox === 'auto' || ox === 'scroll') {
                    var pr = p.getBoundingClientRect();
                    return pr.right > 0 && pr.left < window.innerWidth;
                }
            }
            p = p.parentElement;
        }
        return false;
    }
    function isClickable(el) {
        var tag = el.tagName;
        if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
        if (el.hasAttribute('onclick') || el.getAttribute('role') === 'button' || el.hasAttribute('tabindex')) return true;
        if (typeof el.onclick === 'function') return true;
        return window.getComputedStyle(el).cursor === 'pointer';
    }
    function candidates() {
        var list = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
        var out = [];
        for (var i = 0; i < list.length; i++) {
            var el = list[i];
            if (!isVisible(el) || !isClickable(el)) continue;
            out.push(el);
        }
        // skip an element when a clickable parent is already in the list (one stop per card)
        return out.filter(function (el) {
            var p = el.parentElement;
            while (p && p !== document.body) {
                if (out.indexOf(p) >= 0 && p.tagName !== 'BODY') return false;
                p = p.parentElement;
            }
            return true;
        });
    }

    // Modals: when a dialog/overlay is open, keep the highlight inside it
    function scope(all) {
        var modals = document.querySelectorAll('[class*="modal"],[class*="overlay"],[class*="popup"],[role="dialog"],[class*="lightbox"]');
        for (var i = modals.length - 1; i >= 0; i--) {
            var m = modals[i];
            var s = window.getComputedStyle(m);
            if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) continue;
            if (s.position !== 'fixed') continue;            // real popups sit on top of the page
            var r = m.getBoundingClientRect();
            if (r.width < window.innerWidth * 0.3 || r.height < window.innerHeight * 0.3) continue;
            if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
            var inside = all.filter(function (el) { return m.contains(el); });
            if (inside.length) return inside;
        }
        return all;
    }

    var current = null;
    function focusEl(el) {
        if (!el) return;
        if (current) current.classList.remove('flm-tv-focus');
        current = el;
        if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '0');
        // Some page styles switch focused items to position:relative — keep pinned/corner buttons where they are
        var pos = window.getComputedStyle(el).position;
        if (pos === 'absolute' || pos === 'fixed' || pos === 'sticky') el.style.setProperty('position', pos, 'important');
        el.classList.add('flm-tv-focus');
        try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
        bringIntoView(el);
    }
    // Scroll only the page (up/down) and sideways rows — never the banner or other clipped boxes
    function bringIntoView(el) {
        var r = el.getBoundingClientRect();
        for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            var ox = window.getComputedStyle(p).overflowX;
            if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth + 4) {
                var pr = p.getBoundingClientRect();
                var shift = (r.left + r.width / 2) - (pr.left + pr.width / 2);
                if (r.left < pr.left + 20 || r.right > pr.right - 20) {
                    try { p.scrollBy({ left: shift, behavior: 'smooth' }); } catch (e) { p.scrollLeft += shift; }
                }
                break;
            }
        }
        if (pinned(el)) return;
        var vh = window.innerHeight;
        if (r.top < vh * 0.15 || r.bottom > vh * 0.85) {
            var dy = (r.top + r.height / 2) - vh / 2;
            try { window.scrollBy({ top: dy, behavior: 'smooth' }); } catch (e) { window.scrollBy(0, dy); }
        }
    }

    function pinned(el) {   // part of something stuck to the screen (floating buttons, fixed header)
        for (var p = el; p && p !== document.body; p = p.parentElement) {
            if (window.getComputedStyle(p).position === 'fixed') return true;
        }
        return false;
    }
    function best(from, all, dir) {
        var a = from.getBoundingClientRect();
        var fromPinned = pinned(from);
        var ax = a.left + a.width / 2, ay = a.top + a.height / 2;
        var list = [];
        for (var i = 0; i < all.length; i++) {
            var el = all[i];
            if (el === from || from.contains(el) || el.contains(from)) continue;
            var b = el.getBoundingClientRect();
            // Up/Down through the page skips pinned buttons (reach them with Right),
            // except a pinned header at the top of the screen
            if ((dir === 'up' || dir === 'down') && !fromPinned && pinned(el) && b.top > window.innerHeight * 0.2) continue;
            var bx = b.left + b.width / 2, by = b.top + b.height / 2, gap, side, overlap;
            if (dir === 'right') { if (b.left < a.right - 4) continue; gap = b.left - a.right; side = Math.abs(by - ay);
                overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); }
            else if (dir === 'left') { if (b.right > a.left + 4) continue; gap = a.left - b.right; side = Math.abs(by - ay);
                overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); }
            else if (dir === 'down') { if (b.top < a.bottom - 4) continue; gap = b.top - a.bottom; side = Math.abs(bx - ax); }
            else { if (b.bottom > a.top + 4) continue; gap = a.top - b.bottom; side = Math.abs(bx - ax); }
            list.push({ el: el, gap: Math.max(0, gap), side: side, overlap: overlap });
        }
        if (!list.length) return null;
        var pick = null;
        if (dir === 'up' || dir === 'down') {
            // Netflix-style: go to the nearest row first, then the closest item in that row
            var minGap = Infinity;
            list.forEach(function (c) { if (c.gap < minGap) minGap = c.gap; });
            list.forEach(function (c) {
                if (c.gap <= minGap + 60 && (!pick || c.side < pick.side)) pick = c;
            });
        } else {
            // Left/Right: stay in the same row when possible
            var sameRow = list.filter(function (c) { return c.overlap > 0; });
            var pool = sameRow.length ? sameRow : list;
            pool.forEach(function (c) {
                var score = c.gap + (sameRow.length ? 0 : c.side * 2);
                if (!pick || score < pick.score) { c.score = score; pick = c; }
            });
        }
        return pick ? pick.el : null;
    }

    function firstOnScreen(all) {
        var top = all.filter(function (el) { var r = el.getBoundingClientRect(); return r.top >= 0 && r.top < window.innerHeight; });
        top.sort(function (p, q) {
            var a = p.getBoundingClientRect(), b = q.getBoundingClientRect();
            return (a.top - b.top) || (a.left - b.left);
        });
        return top[0] || all[0];
    }

    function goBack() {
        // a page can say exactly where Back goes (movie-frame.html does)
        if (typeof window.flmGoBack === 'function') { window.flmGoBack(); return; }
        var path = location.pathname.replace(/\/+$/, '');
        var atHome = path === '' || /\/(home|index)(\.html)?$/i.test(path);
        if (!atHome && history.length > 1) { history.back(); return; }
        if (!atHome) { location.href = '/home'; return; }
        // On the home page: leave the app
        try { if (window.webOS && webOS.platformBack) { webOS.platformBack(); return; } } catch (e) {}
        try { if (window.PalmSystem && PalmSystem.platformBack) { PalmSystem.platformBack(); return; } } catch (e) {}
        try { if (window.tizen && tizen.application) { tizen.application.getCurrentApplication().exit(); return; } } catch (e) {}
        try { window.close(); } catch (e) {}
    }

    document.addEventListener('keydown', function (e) {
        var k = e.keyCode;
        var active = document.activeElement;
        var typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && active.type !== 'button';

        if (k === KEY.BACK_LG || k === KEY.BACK_SAMSUNG || (k === KEY.ESC) || (k === KEY.BACKSPACE && !typing)) {
            e.preventDefault(); e.stopPropagation();
            if (typing) { active.blur(); return; }
            // close an open popup first if it has a close button
            var closers = document.querySelectorAll('[class*="modal"] [class*="close"],[class*="overlay"] [class*="close"],[class*="popup"] [class*="close"],[role="dialog"] [class*="close"]');
            for (var c = 0; c < closers.length; c++) {
                var cl = closers[c], r = cl.getBoundingClientRect();
                if (isVisible(cl) && r.top >= 0 && r.bottom <= window.innerHeight) { cl.click(); return; }
            }
            goBack();
            return;
        }

        var dir = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' }[k];
        if (typing && (dir === 'left' || dir === 'right')) return;   // move the text cursor

        if (dir) {
            e.preventDefault(); e.stopPropagation();
            var all = scope(candidates());
            if (!all.length) { window.scrollBy(0, dir === 'down' ? 300 : dir === 'up' ? -300 : 0); return; }
            if (!current || !document.contains(current) || !isVisible(current) || all.indexOf(current) < 0) {
                focusEl(firstOnScreen(all));
                return;
            }
            var next = best(current, all, dir);
            if (next) focusEl(next);
            else if (dir === 'up') window.scrollBy({ top: -400, behavior: 'smooth' });
            else if (dir === 'down') window.scrollBy({ top: 400, behavior: 'smooth' });
            return;
        }

        if (k === KEY.ENTER && current && !typing) {
            e.preventDefault(); e.stopPropagation();
            if (current.tagName === 'INPUT' || current.tagName === 'TEXTAREA') { current.focus(); return; }
            current.click();
        }
    }, true);

    // The Magic Remote pointer: highlight follows the pointer too
    document.addEventListener('mouseover', function (e) {
        var el = e.target.closest ? e.target.closest(SELECTOR) : null;
        if (el && isClickable(el) && el !== current) {
            if (current) current.classList.remove('flm-tv-focus');
            current = el;
            el.classList.add('flm-tv-focus');
        }
    }, true);

    // ── No internet message (LG / Samsung review checks this) ─────
    function offlineBox() {
        var box = document.getElementById('flmTvOffline');
        if (box) return box;
        box = document.createElement('div');
        box.id = 'flmTvOffline';
        box.innerHTML = '<div><h2>NO INTERNET CONNECTION</h2>' +
            '<p>FLM TV needs the internet. Check your TV\'s network connection.</p>' +
            '<button type="button">TRY AGAIN</button></div>';
        box.querySelector('button').addEventListener('click', function () { location.reload(); });
        document.body.appendChild(box);
        return box;
    }
    window.addEventListener('offline', function () {
        var b = offlineBox(); b.classList.add('show'); focusEl(b.querySelector('button'));
    });
    window.addEventListener('online', function () {
        var b = document.getElementById('flmTvOffline'); if (b) b.classList.remove('show');
    });
})();
