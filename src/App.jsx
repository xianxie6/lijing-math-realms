import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import katex from "katex";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowsOut,
  BookOpenText,
  Compass,
  Pause,
  Play,
  X,
} from "@phosphor-icons/react";
import "@fontsource-variable/noto-serif-sc";
import "@fontsource/ibm-plex-mono/400.css";
import "katex/dist/katex.min.css";
import { TheoryScene } from "./TheoryScenes";
import { concepts as theoryConcepts, theories } from "./theoryContent";

const concepts = [
  {
    id: "kakeya",
    index: "01",
    title: "三维 Kakeya 集",
    subtitle: "在极小空间中容纳所有方向",
    domain: "几何测度论",
    image: "/assets/kakeya-study.png",
    available: true,
  },
  {
    id: "riemann",
    index: "02",
    title: "黎曼猜想",
    subtitle: "素数星空与临界线",
    domain: "解析数论",
    image: "/assets/riemann.png",
  },
  {
    id: "godel",
    index: "03",
    title: "哥德尔不完备定理",
    subtitle: "无法完成的逻辑手稿",
    domain: "数理逻辑",
    image: "/assets/godel.png",
  },
  {
    id: "mandelbrot",
    index: "04",
    title: "曼德博集合",
    subtitle: "无限递归的暮蓝海岸",
    domain: "复动力系统",
    image: "/assets/mandelbrot.png",
  },
  {
    id: "poincare",
    index: "05",
    title: "庞加莱猜想",
    subtitle: "流动收缩的三维宇宙",
    domain: "几何拓扑",
    image: "/assets/poincare.png",
  },
  {
    id: "pnp",
    index: "06",
    title: "P 与 NP",
    subtitle: "可验证却难以找到出口",
    domain: "计算复杂性",
    image: "/assets/p-vs-np.png",
  },
];

const steps = [
  {
    number: "01",
    label: "看见问题",
    kicker: "一支无限细的针",
    title: "每个方向，都要有一条单位线段",
    body: "设 K 是三维空间中的一个集合。无论给出哪个方向 ω，都能在 K 中找到一条沿该方向放置的单位线段。线段可以移动、交叠，也可以聚集在异常复杂的区域里。",
    math: String.raw`\forall\,\omega\in S^2,\quad \exists\,\ell_\omega\subset K,\ |\ell_\omega|=1`,
    note: "拖动画面观察：这些线段并非整齐穿过同一个中心。",
  },
  {
    number: "02",
    label: "方向球面",
    kicker: "从平面走向空间",
    title: "方向不再是一圈，而是整个球面",
    body: "在三维中，一个方向由球面 S² 上的点表示。Kakeya 集必须同时容纳球面上连续无穷多个方向，因此真正的难点来自方向之间复杂的空间相交。",
    math: String.raw`\omega\in S^2`,
    note: "打开“方向层”，观察球面上的方向采样。",
  },
  {
    number: "03",
    label: "缩小尺度",
    kicker: "用 δ-线管观察细线",
    title: "越靠近零，结构越像一团重叠的针雾",
    body: "证明中常把无限细线段稍微加粗成半径为 δ 的线管，再研究 δ 不断趋近于零时，它们的并集怎样占据空间。滑动 δ，查看同一方向系统在不同尺度下的形态。",
    math: String.raw`T_\delta(\ell)=\{x:\operatorname{dist}(x,\ell)\leq\delta\}`,
    note: "δ-线管只是尺度邻域，不是有实体厚度的管道。",
  },
  {
    number: "04",
    label: "抵达结论",
    kicker: "王虹 × Joshua Zahl · 2025",
    title: "它可以零体积，却不能少一个维度",
    body: "王虹与 Joshua Zahl 证明：三维 Kakeya 集的 Hausdorff 维数与 Minkowski 维数都必须等于 3。这里的“满维”不等于“必有正体积”。",
    math: String.raw`\dim_{\mathrm H}K=\dim_{\mathrm M}K=3`,
    note: "这是概念性视觉解释，不是完整证明图。",
  },
];

