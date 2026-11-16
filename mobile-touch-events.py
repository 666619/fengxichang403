# -*- coding: utf-8 -*-
"""用 Playwright + 本机 Edge，以 390x844 移动端触摸环境跑三个页面并截图"""
import json, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
SHOT = ROOT / "截图"
SHOT.mkdir(exist_ok=True)

# 注入到每个页面的手势库：内部自己 querySelector，保证 Touch.target 一定是 EventTarget
LIB = r"""
(function () {
  function mk(el, id, x, y) {
    return new Touch({ identifier: id, target: el, clientX: x, clientY: y,
                       pageX: x, pageY: y, screenX: x, screenY: y,
                       radiusX: 12, radiusY: 12, force: 1 });
  }
  function fire(el, type, touches, changed) {
    el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true,
      touches: touches, targetTouches: touches, changedTouches: changed }));
  }
  window.fxcSwipe = function (sel, x, y, dx, dy, steps) {
    var el = document.querySelector(sel);
    var t0 = mk(el, 0, x, y);
    fire(el, 'touchstart', [t0], [t0]);
    for (var i = 1; i <= steps; i++) {
      var t = mk(el, 0, x + dx * i / steps, y + dy * i / steps);
      fire(el, 'touchmove', [t], [t]);
    }
    var tEnd = mk(el, 0, x + dx, y + dy);
    fire(el, 'touchend', [], [tEnd]);
    return true;
  };
  window.fxcPinch = function (sel, cx, cy, d0, d1, steps) {
    var el = document.querySelector(sel);
    function pair(d) { return [mk(el, 1, cx - d / 2, cy), mk(el, 2, cx + d / 2, cy)]; }
    var p0 = pair(d0);
    fire(el, 'touchstart', p0, [p0[1]]);
    for (var i = 1; i <= steps; i++) { var p = pair(d0 + (d1 - d0) * i / steps); fire(el, 'touchmove', p, [p[1]]); }
    var pe = pair(d1);
    fire(el, 'touchend', [], [pe[1]]);
    return true;
  };
  window.fxcDoubleTap = function (sel, x, y) {
    var el = document.querySelector(sel);
    for (var k = 0; k < 2; k++) {
      var t = mk(el, 0, x, y);
      fire(el, 'touchstart', [t], [t]);
      fire(el, 'touchend', [], [t]);
    }
    return true;
  };
})();
"""

