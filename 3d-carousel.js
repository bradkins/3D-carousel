gsap.registerPlugin(Draggable, InertiaPlugin, Observer, ScrollTrigger);

function init3dImageCarousel() {
  let radius;
  let draggableInstance;
  let observerInstance;
  let spin;
  let tilt;
  let intro;
  let lastWidth = window.innerWidth;

  const wrap = document.querySelector('[data-3d-carousel-wrap]');
  if (!wrap) return;

  // Define the radius of your cylinder here
  const calcRadius = () => {
    radius = window.innerWidth * 0.6;
  }

  // Destroy function to reset everything on resize
  const destroy = () => {
    draggableInstance && draggableInstance.kill();
    observerInstance && observerInstance.kill();
    spin && spin.kill();
    tilt && tilt.kill();
    intro && intro.kill();
    ScrollTrigger.getAll().forEach(st => st.kill());
    const panels = wrap.querySelectorAll('[data-3d-carousel-panel]');
    gsap.set(panels, { clearProps: 'transform' });
    gsap.set(wrap, { clearProps: 'all' });
  };

  // Create function that sets the spin, drag, and rotation
  const create = () => {
    calcRadius();

    const panels = wrap.querySelectorAll('[data-3d-carousel-panel]');
    const content = wrap.querySelectorAll('[data-3d-carousel-content]');
    const proxy = document.createElement('div');
    const wrapProgress = gsap.utils.wrap(0, 1);
    const dragDistance = window.innerWidth * 3; // Control the snapiness on drag
    let startProg;

    // Position panels in 3D space
    panels.forEach(p =>
      p.style.transformOrigin = `50% 50% ${-radius}px`
    );

    // Infinite rotation of all panels
    spin = gsap.fromTo(
      panels,
      { rotationY: i => (i * 360) / panels.length },
      { rotationY: '-=360', duration: 120, ease: 'none', repeat: -1 }
    );

    // cheeky workaround to create some 'buffer' when scrolling back up
    spin.progress(1000);

    // Add blur effect based on rotation - ONLY AT THE BACK
    gsap.ticker.add(() => {
      panels.forEach((panel, i) => {
        // Get current rotation of this panel
        const rotation = gsap.getProperty(panel, 'rotationY');
        
        // Normalize rotation to 0-360
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        
        // Calculate blur: only blur when facing away (90° to 270°)
        // Maximum blur at 180° (directly back)
        let blurAmount = 0;
        if (normalizedRotation > 45 && normalizedRotation < 315) {
          // Calculate distance from 180° (the back)
          const distanceFrom180 = Math.abs(180 - normalizedRotation);
          // Blur increases as we approach 180°, decreases as we move away
          blurAmount = (1 - (distanceFrom180 / 135)) * 30; // Adjust the * 15 for more/less blur
        }
        
        // Apply blur to the content/image
        const img = panel.querySelector('.img-carousel__img');
        if (img) {
          img.style.filter = `blur(${blurAmount}px)`;
        }
      });
    });

    draggableInstance = Draggable.create(proxy, {
      trigger: wrap,
      type: 'x',
      inertia: true,
      allowNativeTouchScrolling: true,
      onPress() {
        // Subtle feedback on touch/mousedown of the wrap
        gsap.to(content, {
          clipPath: 'inset(0%)',
          duration: 0.3,
          ease: 'power4.out',
          overwrite: 'auto'
        });
        // Stop automatic spinning to prepare for drag
        gsap.killTweensOf(spin);
        spin.timeScale(0);
        startProg = spin.progress();
      },
      onDrag() {
        const p = startProg + (this.startX - this.x) / dragDistance;
        spin.progress(wrapProgress(p));
      },
      onThrowUpdate() {
        const p = startProg + (this.startX - this.x) / dragDistance;
        spin.progress(wrapProgress(p));
      },
      onRelease() {
        if (!this.tween || !this.tween.isActive()) {
          gsap.to(spin, { timeScale: 1, duration: 0.1 });
        }
        gsap.to(content, {
          clipPath: 'inset(0%)',
          duration: 0.5,
          ease: 'power4.out',
          overwrite: 'auto'
        });
      },
      onThrowComplete() {
        gsap.to(spin, { timeScale: 1, duration: 0.1 });
      }
    })[0];

    // Scroll-into-view animation
    intro = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: 'top 80%',
        end: 'bottom top',
        scrub: false,
        toggleActions: 'play resume play play'
      },
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        // Start tilt animation after intro completes
        tilt = gsap.fromTo(wrap,
          { rotation: -1 },
          {
            rotation: 1,
            duration: 8,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
          }
        );
      }
    });

    intro
      .fromTo(spin, { timeScale: 18 }, { timeScale: 1, duration: 2 })
      .fromTo(wrap, { scale: 0.5, rotation: 2 }, { scale: 1, rotation: -1, duration: 1.2 }, '<')
      .fromTo(content, { autoAlpha: 0 }, { autoAlpha: 1, stagger: { amount: 0.8, from: 'random' } }, '<');

    // While-scrolling feedback
    observerInstance = Observer.create({
      target: window,
      type: 'wheel,scroll,touch',
      onChangeY: self => {
        // Control how much scroll speed affects the rotation on scroll
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

  // First create on function call
  create();

  // Debounce function to use on resize events
  const debounce = (fn, ms) => {
    let t;
    return () => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  };

  // Whenever window resizes, first destroy, then re-init it all
  window.addEventListener('resize', debounce(() => {
    const newWidth = window.innerWidth;
    if (newWidth !== lastWidth) {
      lastWidth = newWidth;
      destroy();
      create();
      ScrollTrigger.refresh();
    }
  }, 200));
}

// Initialize 3D Image Carousel
document.addEventListener("DOMContentLoaded", () => {
  init3dImageCarousel();
});
