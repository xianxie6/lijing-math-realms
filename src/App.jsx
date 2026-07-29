import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { Compass, Crosshair, Pause, Play, X } from "@phosphor-icons/react";
import "@fontsource-variable/noto-serif-sc";
import "@fontsource/ibm-plex-mono/400.css";
import "./styles.css";

const OBSERVATIONS = [
  {
    id: "gravity",
    index: "A–01",
    title: "引力的草图",
    eyebrow: "GRAVITATIONAL STUDY",
    glyph: "◎",
    position: [-2.2, 1.02, 1.05],
    formula: "∇ · g = −4πGρ",
    description:
      "质量没有发出命令，只是改变了周围的几何。把指针缓慢移过天体，观察轨道如何重新选择方向。",
  },
  {
    id: "fourier",
    index: "A–02",
    title: "频率的潮汐",
    eyebrow: "FOURIER FIELD",
    glyph: "∿",
    position: [-1.28, -1.35, 1.25],
    formula: "f̂(ξ) = ∫ f(x)e⁻²πⁱˣξ dx",
    description:
      "一段复杂的潮汐，可以拆成许多简单的波。轨道上的亮点正以不同频率穿过同一片夜色。",
  },
  {
    id: "kakeya",
    index: "B–07",
    title: "方向的容器",
    eyebrow: "KAKEYA GEOMETRY",
    glyph: "△",
    position: [2.65, 0.78, 0.35],
    formula: "dimₕ K = dimₘ K = 3",
    description:
      "一个集合可以几乎没有体积，却容纳所有方向。拖动视线，寻找那些在深度里交叠的细线。",
  },
  {
    id: "godel",
    index: "C–00",
    title: "未完的证明",
    eyebrow: "INCOMPLETE LOGIC",
    glyph: "⌁",
    position: [0.65, -1.86, 1.65],
    formula: "G ↔ ¬Prov(⌜G⌝)",
    description:
      "任何足够丰富的形式系统，都留有无法在自身内部抵达的句子。这里的最后一条轨道不会闭合。",
  },
];