function MathText({ children, block = false }) {
  const html = useMemo(
    () =>
      katex.renderToString(children, {
        throwOnError: false,
        displayMode: block,
      }),
    [children, block],
  );

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function TubeCloud({ delta, step, playing }) {
  const group = useRef();
  const mesh = useRef();
  const directionPoints = useRef();
  const count = 210;

  const instances = useMemo(() => {
    const random = seededRandom(1138);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();
    const values = [];

    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.5) / count;
      const y = 1 - 2 * t;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      const direction = new THREE.Vector3(
        Math.cos(phi) * radius,
        y,
        Math.sin(phi) * radius,
      ).normalize();

      const tangent = new THREE.Vector3(-direction.z, 0.35, direction.x).normalize();
      const bitangent = new THREE.Vector3().crossVectors(direction, tangent).normalize();
      position
        .copy(tangent)
        .multiplyScalar((random() - 0.5) * 1.2)
        .addScaledVector(bitangent, (random() - 0.5) * 1.2)
        .addScaledVector(direction, (random() - 0.5) * 0.18);

      quaternion.setFromUnitVectors(yAxis, direction);
      scale.set(delta / 0.034, 0.84 + random() * 0.24, delta / 0.034);
      matrix.compose(position, quaternion, scale);
      color.set(i % 11 === 0 ? "#d9aa91" : i % 5 === 0 ? "#9ab9dd" : "#779bc5");
      values.push({ matrix: matrix.clone(), color: color.clone() });
    }
    return values;
  }, [delta]);

  useEffect(() => {
    if (!mesh.current) return;
    instances.forEach(({ matrix, color }, index) => {
      mesh.current.setMatrixAt(index, matrix);
      mesh.current.setColorAt(index, color);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [instances]);

  const spherePoints = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 220; i += 1) {
      const t = (i + 0.5) / 220;
      const y = 1 - 2 * t;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      positions.push(
        Math.cos(phi) * radius * 1.82,
        y * 1.82,
        Math.sin(phi) * radius * 1.82,
      );
    }
    return new Float32Array(positions);
  }, []);

  const linePositions = useMemo(() => {
    const positions = [];
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    instances.forEach(({ matrix }) => {
      start.set(0, -1.11, 0).applyMatrix4(matrix);
      end.set(0, 1.11, 0).applyMatrix4(matrix);
      positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    });
    return new Float32Array(positions);
  }, [instances]);

  useFrame((_, frameDelta) => {
    if (playing && group.current) group.current.rotation.y += frameDelta * 0.08;
    if (directionPoints.current) {
      directionPoints.current.rotation.y -= frameDelta * 0.035;
    }
  });

  return (
    <group ref={group} rotation={[0.17, 0.25, -0.08]}>
      <instancedMesh ref={mesh} args={[null, null, count]}>
        <cylinderGeometry args={[0.029, 0.029, 2.22, 6, 1, true]} />
        <meshBasicMaterial
          transparent
          opacity={step === 2 ? 0.44 : step === 3 ? 0.78 : 0.68}
          vertexColors
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          dithering
        />
      </instancedMesh>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#a8bfd5"
          transparent
          opacity={step === 2 ? 0.24 : 0.18}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <points ref={directionPoints} visible={step === 1 || step === 3}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[spherePoints, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#e8d7b7"
          size={0.018}
          transparent
          opacity={step === 1 ? 0.52 : 0.16}
          sizeAttenuation
        />
      </points>

      {step === 2 && (
        <>
          {[1.28, 1.55, 1.83].map((size, index) => (
            <mesh key={size} scale={size}>
              <sphereGeometry args={[1, 24, 16]} />
              <meshBasicMaterial
                color={index === 1 ? "#b06a69" : "#6d89a9"}
                wireframe
                transparent
                opacity={0.09}
              />
            </mesh>
          ))}
        </>
      )}

      <mesh>
        <sphereGeometry args={[0.043, 16, 12]} />
        <meshBasicMaterial color="#e7c982" />
      </mesh>
    </group>
  );
}

function KakeyaScene({ delta = 0.034, step = 0, playing = true, compact = false }) {
  return (
    <Canvas
      dpr={[1, 1.65]}
      camera={{ position: [0.25, 0.1, compact ? 5.9 : 5.2], fov: compact ? 35 : 38 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#101d32"]} />
      <fog attach="fog" args={["#101d32", 4.8, 9]} />
      <ambientLight intensity={1.3} />
      <Suspense fallback={null}>
        <TubeCloud delta={delta} step={step} playing={playing} />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={!compact}
        minDistance={3.8}
        maxDistance={7.4}
        autoRotate={playing && compact}
        autoRotateSpeed={0.34}
      />
    </Canvas>
  );
}

function Header({ view, onHome, onExplore }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onHome} aria-label="返回理境首页">
        <span className="brand-mark">理</span>
        <span className="brand-copy">
          <strong>理境</strong>
          <small>LIJING · MATHEMATICAL REALMS</small>
        </span>
      </button>

      <nav aria-label="主导航">
        <button className={view === "home" ? "is-active" : ""} onClick={onHome}>
          入口
        </button>
        <button
          className={view === "explore" ? "is-active" : ""}
          onClick={() => onExplore("kakeya")}
        >
          探索
        </button>
        <a href="#atlas">星图</a>
        <a href="#about">关于</a>
      </nav>

      <button className="header-action" onClick={() => onExplore("kakeya")}>
        进入手稿 <ArrowRight size={15} weight="light" />
      </button>
    </header>
  );
}

