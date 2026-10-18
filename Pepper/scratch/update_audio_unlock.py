with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Enhance unlockAudio
old_unlock = """        var __audioUnlocked = false;
        function unlockAudio() {
          if (__audioUnlocked) return;
          __audioUnlocked = true;
          try {
            var silentAudio = new Audio();
            silentAudio.src =
              "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
            silentAudio.volume = 0.01;
            var p = silentAudio.play();
            if (p) {
              p.then(function () {
                silentAudio.pause();
              }).catch(function () {});
            }
          } catch (e) {}
        }
        document.addEventListener("click", unlockAudio, { passive: true });
        document.addEventListener("touchstart", unlockAudio, { passive: true });"""

new_unlock = """        var __audioUnlocked = false;
        var __sharedAudioCtx = null;
        function unlockAudio() {
          __audioUnlocked = true;
          try {
            if (!__sharedAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
              __sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (__sharedAudioCtx && __sharedAudioCtx.state === "suspended") {
              __sharedAudioCtx.resume();
            }
          } catch (e) {}
          try {
            var silentAudio = new Audio();
            silentAudio.src =
              "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
            silentAudio.volume = 0.01;
            var p = silentAudio.play();
            if (p) {
              p.then(function () {
                silentAudio.pause();
              }).catch(function () {});
            }
          } catch (e) {}
        }
        window.unlockAudio = unlockAudio;
        document.addEventListener("click", unlockAudio, { passive: true, capture: true });
        document.addEventListener("touchstart", unlockAudio, { passive: true, capture: true });
        document.addEventListener("pointerdown", unlockAudio, { passive: true, capture: true });"""

assert old_unlock in text, "old_unlock not found in index.html"
text = text.replace(old_unlock, new_unlock, 1)

# 2. In goToAtendimento, call unlockAudio()
old_goto = """        function goToAtendimento(event) {
          if (event) event.preventDefault();
          try {
            var resVid = document.getElementById("res-video");
            if (resVid) {
              resVid.pause();
              resVid.currentTime = 0;
              resVid.muted = true;
            }
            var allVids = document.querySelectorAll("#page-resultado video, #page-resultado audio");
            allVids.forEach(function (m) {
              try { m.pause(); m.muted = true; } catch (e) {}
            });
          } catch (e) {}"""

new_goto = """        function goToAtendimento(event) {
          if (event) event.preventDefault();
          try { unlockAudio(); } catch (e) {}
          try {
            var resVid = document.getElementById("res-video");
            if (resVid) {
              resVid.pause();
              resVid.currentTime = 0;
              resVid.muted = true;
            }
            var allVids = document.querySelectorAll("#page-resultado video, #page-resultado audio");
            allVids.forEach(function (m) {
              try { m.pause(); m.muted = true; } catch (e) {}
            });
          } catch (e) {}"""

assert old_goto in text, "old_goto not found in index.html"
text = text.replace(old_goto, new_goto, 1)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(text)

print("Audio unlock and goToAtendimento updated successfully!")
