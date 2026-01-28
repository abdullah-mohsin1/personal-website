/* Space shader background adapted from Matthias Hurrle (@atzedent) */
(() => {
  const canvas = document.getElementById('space-canvas');
  const source = document.getElementById('space-shader');
  if (!canvas || !source) return;

  // This shader is expensive at retina/full-res. Render at a reduced DPR for smoothness.
  const resolutionFactor = 0.32; // tweak 0.32 - 1.0
  const targetFps = 30; // tweak 24 - 60

  let dpr = Math.max(1, resolutionFactor * (window.devicePixelRatio || 1));
  let frameId;
  let renderer;
  let pointers;
  let lastFrame = 0;
  let smoothPointer = [0, 0];
  let smoothCoords = [0, 0];

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const easeInOutQuart = (x) =>
    x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;

  function resize() {
    const { innerWidth: width, innerHeight: height } = window;
    dpr = Math.max(1, resolutionFactor * (window.devicePixelRatio || 1));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    if (renderer) renderer.updateScale(dpr);
  }

  function loop(now) {
    // Simple frame cap to reduce GPU load on high-res screens.
    const minDelta = 1000 / targetFps;
    if (now - lastFrame < minDelta) {
      frameId = requestAnimationFrame(loop);
      return;
    }
    lastFrame = now;

    const target = pointers.first;
    const dx = target[0] - smoothPointer[0];
    const dy = target[1] - smoothPointer[1];
    const dist = Math.hypot(dx, dy);
    const maxDist = Math.max(canvas.width, canvas.height);
    const t = easeInOutQuart(clamp(dist / maxDist, 0, 1));
    const step = 0.1 + 0.4 * t;
    smoothPointer[0] += dx * step;
    smoothPointer[1] += dy * step;

    const coords = pointers.coords;
    smoothCoords[0] = smoothPointer[0];
    smoothCoords[1] = smoothPointer[1];

    renderer.updateMouse(smoothPointer);
    renderer.updatePointerCount(pointers.count);
    renderer.updatePointerCoords(smoothCoords);
    renderer.updateMove(pointers.move);
    renderer.render(now);
    frameId = requestAnimationFrame(loop);
  }

  function init() {
    renderer = new Renderer(canvas, dpr);
    pointers = new PointerHandler(canvas, dpr);

    resize();
    renderer.setup();
    renderer.init();

    if (renderer.test(source.textContent) === null) {
      renderer.updateShader(source.textContent);
    }
    cancelAnimationFrame(frameId);
    loop(0);
    window.addEventListener('resize', resize);
  }

  class Renderer {
    #vertexSrc = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}";
    #fragmtSrc = "#version 300 es\nprecision highp float;\nout vec4 O;\nuniform float time;\nuniform vec2 resolution;\nvoid main() {\n\tvec2 uv=gl_FragCoord.xy/resolution;\n\tO=vec4(uv,sin(time)*.5+.5,1);\n}";
    #vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
    constructor(canvas, scale) {
      this.canvas = canvas;
      this.scale = scale;
      this.gl = canvas.getContext('webgl2');
      this.gl.viewport(0, 0, canvas.width, canvas.height);
      this.shaderSource = this.#fragmtSrc;
      this.mouseMove = [0, 0];
      this.mouseCoords = [0, 0];
      this.pointerCoords = [0, 0];
      this.nbrOfPointers = 0;
    }
    updateShader(source) {
      this.reset();
      this.shaderSource = source;
      this.setup();
      this.init();
    }
    updateMove(deltas) {
      this.mouseMove = deltas;
    }
    updateMouse(coords) {
      this.mouseCoords = coords;
    }
    updatePointerCoords(coords) {
      this.pointerCoords = coords;
    }
    updatePointerCount(nbr) {
      this.nbrOfPointers = nbr;
    }
    updateScale(scale) {
      this.scale = scale;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    compile(shader, source) {
      const gl = this.gl;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
      }
    }
    test(source) {
      let result = null;
      const gl = this.gl;
      const shader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        result = gl.getShaderInfoLog(shader);
      }
      if (gl.getShaderParameter(shader, gl.DELETE_STATUS)) {
        gl.deleteShader(shader);
      }
      return result;
    }
    reset() {
      const { gl, program, vs, fs } = this;
      if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;
      if (gl.getShaderParameter(vs, gl.DELETE_STATUS)) {
        gl.detachShader(program, vs);
        gl.deleteShader(vs);
      }
      if (gl.getShaderParameter(fs, gl.DELETE_STATUS)) {
        gl.detachShader(program, fs);
        gl.deleteShader(fs);
      }
      gl.deleteProgram(program);
    }
    createCubeMap() {
      const { gl } = this;
      const cubeMap = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

      const imgpath = 'https://assets.codepen.io/4386748';
      const faces = [
        [gl.TEXTURE_CUBE_MAP_POSITIVE_X, '01posx.jpg'],
        [gl.TEXTURE_CUBE_MAP_NEGATIVE_X, '01negx.jpg'],
        [gl.TEXTURE_CUBE_MAP_POSITIVE_Y, '01posy.jpg'],
        [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, '01negy.jpg'],
        [gl.TEXTURE_CUBE_MAP_POSITIVE_Z, '01posz.jpg'],
        [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, '01negz.jpg'],
      ];

      for (const [target, url] of faces) {
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 512;
        const height = 512;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
          gl.texImage2D(target, level, internalFormat, format, type, image);
        };
        image.src = `${imgpath}/${url}?width=512&height=512&format=auto`;
      }
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
    setup() {
      const gl = this.gl;
      this.createCubeMap();
      this.vs = gl.createShader(gl.VERTEX_SHADER);
      this.fs = gl.createShader(gl.FRAGMENT_SHADER);
      this.compile(this.vs, this.#vertexSrc);
      this.compile(this.fs, this.shaderSource);
      this.program = gl.createProgram();
      gl.attachShader(this.program, this.vs);
      gl.attachShader(this.program, this.fs);
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(this.program));
      }
    }
    init() {
      const { gl, program } = this;
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#vertices), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      program.resolution = gl.getUniformLocation(program, 'resolution');
      program.time = gl.getUniformLocation(program, 'time');
      program.move = gl.getUniformLocation(program, 'move');
      program.touch = gl.getUniformLocation(program, 'touch');
      program.pointerCount = gl.getUniformLocation(program, 'pointerCount');
      program.pointers = gl.getUniformLocation(program, 'pointers');
      program.cubeMap = gl.getUniformLocation(program, 'cubeMap');
    }
    render(now = 0) {
      const { gl, program, buffer, canvas, mouseMove, mouseCoords, pointerCoords, nbrOfPointers } = this;
      if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.uniform2f(program.resolution, canvas.width, canvas.height);
      gl.uniform1f(program.time, now * 1e-3);
      gl.uniform2f(program.move, ...mouseMove);
      gl.uniform2f(program.touch, ...mouseCoords);
      gl.uniform1i(program.pointerCount, nbrOfPointers);
      gl.uniform2fv(program.pointers, pointerCoords);
      gl.uniform1i(program.cubeMap, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  class PointerHandler {
    constructor(canvas, scale) {
      this.canvas = canvas;
      this.scale = scale;
      this.active = false;
      this.pointers = new Map();
      this.lastCoords = [0, 0];
      this.moves = [0, 0];

      const shouldIgnore = (e) => {
        const t = e.target;
        if (!t || !(t instanceof Element)) return false;
        // Don't start background-drag when interacting with UI controls.
        return Boolean(t.closest('a,button,input,textarea,select,label'));
      };

      const mapToCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * this.getScale();
        const y = (rect.height - (e.clientY - rect.top)) * this.getScale();
        return [x, y];
      };

      window.addEventListener(
        'pointerdown',
        (e) => {
          if (shouldIgnore(e)) return;
          this.active = true;
          this.pointers.set(e.pointerId, mapToCanvas(e));
        },
        { capture: true }
      );

      const end = (e) => {
        if (this.count === 1) this.lastCoords = this.first;
        this.pointers.delete(e.pointerId);
        this.active = this.pointers.size > 0;
      };

      window.addEventListener('pointerup', end, { capture: true });
      window.addEventListener('pointercancel', end, { capture: true });

      window.addEventListener(
        'pointermove',
        (e) => {
          if (shouldIgnore(e)) return;
          // Allow hover-based movement without holding the mouse down.
          if (!this.pointers.has(e.pointerId)) {
            this.pointers.set(e.pointerId, mapToCanvas(e));
          }
          this.active = true;
          this.lastCoords = [e.clientX, e.clientY];
          this.pointers.set(e.pointerId, mapToCanvas(e));
          this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
        },
        { capture: true }
      );
    }
    getScale() {
      return this.scale;
    }
    updateScale(scale) {
      this.scale = scale;
    }
    get count() {
      return this.pointers.size;
    }
    get move() {
      return this.moves;
    }
    get coords() {
      return this.pointers.size > 0
        ? Array.from(this.pointers.values()).map((p) => [...p]).flat()
        : [0, 0];
    }
    get first() {
      return this.pointers.values().next().value || this.lastCoords;
    }
  }

  init();
})();