const MODES = [
  { id: "observe", label: "观测" },
  { id: "drift", label: "漂移" },
  { id: "trace", label: "描轨" },
];

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function StarField({ paused, mode }) {
  const nearRef = useRef();
  const farRef = useRef();
  const fields = useMemo(() => {
    const random = seededRandom(7741);
    const makeField = (count, radius, depth) => {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const angle = random() * Math.PI * 2;
        const r = Math.pow(random(), 0.62) * radius;
        positions[i * 3] = Math.cos(angle) * r;
        positions[i * 3 + 1] = Math.sin(angle) * r * 0.58;
        positions[i * 3 + 2] = (random() - 0.5) * depth;
      }
      return positions;
    };
    return {
      far: makeField(1600, 11, 8),
      near: makeField(620, 8, 5),
    };
  }, []);

  useFrame((state, delta) => {
    if (!paused) {
      farRef.current.rotation.z += delta * (mode === "drift" ? 0.009 : 0.003);
      nearRef.current.rotation.z -= delta * (mode === "drift" ? 0.018 : 0.006);
    }
    nearRef.current.position.x = THREE.MathUtils.lerp(
      nearRef.current.position.x,
      state.pointer.x * 0.18,
      0.025,
    );
    nearRef.current.position.y = THREE.MathUtils.lerp(
      nearRef.current.position.y,
      state.pointer.y * 0.12,
      0.025,
    );
  });

  return (
    <>
      <points ref={farRef} position={[0, 0, -4]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fields.far, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#a9bbca"
          size={0.012}
          transparent
          opacity={0.48}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <points ref={nearRef} position={[0, 0, -1]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fields.near, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ead9af"
          size={0.018}
          transparent
          opacity={0.72}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </>
  );
}

function NocturnePlanet({ active, pulse, paused }) {
  const group = useRef();
  const planet = useRef();
  const atmosphere = useRef();
  const pulseRing = useRef();
  const { pointer } = useThree();

  const planetMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uLight: { value: new THREE.Vector3(1.8, 0.45, 3.5) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uLight;
          varying vec3 vNormal;
          varying vec3 vPosition;
          float hash(vec3 p) {
            p = fract(p * 0.3183099 + .1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }
          void main() {
            vec3 n = normalize(vNormal);
            float light = max(dot(n, normalize(uLight)), 0.0);
            float edge = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 2.5);
            float grain = hash(floor(vPosition * 92.0 + uTime * 0.12));
            float bands = sin(vPosition.y * 18.0 + sin(vPosition.x * 7.0)) * 0.5 + 0.5;
            vec3 deep = vec3(0.018, 0.055, 0.105);
            vec3 blue = vec3(0.055, 0.145, 0.24);
            vec3 gold = vec3(0.84, 0.73, 0.51);
            vec3 color = mix(deep, blue, light * 0.48 + bands * 0.035);
            color += gold * edge * (0.42 + light * 0.45);
            color += (grain - 0.5) * 0.035;
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    [],
  );

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float fresnel = pow(0.69 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
            gl_FragColor = vec4(0.58, 0.70, 0.73, fresnel * 0.9);
          }
        `,
      }),
    [],
  );

  useFrame((_, delta) => {
    const speed = paused ? 0 : delta;
    planetMaterial.uniforms.uTime.value += speed;
    if (!paused) planet.current.rotation.y += delta * 0.018;
    const selected = OBSERVATIONS.find((item) => item.id === active);
    const targetX = selected ? -selected.position[1] * 0.045 : pointer.y * 0.08;
    const targetY = selected ? selected.position[0] * 0.035 : pointer.x * 0.11;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.035);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.035);
    atmosphere.current.rotation.z -= speed * 0.008;
    if (pulseRing.current) {
      const age = Math.min((performance.now() - pulse) / 1700, 1);
      pulseRing.current.scale.setScalar(1 + age * 2.1);
      pulseRing.current.material.opacity = Math.max(0, 0.42 * (1 - age));
    }
  });

  return (
    <group ref={group} position={[-0.25, 0.18, -0.45]}>
      <mesh ref={planet} material={planetMaterial}>
        <sphereGeometry args={[2.72, 96, 72]} />
      </mesh>
      <mesh ref={atmosphere} scale={1.045} material={atmosphereMaterial}>
        <sphereGeometry args={[2.72, 72, 48]} />
      </mesh>
      <mesh rotation={[Math.PI / 2.2, 0.18, -0.06]} scale={[1, 0.96, 1]}>
        <torusGeometry args={[2.78, 0.012, 8, 180]} />
        <meshBasicMaterial
          color="#e7d7b7"
          transparent
          opacity={0.24}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={pulseRing} key={pulse}>
        <ringGeometry args={[2.76, 2.79, 180]} />
        <meshBasicMaterial
          color="#efd08b"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function OrbitParticle({ curve, speed, offset, paused, color, emphasized }) {
  const ref = useRef();
  const progress = useRef(offset);
  useFrame((_, delta) => {
    if (!paused) progress.current = (progress.current + delta * speed) % 1;
    ref.current.position.copy(curve.getPointAt(progress.current));
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[emphasized ? 0.028 : 0.016, 10, 10]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={emphasized ? 0.96 : 0.55}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function OrbitNetwork({ active, mode, paused }) {
  const group = useRef();
  const flare = useRef();
  const orbitData = useMemo(() => {
    const random = seededRandom(20260729);
    const origin = new THREE.Vector3(1.72, -0.35, 1.25);
    return Array.from({ length: 18 }, (_, index) => {
      const angle = (index / 18) * Math.PI * 2 + random() * 0.45;
      const radius = 2.6 + random() * 3.7;
      const end = new THREE.Vector3(
        Math.cos(angle) * radius - 0.4,
        Math.sin(angle) * radius * 0.55,
        -1.2 + random() * 2.3,
      );
      const controlA = origin
        .clone()
        .lerp(end, 0.28)
        .add(new THREE.Vector3((random() - 0.5) * 1.8, (random() - 0.5) * 1.6, 0.6 + random() * 1.3));
      const controlB = origin
        .clone()
        .lerp(end, 0.72)
        .add(new THREE.Vector3((random() - 0.5) * 2.2, (random() - 0.5) * 1.5, (random() - 0.5) * 1.7));
      const curve = new THREE.CatmullRomCurve3([origin, controlA, controlB, end]);
      return {
        curve,
        points: curve.getPoints(100),
        speed: 0.025 + random() * 0.075,
        offset: random(),
        tone: index % 6 === 0 ? "#e1a17d" : "#e6d8b9",
      };
    });
  }, []);

  useFrame((state, delta) => {
    if (!paused) group.current.rotation.z += delta * (mode === "drift" ? 0.01 : 0.002);
    flare.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3.2) * 0.14);
  });

  return (
    <group ref={group}>
      {orbitData.map((orbit, index) => (
        <group key={index}>
          <Line
            points={orbit.points}
            color={orbit.tone}
            lineWidth={mode === "trace" && index % 2 === 0 ? 1.2 : 0.65}
            dashed
            dashSize={index % 3 === 0 ? 0.07 : 0.025}
            gapSize={index % 3 === 0 ? 0.09 : 0.055}
            transparent
            opacity={
              mode === "trace"
                ? index % 2 === 0
                  ? 0.58
                  : 0.25
                : active
                  ? 0.2
                  : 0.32
            }
            depthWrite={false}
          />
          <OrbitParticle
            curve={orbit.curve}
            speed={orbit.speed}
            offset={orbit.offset}
            paused={paused}
            color={orbit.tone}
            emphasized={mode === "trace" || index % 4 === 0}
          />
        </group>
      ))}
      <group ref={flare} position={[1.72, -0.35, 1.25]}>
        <mesh>
          <sphereGeometry args={[0.11, 24, 24]} />
          <meshBasicMaterial color="#fff0ba" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshBasicMaterial
            color="#f3bd68"
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <pointLight color="#e9a75c" intensity={6} distance={5.4} decay={2} />
      </group>
    </group>
  );
}

function SceneNode({ observation, active, setActive }) {
  const mesh = useRef();
  const [hovered, setHovered] = useState(false);
  useFrame((state) => {
    const scale =
      1 +
      Math.sin(state.clock.elapsedTime * 2.1 + observation.position[0]) * 0.06 +
      (active ? 0.22 : hovered ? 0.1 : 0);
    mesh.current.scale.setScalar(scale);
  });
  return (
    <Float speed={1.3} rotationIntensity={0.12} floatIntensity={0.08}>
      <group position={observation.position}>
        <mesh
          ref={mesh}
          onClick={(event) => {
            event.stopPropagation();
            setActive(observation.id);
          }}
          onPointerEnter={(event) => {
            event.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerLeave={() => {
            setHovered(false);
            document.body.style.cursor = "";
          }}
        >
          <octahedronGeometry args={[0.075, 0]} />
          <meshBasicMaterial color={active ? "#ffca7a" : "#d9c9a8"} />
        </mesh>
        <mesh scale={active ? 1.5 : 1}>
          <ringGeometry args={[0.13, 0.145, 32]} />
          <meshBasicMaterial
            color={active ? "#e7a575" : "#b9b09c"}
            transparent
            opacity={active ? 0.9 : 0.42}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Html center distanceFactor={9} className="scene-node-label">
          <button
            type="button"
            className={active ? "is-active" : ""}
            onClick={() => setActive(observation.id)}
            aria-label={`打开${observation.title}`}
          >
            <small>{observation.index}</small>
            <span>{observation.title}</span>
          </button>
        </Html>
      </group>
    </Float>
  );
}

function CameraRig({ active, mode }) {
  const { camera, pointer } = useThree();
  useFrame(() => {
    const observation = OBSERVATIONS.find((item) => item.id === active);
    const modeDepth = mode === "drift" ? 0.55 : mode === "trace" ? -0.25 : 0;
    const targetX = observation ? observation.position[0] * 0.07 : pointer.x * 0.22;
    const targetY = observation ? observation.position[1] * 0.06 : pointer.y * 0.16;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.022);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.022);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 7.8 + modeDepth, 0.025);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Horizon() {
  const shape = useMemo(() => {
    const random = seededRandom(402);
    const result = new THREE.Shape();
    result.moveTo(-9, -4.5);
    for (let i = 0; i <= 80; i += 1) {
      const x = -9 + (i / 80) * 18;
      const y =
        -3.14 +
        Math.sin(i * 0.19) * 0.11 +
        Math.sin(i * 0.047) * 0.18 +
        random() * 0.07;
      result.lineTo(x, y);
    }
    result.lineTo(9, -4.5);
    result.closePath();
    return result;
  }, []);
  return (
    <mesh>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color="#050f1e" transparent opacity={0.88} />
    </mesh>
  );
}

function NocturneScene({ active, setActive, paused, mode, pulse }) {
  return (
    <Canvas
      dpr={[1, 1.7]}
      camera={{ position: [0, 0, 7.8], fov: 48, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => setActive(null)}
    >
      <color attach="background" args={["#071426"]} />
      <fog attach="fog" args={["#071426", 7, 16]} />
      <Suspense fallback={null}>
        <CameraRig active={active} mode={mode} />
        <StarField paused={paused} mode={mode} />
        <NocturnePlanet active={active} pulse={pulse} paused={paused} />
        <OrbitNetwork active={active} mode={mode} paused={paused} />
        {OBSERVATIONS.map((observation) => (
          <SceneNode
            key={observation.id}
            observation={observation}
            active={active === observation.id}
            setActive={setActive}
          />
        ))}
        <Horizon />
      </Suspense>
    </Canvas>
  );
}

export function App() {
  const [active, setActive] = useState(null);
  const [mode, setMode] = useState("observe");
  const [paused, setPaused] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [entered, setEntered] = useState(false);
  const [time, setTime] = useState("00:00:00");
  const activeObservation = OBSERVATIONS.find((item) => item.id === active);

  useEffect(() => {
    const updateTime = () =>
      setTime(
        new Intl.DateTimeFormat("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    const entryTimer = window.setTimeout(() => setEntered(true), 500);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(entryTimer);
    };
  }, []);

  useEffect(() => {
    const keyHandler = (event) => {
      if (event.key === "Escape") setActive(null);
      if (event.key.toLowerCase() === "p") setPaused((value) => !value);
      if (["1", "2", "3"].includes(event.key)) {
        setMode(MODES[Number(event.key) - 1].id);
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  const triggerPulse = () => {
    setPulse(performance.now());
    setActive(null);
  };

  return (
    <main className={`observatory ${entered ? "is-entered" : ""}`}>
      <div className="scene-wrap">
        <NocturneScene
          active={active}
          setActive={setActive}
          paused={paused}
          mode={mode}
          pulse={pulse}
        />
      </div>
      <div className="paper-grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <header className="observatory-header">
        <button className="brand-lockup" type="button" onClick={triggerPulse}>
          <span className="brand-seal">暮</span>
          <span>
            <strong>暮蓝自然研究所</strong>
            <small>NOCTURNE FIELD OBSERVATORY</small>
          </span>
        </button>
        <div className="header-coordinates" aria-label="观测坐标">
          <span>31°13′N</span><i /><span>121°28′E</span><i /><span>{time}</span>
        </div>
        <button
          className="motion-toggle"
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
          <span>{paused ? "继续流动" : "冻结星图"}</span>
        </button>
      </header>

      <section className="hero-copy" aria-labelledby="hero-title">
        <p className="hero-kicker">
          <span>FIELD NOTE Nº 0729</span>
          <span>夜间观测中</span>
        </p>
        <h1 id="hero-title">
          万物沿着<br />
          <em>尚未写完的轨道</em><br />
          彼此抵达
        </h1>
        <p className="hero-deck">
          一张可以触摸的宇宙手稿。移动指针扰动引力场，
          点击微光，展开那些藏在夜色里的公式。
        </p>
      </section>

      <nav className="mode-rail" aria-label="观测模式">
        <span className="rail-line" />
        {MODES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={mode === item.id ? "is-active" : ""}
            onClick={() => setMode(item.id)}
            aria-pressed={mode === item.id}
          >
            <small>0{index + 1}</small>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        className="singularity-control"
        type="button"
        onClick={triggerPulse}
        aria-label="触发星核脉冲"
      >
        <Crosshair size={18} />
        <span>触发星核</span>
        <small>PULSE FIELD</small>
      </button>

      <aside className={`observation-card ${activeObservation ? "is-open" : ""}`}>
        {activeObservation && (
          <>
            <button className="card-close" type="button" onClick={() => setActive(null)} aria-label="关闭手稿">
              <X size={16} />
            </button>
            <p className="card-eyebrow">
              <span>{activeObservation.index}</span>
              {activeObservation.eyebrow}
            </p>
            <div className="card-glyph">{activeObservation.glyph}</div>
            <h2>{activeObservation.title}</h2>
            <p>{activeObservation.description}</p>
            <div className="card-formula">{activeObservation.formula}</div>
            <div className="card-meta">
              <span>ARCHIVE / 2026</span>
              <Compass size={15} />
            </div>
          </>
        )}
      </aside>

      <footer className="observatory-footer">
        <div className="interaction-hint">
          <span className="pointer-orbit"><i /></span>
          <p>
            <strong>移动以扰动引力</strong>
            <small>点击节点展开手稿 · P 暂停 · 1—3 切换模式</small>
          </p>
        </div>
        <p className="field-state">
          <span className="live-dot" />
          FIELD STABLE
          <b>φ 1.618</b>
        </p>
      </footer>

      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />
    </main>
  );
}

export default App;
