// ==========================================================================
// YASHVI GROUP MASTER HOLDINGS PORTAL - JAVASCRIPT LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initGhostFibers();
  initCounters();
  initMobileMenu();
  initNavbarScroll();
});

// ==========================================================================
// 1. React Bits <GhostFibers /> Component (WebGL2 Native Implementation)
// ==========================================================================
function initGhostFibers() {
  const container = document.getElementById('ghostFibersContainer');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    console.warn('WebGL2 not supported on this browser');
    return;
  }

  const hexToRgb = hex => {
    const value = hex.trim().replace(/^#/, '');
    const normalized = value.length === 3 ? value.replace(/./g, c => c + c) : value;
    const match = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    if (!match) return [1, 1, 1];
    return [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255];
  };

  const vertexShaderSrc = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const fragmentShaderSrc = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uLayers;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uLayerSpeed;
uniform float uTwist;
uniform float uTwistFrequency;
uniform float uTwistSpeed;
uniform float uLineFrequency;
uniform float uLineSpacing;
uniform float uLineSharpness;
uniform float uGlowFalloff;
uniform float uGlowIntensity;
uniform float uBrightness;
uniform float uBlueBoost;
uniform float uVignette;
uniform float uGrain;
uniform float uRotationSpeed;
uniform float uLightMode;
uniform vec3 uLineColor;
uniform vec3 uGlowColor;

out vec4 fragColor;

#define MAX_LAYERS 10

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

float grainHash(vec2 point) {
  point = floor(point);
  float hash = 52.9829189 * fract(dot(point, vec2(0.065, 0.005)));
  return fract(hash);
}

float layeredGrain(vec2 fragmentPixel) {
  vec2 point = mod(fragmentPixel + vec2(uTime * 30.0, -uTime * 21.0), 1024.0);
  vec2 rotated = mat2(0.8, -0.5, 0.5, 0.8) * point;
  float grain = 0.0;
  grain += 0.40 * grainHash(rotated);
  grain += 0.25 * grainHash(rotated * 2.0 + 17.0);
  grain += 0.20 * grainHash(rotated * 4.0 + 47.0);
  grain += 0.10 * grainHash(rotated * 8.0 + 113.0);
  grain += 0.05 * grainHash(rotated * 16.0 + 191.0);
  return grain;
}

void main() {
  vec2 resolution = max(uResolution, vec2(1.0));
  vec2 uv = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;
  float time = uTime * uSpeed;
  // Deep midnight slate background matching Yashvi Group palette #0B0F19
  vec3 backdrop = mix(vec3(0.043137, 0.058824, 0.098039), vec3(1.0), step(0.5, uLightMode));
  vec3 centerTone = max(uLineColor * 0.85567 - uGlowColor * 0.06186, vec3(0.0));
  vec3 cloudTone = uLineColor * 0.19588 + uGlowColor * 0.2268;
  vec2 p = uv;
  p /= max(uScale, 0.05);
  p = rotate2d(radians(uRotation) + time * uRotationSpeed) * p;
  vec3 color = vec3(0.0);
  float fiberField = 0.0;

  for (int index = 0; index < MAX_LAYERS; index++) {
    float fi = float(index) + 1.0;
    if (fi > uLayers) break;

    p += uWaveAmplitude * sin(p.yx * fi * uWaveFrequency + time * (uWaveSpeed + fi * uLayerSpeed));

    float radius = length(p);
    float polarAngle = atan(p.y, p.x);
    polarAngle += sin(radius * uTwistFrequency - time * uTwistSpeed + fi) * uTwist;
    p = vec2(cos(polarAngle), sin(polarAngle)) * radius;

    float lines = abs(sin(p.x * (uLineFrequency + fi * uLineSpacing) + sin(p.y * 3.0 + time)));
    lines = pow(max(0.0, 1.0 - lines), uLineSharpness);
    fiberField += lines / fi;
    color += uLineColor * lines / fi;

    float glow = exp(-uGlowFalloff * abs(sin(p.x * 3.0 + time + fi)));
    color += uGlowColor * glow * uGlowIntensity / (fi * 2.0);
  }

  float center = exp(-2.2 * dot(uv, uv));
  color += centerTone * center;

  float cloud = exp(-1.5 * length(uv + vec2(sin(time * 0.3) * 0.25, cos(time * 0.25) * 0.18)));
  color += cloudTone * cloud;

  float vignette = 1.0 - smoothstep(0.35, 1.45, length(uv));
  color *= mix(1.0 - uVignette, 1.0, vignette);
  color = 1.0 - exp(-color * uBrightness);
  color.b *= uBlueBoost;

  vec3 outputColor;
  if (uLightMode > 0.5) {
    float edgeFade = mix(1.0 - uVignette, 1.0, vignette);
    float fibers = pow(smoothstep(0.12, 1.05, fiberField) * edgeFade, 1.5);
    float atmosphere = (center * 0.025 + cloud * 0.015) * edgeFade;
    vec3 fiberInk = mix(backdrop, uLineColor, 0.52);
    vec3 airColor = mix(backdrop, uGlowColor, 0.16);

    outputColor = mix(backdrop, airColor, atmosphere);
    outputColor = mix(outputColor, fiberInk, fibers * 0.3);
  } else {
    outputColor = backdrop + color;
  }

  float noise = (layeredGrain(gl_FragCoord.xy) - 0.5) * uGrain;
  outputColor = clamp(outputColor + noise, 0.0, 1.0);
  fragColor = vec4(outputColor, 1.0);
}
`;

  function createShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = createShader(gl.VERTEX_SHADER, vertexShaderSrc);
  const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  // Full-screen Triangle geometry covering WebGL normalized coordinates
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     3, -1,
    -1,  3
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Uniform locations mapping
  const u = {
    uResolution: gl.getUniformLocation(program, 'uResolution'),
    uTime: gl.getUniformLocation(program, 'uTime'),
    uSpeed: gl.getUniformLocation(program, 'uSpeed'),
    uScale: gl.getUniformLocation(program, 'uScale'),
    uRotation: gl.getUniformLocation(program, 'uRotation'),
    uRotationSpeed: gl.getUniformLocation(program, 'uRotationSpeed'),
    uLayers: gl.getUniformLocation(program, 'uLayers'),
    uWaveAmplitude: gl.getUniformLocation(program, 'uWaveAmplitude'),
    uWaveFrequency: gl.getUniformLocation(program, 'uWaveFrequency'),
    uWaveSpeed: gl.getUniformLocation(program, 'uWaveSpeed'),
    uLayerSpeed: gl.getUniformLocation(program, 'uLayerSpeed'),
    uTwist: gl.getUniformLocation(program, 'uTwist'),
    uTwistFrequency: gl.getUniformLocation(program, 'uTwistFrequency'),
    uTwistSpeed: gl.getUniformLocation(program, 'uTwistSpeed'),
    uLineFrequency: gl.getUniformLocation(program, 'uLineFrequency'),
    uLineSpacing: gl.getUniformLocation(program, 'uLineSpacing'),
    uLineSharpness: gl.getUniformLocation(program, 'uLineSharpness'),
    uGlowFalloff: gl.getUniformLocation(program, 'uGlowFalloff'),
    uGlowIntensity: gl.getUniformLocation(program, 'uGlowIntensity'),
    uBrightness: gl.getUniformLocation(program, 'uBrightness'),
    uBlueBoost: gl.getUniformLocation(program, 'uBlueBoost'),
    uVignette: gl.getUniformLocation(program, 'uVignette'),
    uGrain: gl.getUniformLocation(program, 'uGrain'),
    uLightMode: gl.getUniformLocation(program, 'uLightMode'),
    uLineColor: gl.getUniformLocation(program, 'uLineColor'),
    uGlowColor: gl.getUniformLocation(program, 'uGlowColor')
  };

  // Configure for Yashvi Group brand palette: Electric Cyan & Cobalt
  const lineRgb = hexToRgb('#0E1D3B');
  const glowRgb = hexToRgb('#2563EB');

  gl.uniform3f(u.uLineColor, lineRgb[0], lineRgb[1], lineRgb[2]);
  gl.uniform3f(u.uGlowColor, glowRgb[0], glowRgb[1], glowRgb[2]);
  gl.uniform1f(u.uSpeed, 0.2);
  gl.uniform1f(u.uScale, 2.0);
  gl.uniform1f(u.uRotation, 0.0);
  gl.uniform1f(u.uRotationSpeed, 0.25);
  gl.uniform1f(u.uLayers, 4.0);
  gl.uniform1f(u.uWaveAmplitude, 0.015);
  gl.uniform1f(u.uWaveFrequency, 3.0);
  gl.uniform1f(u.uWaveSpeed, 0.15);
  gl.uniform1f(u.uLayerSpeed, 0.08);
  gl.uniform1f(u.uTwist, 0.1);
  gl.uniform1f(u.uTwistFrequency, 5.0);
  gl.uniform1f(u.uTwistSpeed, 1.2);
  gl.uniform1f(u.uLineFrequency, 5.0);
  gl.uniform1f(u.uLineSpacing, 2.0);
  gl.uniform1f(u.uLineSharpness, 16.0);
  gl.uniform1f(u.uGlowFalloff, 10.0);
  gl.uniform1f(u.uGlowIntensity, 1.6);
  gl.uniform1f(u.uBrightness, 2.0);
  gl.uniform1f(u.uBlueBoost, 1.35);
  gl.uniform1f(u.uVignette, 0.8);
  gl.uniform1f(u.uGrain, 0.05);
  gl.uniform1f(u.uLightMode, 0.0);

  function resize() {
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 0.5), 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(u.uResolution, width, height);
    }
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  let startTime = performance.now();
  let rafId;

  function render(time) {
    const elapsed = (time - startTime) * 0.001;
    gl.uniform1f(u.uTime, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    rafId = requestAnimationFrame(render);
  }

  rafId = requestAnimationFrame(render);
}

// 2. Animated Stats Counters with Intersection Observer
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        counters.forEach(counter => {
          const target = +counter.getAttribute('data-target');
          let count = 0;
          const speed = target > 1000 ? target / 50 : 1;

          const updateCount = () => {
            count += speed;
            if (count < target) {
              counter.innerText = Math.ceil(count).toLocaleString();
              requestAnimationFrame(updateCount);
            } else {
              counter.innerText = target.toLocaleString();
            }
          };

          updateCount();
        });
      }
    });
  }, { threshold: 0.3 });

  const metricsSection = document.querySelector('.metrics-section');
  if (metricsSection) {
    observer.observe(metricsSection);
  }
}

// 3. Mobile Navigation Menu Toggle
function initMobileMenu() {
  const toggleBtn = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = toggleBtn.querySelector('i');
      if (navMenu.classList.contains('open')) {
        icon.className = 'ph ph-x';
      } else {
        icon.className = 'ph ph-list';
      }
    });

    // Close when clicking any link inside the mobile drawer
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'ph ph-list';
      });
    });
  }
}

// 4. Navbar Scroll Glass Effect
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.style.borderBottomColor = 'rgba(6, 182, 212, 0.25)';
      navbar.style.background = 'rgba(11, 15, 25, 0.96)';
    } else {
      navbar.style.borderBottomColor = 'rgba(255, 255, 255, 0.08)';
      navbar.style.background = 'rgba(11, 15, 25, 0.92)';
    }
  });
}

// 5. Division Button Selector in Universal Lead Form
window.setCategory = function (buttonElement, categoryName) {
  const buttons = document.querySelectorAll('.div-btn');
  buttons.forEach(b => b.classList.remove('active'));
  buttonElement.classList.add('active');

  const hiddenInput = document.getElementById('inquiryTypeInput');
  if (hiddenInput) {
    hiddenInput.value = categoryName;
  }
};

// Helper to trigger category selection from external buttons
window.selectInquiryType = function (typeKey) {
  const mapping = {
    'sponsorship': 'Event Sponsorship & Stalls',
    'digital': 'Digital Marketing & Studio',
    'news': 'News Tip & Media Coverage',
    'hospitality': 'Hospitality & Corporate Stays',
    'general': 'General / CSR Inquiries'
  };

  const categoryName = mapping[typeKey] || 'General / CSR Inquiries';
  const matchingBtn = document.querySelector(`.div-btn[data-category="${typeKey}"]`);

  if (matchingBtn) {
    window.setCategory(matchingBtn, categoryName);
  }

  // Smooth scroll to contact section
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const nameInput = document.getElementById('fullName');
      if (nameInput) nameInput.focus();
    }, 600);
  }
};

// 6. Handle Form Submit with In-page Feedback
window.handleFormSubmit = function (event) {
  event.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const successBanner = document.getElementById('successBanner');
  const form = document.getElementById('leadForm');

  if (submitBtn) {
    submitBtn.innerHTML = '<span>Transmitting...</span> <i class="ph ph-spinner ph-spin"></i>';
    submitBtn.disabled = true;
  }

  // Simulate transmission
  setTimeout(() => {
    if (submitBtn) {
      submitBtn.innerHTML = '<span>Submitted Successfully</span> <i class="ph-fill ph-check"></i>';
      submitBtn.style.background = '#10B981';
      submitBtn.style.borderColor = '#10B981';
    }

    if (successBanner) {
      successBanner.style.display = 'flex';
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    form.reset();
  }, 800);
};
