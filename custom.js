gsap.registerPlugin(Draggable, InertiaPlugin, Observer, ScrollTrigger);

function init3dImageCarousel() {
  let radius;
  let draggableInstance;
  let observerInstance;
  let spin;
  let tilt;
  let intro;
  let lastWidth = window.innerWidth;

  const wrap = document.querySelector("[data-3d-carousel-wrap]");
  if (!wrap) return;

  // Define the radius of your cylinder here
  const calcRadius = () => {
    radius = window.innerWidth * 0.6;
  };

  // Destroy function to reset everything on resize
  const destroy = () => {
    draggableInstance && draggableInstance.kill();
    observerInstance && observerInstance.kill();
    spin && spin.kill();
    tilt && tilt.kill();
    intro && intro.kill();
    ScrollTrigger.getAll().forEach((st) => st.kill());
    const panels = wrap.querySelectorAll("[data-3d-carousel-panel]");
    gsap.set(panels, { clearProps: "transform" });
    gsap.set(wrap, { clearProps: "all" });
  };

  // Create function that sets the spin, drag, and rotation
  const create = () => {
    calcRadius();

    const panels = wrap.querySelectorAll("[data-3d-carousel-panel]");
    const content = wrap.querySelectorAll("[data-3d-carousel-content]");
    const proxy = document.createElement("div");
    const wrapProgress = gsap.utils.wrap(0, 1);
    const dragDistance = window.innerWidth * 3;
    let startProg;
    let dragVelocity = 0;
    let isDragging = false;

    // Position panels in 3D space
    panels.forEach((p) => (p.style.transformOrigin = `50% 50% ${-radius}px`));

    // Infinite rotation of all panels
    spin = gsap.fromTo(
      panels,
      { rotationY: (i) => (i * 360) / panels.length },
      { rotationY: "-=360", duration: 120, ease: "none", repeat: -1 }
    );

    // cheeky workaround to create some 'buffer' when scrolling back up
    spin.progress(1000);

    // Add blur effect with throttling for better performance
    let lastBlurUpdate = 0;
    const blurUpdateInterval = 50;

    gsap.ticker.add(() => {
      const now = Date.now();

      if (now - lastBlurUpdate > blurUpdateInterval) {
        lastBlurUpdate = now;

        panels.forEach((panel, i) => {
          const rotation = gsap.getProperty(panel, "rotationY");
          const normalizedRotation = ((rotation % 360) + 360) % 360;

          let blurAmount = 0;
          if (normalizedRotation > 80 && normalizedRotation < 315) {
            const distanceFrom180 = Math.abs(180 - normalizedRotation);
            blurAmount = (1 - distanceFrom180 / 135) * 30;
          }

          // Apply blur to each individual screen
          const screens = panel.querySelectorAll(".img-carousel__screen");
          screens.forEach(screen => {
            screen.style.filter = `blur(${blurAmount}px)`;
          });
        });
      }
    });

    draggableInstance = Draggable.create(proxy, {
      trigger: wrap,
      type: "x",
      inertia: true,
      allowNativeTouchScrolling: true,
      onPress() {
        isDragging = true;
        gsap.killTweensOf(spin);
        spin.timeScale(0);
        startProg = spin.progress();
      },
      onDrag() {
        const p = startProg + (this.startX - this.x) / dragDistance;
        spin.progress(wrapProgress(p));
        // Track velocity during drag
        dragVelocity = (this.startX - this.x) / dragDistance;
      },
      onThrowUpdate() {
        const p = startProg + (this.startX - this.x) / dragDistance;
        spin.progress(wrapProgress(p));
      },
      onRelease() {
        if (!this.tween || !this.tween.isActive()) {
          // Simple case - no inertia, just resume
          gsap.to(spin, { timeScale: 1, duration: 0.1 });
        }
      },
      onThrowComplete() {
        isDragging = false;
        // Calculate direction based on drag velocity
        const direction = dragVelocity > 0 ? 1 : -1;
        const speed = Math.abs(dragVelocity) * 20;
        const clampedSpeed = gsap.utils.clamp(1, 5, speed);
        
        // Animate with directional momentum
        gsap.fromTo(
          spin,
          { timeScale: direction * clampedSpeed },
          {
            timeScale: direction,
            duration: 1.2,
            ease: "power2.out"
          }
        );
      }
    })[0];

    // Scroll-into-view animation
    intro = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top 80%",
        end: "bottom top",
        scrub: false,
        toggleActions: "play resume play play"
      },
      defaults: { ease: "expo.inOut" },
      onComplete: () => {
        tilt = gsap.fromTo(
          wrap,
          { rotation: -1 },
          {
            rotation: 1,
            duration: 8,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
          }
        );
      }
    });

    intro
      .fromTo(spin, { timeScale: 25 }, { timeScale: 1, duration: 2 })
      .fromTo(
        wrap,
        { scale: 0.5, rotation: 2 },
        { scale: 1, rotation: -1, duration: 1.2 },
        "<"
      )
      .fromTo(
        content,
        { autoAlpha: 0 },
        { autoAlpha: 1, stagger: { amount: 0.8, from: "random" } },
        "<"
      );

    // While-scrolling feedback - but not when dragging
    observerInstance = Observer.create({
      target: window,
      type: "wheel,scroll,touch",
      onChangeY: (self) => {
        // Skip if currently dragging
        if (isDragging) return;
        
        let v = gsap.utils.clamp(-60, 60, self.velocityY * 0.005);
        spin.timeScale(v);
        const resting = v < 0 ? -1 : 1;
        gsap.fromTo(
          { value: v },
          { value: v },
          {
            value: resting,
            duration: 1.2,
            onUpdate() {
              spin.timeScale(this.targets()[0].value);
            }
          }
        );
      }
    });
  };

  create();

  const debounce = (fn, ms) => {
    let t;
    return () => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  };

  window.addEventListener(
    "resize",
    debounce(() => {
      const newWidth = window.innerWidth;
      if (newWidth !== lastWidth) {
        lastWidth = newWidth;
        destroy();
        create();
        ScrollTrigger.refresh();
      }
    }, 200)
  );
}

document.addEventListener("DOMContentLoaded", () => {
  init3dImageCarousel();
});