function Home({ onExplore, onOpenPlate }) {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>第一卷 · 几何测度论</span>
            <span>2025 / R³</span>
          </div>
          <h1 id="hero-title">
            <span>在几乎无体积的空间里，</span>
            <em>藏下所有方向。</em>
          </h1>
          <p className="hero-lead">
            三维 Kakeya 集猜想，由王虹与 Joshua Zahl 解决。
            一束无限细的线，可以被压缩得近乎消失，却不能失去完整的三维性。
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => onExplore("kakeya")}>
              进入三维 Kakeya
              <ArrowRight size={18} weight="light" />
            </button>
            <button className="text-action" onClick={onOpenPlate}>
              <BookOpenText size={18} weight="light" />
              查看研究手稿
            </button>
          </div>
          <div className="hero-proof">
            <span className="proof-line" />
            <MathText>{String.raw`\dim_{\mathrm H}K=\dim_{\mathrm M}K=3`}</MathText>
            <small>满维不意味着正体积</small>
          </div>
        </div>

        <div className="hero-stage">
          <div className="stage-meta">
            <span>拖动 · 旋转空间</span>
            <span>δ = 0.034</span>
          </div>
          <KakeyaScene compact />
          <div className="stage-caption">
            <span>全方向线管场</span>
            <Compass size={18} weight="light" />
          </div>
          <div className="stage-annotation stage-annotation-a">ω ∈ S²</div>
          <div className="stage-annotation stage-annotation-b">K ⊂ ℝ³</div>
        </div>

        <a className="scroll-cue" href="#atlas">
          向下探索 <ArrowDown size={16} weight="light" />
        </a>
      </section>

      <section className="atlas" id="atlas" aria-labelledby="atlas-title">
        <div className="section-heading">
          <div>
            <span className="section-index">FIELD NOTES / 01—06</span>
            <h2 id="atlas-title">数学观念星图</h2>
          </div>
          <p>
            每一个理论，都是一处可以进入的世界。
            <br />
            六册研究手稿现已开放。
          </p>
        </div>

        <div className="concept-grid">
          {theoryConcepts.map((concept) => (
            <article
              className="concept-card is-available"
              key={concept.id}
            >
              <button
                onClick={() => onExplore(concept.id)}
                aria-label={`${concept.title}，进入探索`}
              >
                <img src={concept.image} alt="" />
                <span className="concept-shade" />
                <span className="concept-number">{concept.index}</span>
                <span className="concept-status">开放探索</span>
                <span className="concept-copy">
                  <small>{concept.domain}</small>
                  <strong>{concept.title}</strong>
                  <span>{concept.subtitle}</span>
                </span>
                <span className="concept-arrow">
                  <ArrowRight size={18} weight="light" />
                </span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="manifesto" id="about">
        <span className="section-index">ABOUT LIJING</span>
        <p>
          理境不是题库。
          <br />
          它是一座以图像、空间和交互解释深奥数学观念的数字博物馆。
        </p>
        <div className="manifesto-meta">
          <span>看见直觉</span>
          <span>玩懂机制</span>
          <span>读懂定义</span>
        </div>
      </section>
    </>
  );
}

function Explorer({ theoryId, onBack, onOpenPlate }) {
  const theory = theories[theoryId] ?? theories.kakeya;
  const theorySteps = theory.steps;
  const [activeStep, setActiveStep] = useState(0);
  const [parameter, setParameter] = useState(theory.control.initial);
  const [playing, setPlaying] = useState(true);
  const step = theorySteps[activeStep];

  return (
    <main className="explorer">
      <aside className="explorer-rail">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} weight="light" />
          返回入口
        </button>
        <div className="rail-title">
          <small>手稿 {theory.index}</small>
          <strong>{theory.title}</strong>
        </div>
        <ol>
          {theorySteps.map((item, index) => (
            <li key={item.number}>
              <button
                className={index === activeStep ? "is-active" : ""}
                onClick={() => setActiveStep(index)}
              >
                <span>{item.number}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>
        <button className="plate-link" onClick={onOpenPlate}>
          <BookOpenText size={17} weight="light" />
          原始研究页
        </button>
      </aside>

      <section className="explorer-stage" aria-label={theory.stageAria}>
        <div className="explorer-stage-head">
          <span>{theory.stageLabel}</span>
          <span>{theory.stageHint}</span>
        </div>
        {theoryId === "kakeya" ? (
          <KakeyaScene delta={parameter} step={activeStep} playing={playing} />
        ) : (
          <TheoryScene
            theoryId={theoryId}
            parameter={parameter}
            activeStep={activeStep}
            playing={playing}
          />
        )}
        <div className="axis-label axis-x">x</div>
        <div className="axis-label axis-y">y</div>
        <div className="axis-label axis-z">z</div>
        <div className="explorer-controls">
          <button
            className="round-control"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? "暂停旋转" : "继续旋转"}
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <div className="delta-control">
            <label htmlFor="theory-parameter">{theory.control.label}</label>
            <input
              id="theory-parameter"
              type="range"
              min={theory.control.min}
              max={theory.control.max}
              step={theory.control.step}
              value={parameter}
              onInput={(event) => setParameter(Number(event.currentTarget.value))}
              onChange={(event) => setParameter(Number(event.target.value))}
            />
            <output>{parameter.toFixed(theory.control.digits)}</output>
          </div>
          <span className="control-hint">
            <ArrowsOut size={16} weight="light" /> 自由观察
          </span>
        </div>
      </section>

      <aside className="explorer-notes">
        <div className="note-counter">
          <span>{step.number}</span>
          <small>/ {String(theorySteps.length).padStart(2, "0")}</small>
        </div>
        <span className="note-kicker">{step.kicker}</span>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="math-panel">
          <MathText block>{step.math}</MathText>
        </div>
        <div className="field-note">
          <span>{theory.observation}</span>
          <p>{step.note}</p>
        </div>
        <div className="step-navigation">
          <button
            onClick={() => setActiveStep((value) => Math.max(0, value - 1))}
            disabled={activeStep === 0}
            aria-label="上一步"
          >
            <ArrowLeft size={18} weight="light" />
          </button>
          <span>
            {activeStep + 1} / {theorySteps.length}
          </span>
          <button
            onClick={() =>
              setActiveStep((value) => Math.min(theorySteps.length - 1, value + 1))
            }
            disabled={activeStep === theorySteps.length - 1}
            aria-label="下一步"
          >
            <ArrowRight size={18} weight="light" />
          </button>
        </div>
      </aside>
    </main>
  );
}

function PlateModal({ theoryId, onClose }) {
  const theory = theories[theoryId] ?? theories.kakeya;

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${theory.title}研究手稿`}
    >
      <button className="modal-close" onClick={onClose} aria-label="关闭研究手稿">
        <X size={22} weight="light" />
      </button>
      <figure className="plate-modal">
        <img
          src={theory.image}
          alt={`${theory.title}暮蓝自然研究手稿`}
        />
        <figcaption>
          <span>INFINITE MANUSCRIPT · PLATE {theory.index}</span>
          <p>
            {theory.domain} · {theory.subtitle}。
            图中微小手写内容承担视觉笔记功能，详细概念以右侧章节文字与公式为准。
          </p>
        </figcaption>
      </figure>
    </div>
  );
}

export function App() {
  const [view, setView] = useState("home");
  const [activeTheoryId, setActiveTheoryId] = useState("kakeya");
  const [plateOpen, setPlateOpen] = useState(false);

  const goHome = () => {
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goExplore = (theoryId = "kakeya") => {
    setActiveTheoryId(theoryId);
    setView("explore");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className="app-shell">
      {view === "home" && (
        <Header view={view} onHome={goHome} onExplore={goExplore} />
      )}
      {view === "home" ? (
        <Home onExplore={goExplore} onOpenPlate={() => setPlateOpen(true)} />
      ) : (
        <Explorer
          key={activeTheoryId}
          theoryId={activeTheoryId}
          onBack={goHome}
          onOpenPlate={() => setPlateOpen(true)}
        />
      )}
      {plateOpen && (
        <PlateModal
          theoryId={activeTheoryId}
          onClose={() => setPlateOpen(false)}
        />
      )}
    </div>
  );
}
