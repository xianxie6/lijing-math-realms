import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { Compass, Crosshair, Pause, Play, X } from "@phosphor-icons/react";
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
      farRef.current.rotation.z += delta * (mode === "drift" ? 0.045 : 0.008);
      nearRef.current.rotation.z -= delta * (mode === "drift" ? 0.09 : 0.018);
    }
    nearRef.current.position.x = THREE.MathUtils.lerp(
      nearRef.current.position.x,
      state.pointer.x * 0.68,
      0.055,
    );
    nearRef.current.position.y = THREE.MathUtils.lerp(
      nearRef.current.position.y,
      state.pointer.y * 0.42,
      0.055,
    );
    farRef.current.position.x = THREE.MathUtils.lerp(
      farRef.current.position.x,
      state.pointer.x * -0.22,
      0.025,
    );
    farRef.current.position.y = THREE.MathUtils.lerp(
      farRef.current.position.y,
      state.pointer.y * -0.14,
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

function NocturnePlanet({ active, pulse, paused, mode }) {
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
    if (!paused) {
      const rotationSpeed = mode === "drift" ? 0.34 : mode === "trace" ? 0.09 : 0.055;
      planet.current.rotation.y += delta * rotationSpeed;
    }
    const selected = OBSERVATIONS.find((item) => item.id === active);
    const targetX = selected ? -selected.position[1] * 0.09 : pointer.y * 0.28;
    const targetY = selected ? selected.position[0] * 0.075 : pointer.x * 0.36;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.075);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.075);
    atmosphere.current.rotation.z -= speed * (mode === "drift" ? 0.15 : 0.045);
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

function OrbitNetwork({ active, mode, paused, pulse }) {
  const group = useRef();
  const flare = useRef();
  const orbitData = useMemo(() => {
    const origin = new THREE.Vector3(1.72, -0.35, 1.25);
    const arcOffsets = [
      new THREE.Vector3(-0.35, 1.15, 1.2),
      new THREE.Vector3(-0.75, -0.65, 1.05),
      new THREE.Vector3(0.95, 0.75, 1.3),
      new THREE.Vector3(0.35, -1.05, 1.15),
    ];
    const tones = ["#e6d8b9", "#d9cfba", "#e1a17d", "#c8d5d8"];

    return OBSERVATIONS.map((observation, index) => {
      const end = new THREE.Vector3(...observation.position);
      const arcOffset = arcOffsets[index];
      const controlA = origin
        .clone()
        .lerp(end, 0.3)
        .add(arcOffset.clone().multiplyScalar(0.72));
      const controlB = origin
        .clone()
        .lerp(end, 0.7)
        .add(arcOffset);
      const curve = new THREE.CatmullRomCurve3([origin, controlA, controlB, end]);
      return {
        id: observation.id,
        curve,
        points: curve.getPoints(120),
        speed: 0.045 + index * 0.012,
        offset: index * 0.23,
        tone: tones[index],
      };
    });
  }, []);

  useFrame((state) => {
    const age = Math.min(Math.max((performance.now() - pulse) / 1250, 0), 1);
    const blast = pulse > 0 && age < 1 ? Math.sin(age * Math.PI) : 0;
    flare.current.scale.setScalar(
      1 + Math.sin(state.clock.elapsedTime * 3.2) * 0.14 + blast * 2.4,
    );
    group.current.scale.setScalar(
      THREE.MathUtils.lerp(group.current.scale.x, 1 + blast * 0.18, 0.12),
    );
  });

  return (
    <group ref={group}>
      {orbitData.map((orbit) => {
        const selected = active === orbit.id;
        return (
          <group key={orbit.id}>
            <Line
              points={orbit.points}
              color={selected ? "#ffd48a" : orbit.tone}
              lineWidth={selected ? 2.2 : mode === "trace" ? 1.15 : 0.75}
              dashed
              dashSize={selected ? 0.12 : 0.055}
              gapSize={selected ? 0.045 : 0.075}
              transparent
              opacity={
                selected
                  ? 0.96
                  : active
                    ? 0.12
                    : mode === "trace"
                      ? 0.58
                      : 0.34
              }
              depthWrite={false}
            />
            <OrbitParticle
              curve={orbit.curve}
              speed={orbit.speed * (selected ? 2.4 : 1)}
              offset={orbit.offset}
              paused={paused}
              color={selected ? "#ffd48a" : orbit.tone}
              emphasized={selected || mode === "trace"}
            />
          </group>
        );
      })}
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

function WorldRig({ children, drag, mode, pulse }) {
  const group = useRef();
  const { pointer } = useThree();
  useFrame(() => {
    const age = Math.min(Math.max((performance.now() - pulse) / 1150, 0), 1);
    const blast = pulse > 0 && age < 1 ? Math.sin(age * Math.PI) : 0;
    const targetScale = (mode === "trace" ? 1.1 : mode === "drift" ? 0.96 : 1) + blast * 0.12;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -drag.y * 0.85 + pointer.y * 0.18,
      0.09,
    );
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      drag.x * 1.15 + pointer.x * 0.28,
      0.09,
    );
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      pointer.x * 0.32 + drag.x * 0.18,
      0.06,
    );
    group.current.position.y = THREE.MathUtils.lerp(
      group.current.position.y,
      pointer.y * 0.2 - drag.y * 0.12,
      0.06,
    );
    group.current.scale.setScalar(
      THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.09),
    );
  });
  return <group ref={group}>{children}</group>;
}