results = {}
with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844}, device_scale_factor=3,
        has_touch=True, is_mobile=True,
        user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 "
                    "Mobile/15E148 Safari/604.1"))
    ctx.add_init_script(LIB)
    page = ctx.new_page()

    errors = []
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    def shot(name):
        page.screenshot(path=str(SHOT / name))

    # ---------------- 1. 手势卡片 ----------------
    page.goto((ROOT / "mobile-gesture.html").as_uri())
    page.wait_for_timeout(700)
    shot("01-手势卡片-初始.png")
    results["gesture_init"] = page.evaluate("""() => ({
        counter: document.getElementById('fxcCounter').textContent,
        touchAction: getComputedStyle(document.getElementById('fxcViewport')).touchAction,
        vw: document.getElementById('fxcViewport').clientWidth })""")

    # 阈值内小滑动（-25px）：不切换
    page.evaluate("fxcSwipe('#fxcViewport', 300, 400, -25, 0, 6)")
    page.wait_for_timeout(420)
    results["gesture_tiny_swipe"] = page.evaluate("document.getElementById('fxcCounter').textContent")

    # 左滑 160px → 第 2 张
    page.evaluate("fxcSwipe('#fxcViewport', 320, 400, -160, 0, 12)")
    page.wait_for_timeout(420)
    results["gesture_swipe1"] = page.evaluate("document.getElementById('fxcCounter').textContent")
    shot("02-手势卡片-左滑到第2张.png")

    # 冷却内立刻再滑（同一帧内连发两次）→ 只该再走一张，不能跳两张
    page.evaluate("""() => {
        fxcSwipe('#fxcViewport', 320, 400, -160, 0, 12);
        fxcSwipe('#fxcViewport', 320, 400, -160, 0, 12);
    }""")
    results["gesture_cooldown_block"] = page.evaluate("document.getElementById('fxcCounter').textContent")

    # 冷却过后再滑两次 → 第 4 张
    for _ in range(2):
        page.wait_for_timeout(380)
        page.evaluate("fxcSwipe('#fxcViewport', 320, 400, -160, 0, 12)")
        page.wait_for_timeout(320)
    results["gesture_to_last"] = page.evaluate("document.getElementById('fxcCounter').textContent")

    # 最后一张继续左滑 → 边界提示
    page.evaluate("fxcSwipe('#fxcViewport', 320, 400, -160, 0, 12)")
    page.wait_for_timeout(320)
    results["gesture_edge"] = page.evaluate("""() => ({
        counter: document.getElementById('fxcCounter').textContent,
        toast: document.getElementById('fxcToast').textContent,
        toastShown: document.getElementById('fxcToast').className.indexOf('fxc_show') > -1 })""")
    shot("03-手势卡片-边界提示.png")

    # 回到第一张后再右滑 → 边界提示
    page.evaluate("window.scrollTo(0,0)")
    for _ in range(4):
        page.wait_for_timeout(380)
        page.evaluate("fxcSwipe('#fxcViewport', 80, 400, 160, 0, 12)")
        page.wait_for_timeout(320)
    results["gesture_first_edge"] = page.evaluate("""() => ({
        counter: document.getElementById('fxcCounter').textContent,
        toast: document.getElementById('fxcToast').textContent })""")
    results["gesture_scroll"] = page.evaluate("({h: document.body.scrollHeight, vh: innerHeight})")

    # ---------------- 2. 图片查看器 ----------------
    page.goto((ROOT / "mobile-zoom.html").as_uri())
    page.wait_for_timeout(900)
    shot("04-图片查看器-1x.png")
    results["zoom_init"] = page.evaluate("""() => {
        var st = document.getElementById('fxcStage');
        var cs = getComputedStyle(st);
        return { badge: document.getElementById('fxcBadge').textContent,
                 touchAction: cs.touchAction, overflow: cs.overflow,
                 transform: document.getElementById('fxcWrap').style.transform,
                 imgW: document.getElementById('fxcWrap').style.width,
                 stageH: st.clientHeight };
    }""")

    # 双指张开 90 → 230px
    page.evaluate("""() => { var r = document.getElementById('fxcStage').getBoundingClientRect();
        fxcPinch('#fxcStage', r.left + r.width/2, r.top + r.height/2, 90, 230, 14); }""")
    page.wait_for_timeout(500)
    results["zoom_pinch"] = page.evaluate("""() => ({ badge: document.getElementById('fxcBadge').textContent,
        transform: document.getElementById('fxcWrap').style.transform })""")
    shot("05-图片查看器-双指放大.png")

    # 放大后拖动
    page.evaluate("fxcSwipe('#fxcStage', 200, 420, -80, -90, 12)")
    page.wait_for_timeout(400)
    results["zoom_pan"] = page.evaluate("document.getElementById('fxcWrap').style.transform")
    shot("06-图片查看器-拖动后.png")

    # 双击 2x → 1x → 2x
    page.evaluate("""() => { var r = document.getElementById('fxcStage').getBoundingClientRect();
        fxcDoubleTap('#fxcStage', r.left + 150, r.top + 380); }""")
    page.wait_for_timeout(500)
    results["zoom_dbl1"] = page.evaluate("document.getElementById('fxcBadge').textContent")
    page.evaluate("""() => { var r = document.getElementById('fxcStage').getBoundingClientRect();
        fxcDoubleTap('#fxcStage', r.left + 150, r.top + 380); }""")
    page.wait_for_timeout(500)
    results["zoom_dbl2"] = page.evaluate("document.getElementById('fxcBadge').textContent")
    shot("07-图片查看器-双击2x.png")

    # 回 1x 后拖动：应被 clamp 夹回居中（transform 与重置后一致）
    page.click("#fxcReset")
    page.wait_for_timeout(400)
    base = page.evaluate("document.getElementById('fxcWrap').style.transform")
    page.evaluate("fxcSwipe('#fxcStage', 200, 420, -120, 0, 10)")
    page.wait_for_timeout(420)
    after = page.evaluate("document.getElementById('fxcWrap').style.transform")
    results["zoom_1x_clamp"] = {"base": base, "after_pan": after, "same": base == after}

    # 横屏：先双击到 2x，再旋转，检查倍数与位置是否保留
    page.evaluate("""() => { var r = document.getElementById('fxcStage').getBoundingClientRect();
        fxcDoubleTap('#fxcStage', r.left + 200, r.top + 300); }""")
    page.wait_for_timeout(500)
    results["zoom_before_rotate"] = page.evaluate("document.getElementById('fxcBadge').textContent")
    page.set_viewport_size({"width": 844, "height": 390})
    page.wait_for_timeout(800)
    results["zoom_rotate"] = page.evaluate("""() => ({ badge: document.getElementById('fxcBadge').textContent,
        transform: document.getElementById('fxcWrap').style.transform })""")
    shot("08-图片查看器-横屏2x.png")

    # ---------------- 3. 摇一摇 ----------------
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto((ROOT / "mobile-sensor.html").as_uri())
    page.wait_for_timeout(600)
    shot("09-摇一摇-检测中.png")
    page.wait_for_timeout(4200)
    results["sensor_watchdog"] = page.evaluate("""() => ({
        status: document.getElementById('fxcStatus').textContent,
        alertHidden: document.getElementById('fxcAlert').hidden,
        btn: document.getElementById('fxcFallback').textContent })""")
    shot("10-摇一摇-设备不支持降级.png")

    page.click("#fxcFallback")
    page.wait_for_timeout(600)
    results["sensor_fallback"] = page.evaluate("""() => ({
        dish: document.getElementById('fxcDishName').textContent,
        tag: document.getElementById('fxcDishTag').textContent })""")
    shot("11-摇一摇-降级抽取结果.png")

    # 注入 devicemotion 事件：模拟摇动
    page.evaluate("""() => {
        function shake(a) { window.dispatchEvent(new DeviceMotionEvent('devicemotion', {
            accelerationIncludingGravity: { x: a, y: 4, z: 12 },
            acceleration: { x: a, y: 0, z: 4 } })); }
        shake(20); shake(26); shake(-22);
    }""")
    page.wait_for_timeout(400)
    results["sensor_shake"] = page.evaluate("""() => ({
        g: document.getElementById('fxcG').textContent,
        status: document.getElementById('fxcStatus').textContent,
        dish: document.getElementById('fxcDishName').textContent,
        alertHidden: document.getElementById('fxcAlert').hidden })""")
    shot("12-摇一摇-模拟摇动结果.png")

    # 冷却：1.5s 内 5 次摇动只应触发一次
    results["sensor_cooldown"] = page.evaluate("""() => {
        var n = 0, el = document.getElementById('fxcDishName');
        var ob = new MutationObserver(function () { n++; });
        ob.observe(el, { childList: true, characterData: true, subtree: true });
        function shake(a) { window.dispatchEvent(new DeviceMotionEvent('devicemotion', {
            accelerationIncludingGravity: { x: a, y: 4, z: 12 }, acceleration: { x: a, y: 0, z: 4 } })); }
        for (var i = 0; i < 5; i++) { shake(i % 2 ? 24 : -24); }
        return new Promise(function (res) { setTimeout(function () { res(n); }, 200); });
    }""")

    results["console_errors"] = errors
    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))