function CameraRig({ active, mode, drag, depth, pulse }) {
  const { camera, pointer } = useThree();
  useFrame(() => {
    const observation = OBSERVATIONS.find((item) => item.id === active);
    const modeDepth = mode === "drift" ? 0.8 : mode === "trace" ? -0.8 : 0;
    const age = Math.min(Math.max((performance.now() - pulse) / 1050, 0), 1);
    const blast = pulse > 0 && age < 1 ? Math.sin(age * Math.PI) : 0;
    const shake = blast * (1 - age) * 0.16;
    const targetX = observation
      ? observation.position[0] * 0.18
      : pointer.x * 0.78 + drag.x * 0.5;
    const targetY = observation
      ? observation.position[1] * 0.15
      : pointer.y * 0.5 - drag.y * 0.38;
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      targetX + Math.sin(age * 70) * shake,
      0.07,
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetY + Math.cos(age * 61) * shake,
      0.07,
    );
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      7.8 + modeDepth + depth * 2.7 - blast * 1.65,
      0.085,
    );
    camera.lookAt(pointer.x * -0.2, pointer.y * -0.12, 0);
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

function NocturneScene({ active, setActive, paused, mode, pulse, drag, depth }) {
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
        <CameraRig
          active={active}
          mode={mode}
          drag={drag}
          depth={depth}
          pulse={pulse}
        />
        <StarField paused={paused} mode={mode} />
        <WorldRig drag={drag} mode={mode} pulse={pulse}>
          <NocturnePlanet
            active={active}
            pulse={pulse}
            paused={paused}
            mode={mode}
          />
          <OrbitNetwork
            active={active}
            mode={mode}
            paused={paused}
            pulse={pulse}
          />
          {OBSERVATIONS.map((observation) => (
            <SceneNode
              key={observation.id}
              observation={observation}
              active={active === observation.id}
              setActive={setActive}
            />
          ))}
        </WorldRig>
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
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [depth, setDepth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const [time, setTime] = useState("00:00:00");
  const dragOrigin = useRef(null);
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

  const beginDrag = (event) => {
    if (event.target.closest?.("button")) return;
    dragOrigin.current = {
      x: event.clientX,
      y: event.clientY,
      baseX: drag.x,
      baseY: drag.y,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };

  const moveDrag = (event) => {
    if (!dragOrigin.current) return;
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    setDrag({
      x: THREE.MathUtils.clamp(
        dragOrigin.current.baseX +
          ((event.clientX - dragOrigin.current.x) / width) * 2.8,
        -1.5,
        1.5,
      ),
      y: THREE.MathUtils.clamp(
        dragOrigin.current.baseY +
          ((event.clientY - dragOrigin.current.y) / height) * 2.8,
        -1.3,
        1.3,
      ),
    });
  };

  const endDrag = (event) => {
    if (!dragOrigin.current) return;
    event.currentTarget.releasePointerCapture?.(
      dragOrigin.current.pointerId,
    );
    dragOrigin.current = null;
    setDragging(false);
  };

  return (
    <main
      className={`observatory ${entered ? "is-entered" : ""} ${
        dragging ? "is-dragging" : ""
      }`}
    >
      <div
        className="scene-wrap"
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={triggerPulse}
        onWheel={(event) =>
          setDepth((value) =>
            THREE.MathUtils.clamp(value + event.deltaY * 0.0015, -1, 1),
          )
        }
      >
        <NocturneScene
          active={active}
          setActive={setActive}
          paused={paused}
          mode={mode}
          pulse={pulse}
          drag={drag}
          depth={depth}
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

      <div className="depth-meter" aria-hidden="true">
        <span>DEPTH</span>
        <i>
          <b style={{ height: `${(1 - (depth + 1) / 2) * 100}%` }} />
        </i>
        <small>{depth > 0.35 ? "远域" : depth < -0.35 ? "近核" : "中轨"}</small>
      </div>

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
            <strong>按住拖拽天体 · 滚轮穿越深度</strong>
            <small>点击节点点亮主轨 · 双击触发冲击 · P 暂停</small>
          </p>
        </div>
        <p className="field-state">
          <span className="live-dot" />
          {dragging ? "FIELD DISTORTED" : "FIELD STABLE"}
          <b>Z {depth.toFixed(2)}</b>
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
