import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function randomFactory(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function RotatingRig({ children, playing, speed = 0.06, rotation = [0, 0, 0] }) {
  const group = useRef();

  useFrame((_, delta) => {
    if (playing && group.current) group.current.rotation.y += delta * speed;
  });

  return (
    <group ref={group} rotation={rotation}>
      {children}
    </group>
  );
}

function RiemannField({ parameter, activeStep, playing }) {
  const stars = useMemo(() => {
    const random = randomFactory(1859);
    const positions = new Float32Array(720 * 3);
    for (let i = 0; i < 720; i += 1) {
      positions[i * 3] = (random() - 0.5) * 6.8;
      positions[i * 3 + 1] = (random() - 0.5) * 5.2;
      positions[i * 3 + 2] = (random() - 0.5) * 2.8 - 0.8;
    }
    return positions;
  }, []);

  const axes = useMemo(
    () =>
      new Float32Array([
        -2.6, -2.25, 0,
        2.6, -2.25, 0,
        0, -2.25, 0,
        0, 2.35, 0,
      ]),
    [],
  );

  const zeros = [
    14.1347, 21.022, 25.0109, 30.4249, 32.9351, 37.5862, 40.9187, 43.3271,
    48.0052,
  ];

  return (
    <RotatingRig playing={playing} speed={0.035} rotation={[-0.06, -0.16, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#789bc5" size={0.018} transparent opacity={0.42} />
      </points>

      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[1.75, 4.65]} />
        <meshBasicMaterial
          color="#587ba2"
          transparent
          opacity={activeStep >= 1 ? 0.12 : 0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[axes, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#d6c9aa" transparent opacity={0.46} />
      </lineSegments>

      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 4.6, 8]} />
        <meshBasicMaterial color="#d8ae98" transparent opacity={0.9} />
      </mesh>

      {zeros.map((zero, index) => {
        const y = -2.05 + (zero / 50) * 4.1;
        const visible = zero <= parameter + 0.7;
        return (
          <mesh key={zero} position={[0, y, 0.08 + Math.sin(index * 1.7) * 0.05]}>
            <sphereGeometry args={[visible ? 0.065 : 0.034, 18, 12]} />
            <meshBasicMaterial
              color={visible ? "#ead58f" : "#789bc5"}
              transparent
              opacity={visible ? 1 : 0.24}
            />
          </mesh>
        );
      })}
    </RotatingRig>
  );
}

function GodelField({ parameter, activeStep, playing }) {
  const levels = Math.max(1, Math.round(parameter));
  const nodes = useMemo(() => {
    const values = [];
    for (let i = 0; i < 18; i += 1) {
      const angle = (i / 18) * Math.PI * 2;
      values.push([
        Math.cos(angle) * (1.38 + (i % 3) * 0.16),
        Math.sin(angle) * (1.38 + (i % 3) * 0.16),
        Math.sin(i * 2.1) * 0.3,
      ]);
    }
    return values;
  }, []);

  return (
    <RotatingRig playing={playing} speed={0.08} rotation={[0.12, -0.3, 0]}>
      {Array.from({ length: levels }, (_, index) => {
        const scale = 0.72 + index * 0.22;
        return (
          <mesh key={scale} scale={scale} rotation={[index * 0.13, index * 0.2, 0]}>
            <boxGeometry args={[1.7, 1.7, 1.7]} />
            <meshBasicMaterial
              color={index === levels - 1 ? "#d2b49c" : "#6f92ba"}
              wireframe
              transparent
              opacity={0.16 + index * 0.055}
            />
          </mesh>
        );
      })}

      <mesh rotation={[0, 0, 0.22]}>
        <torusGeometry args={[1.47, 0.025, 8, 96, Math.PI * 1.76]} />
        <meshBasicMaterial color="#d77779" transparent opacity={activeStep >= 2 ? 0.9 : 0.45} />
      </mesh>

      {nodes.map((position, index) => (
        <mesh key={position.join("-")} position={position}>
          <sphereGeometry args={[index === levels ? 0.065 : 0.035, 12, 8]} />
          <meshBasicMaterial
            color={index === levels ? "#ead58f" : "#8dadd0"}
            transparent
            opacity={index <= levels * 2 + 2 ? 0.85 : 0.2}
          />
        </mesh>
      ))}
    </RotatingRig>
  );
}

function MandelbrotField({ parameter, playing }) {
  const cloud = useMemo(() => {
    const width = 150;
    const height = 105;
    const maxIterations = Math.round(parameter);
    const positions = [];
    const colors = [];
    const deep = new THREE.Color("#233b60");
    const coast = new THREE.Color("#8fb0d1");
    const light = new THREE.Color("#e1c493");

    for (let iy = 0; iy < height; iy += 1) {
      const cy = -1.35 + (iy / (height - 1)) * 2.7;
      for (let ix = 0; ix < width; ix += 1) {
        const cx = -2.18 + (ix / (width - 1)) * 3.15;
        let x = 0;
        let y = 0;
        let iteration = 0;
        while (x * x + y * y <= 4 && iteration < maxIterations) {
          const nextX = x * x - y * y + cx;
          y = 2 * x * y + cy;
          x = nextX;
          iteration += 1;
        }

        const inside = iteration === maxIterations;
        const ratio = iteration / maxIterations;
        const z = inside ? 0.12 : -0.34 + ratio * 0.36;
        positions.push((cx + 0.57) * 1.55, cy * 1.55, z);
        const color = inside
          ? deep
          : ratio > 0.64
            ? coast.clone().lerp(light, (ratio - 0.64) / 0.36)
            : deep.clone().lerp(coast, ratio / 0.64);
        colors.push(color.r, color.g, color.b);
      }
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    };
  }, [parameter]);

  return (
    <RotatingRig playing={playing} speed={0.025} rotation={[-0.08, -0.08, -0.04]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cloud.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[cloud.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.032}
          sizeAttenuation
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </points>
    </RotatingRig>
  );
}

function PoincareField({ parameter, activeStep, playing }) {
  const geometry = useMemo(() => {
    const shape = new THREE.IcosahedronGeometry(1.55, 5);
    const positions = shape.attributes.position;
    const smoothness = THREE.MathUtils.smoothstep(parameter, 0, 1);

    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const length = Math.sqrt(x * x + y * y + z * z) || 1;
      const wave =
        Math.sin(x * 4.3 + y * 1.7) *
        Math.cos(y * 3.9 - z * 2.2) *
        Math.sin(z * 3.1 + x);
      const radius = 1.55 + (1 - smoothness) * wave * 0.28;
      positions.setXYZ(i, (x / length) * radius, (y / length) * radius, (z / length) * radius);
    }
    positions.needsUpdate = true;
    shape.computeVertexNormals();
    return shape;
  }, [parameter]);
  const wireGeometry = useMemo(() => geometry.clone(), [geometry]);

  const loopRadius = Math.max(0.04, 1.08 * (1 - parameter));

  return (
    <RotatingRig playing={playing} speed={0.07} rotation={[0.06, -0.28, 0.08]}>
      <mesh>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          color="#567ba6"
          roughness={0.68}
          metalness={0.05}
          transparent
          opacity={0.44}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh>
        <primitive object={wireGeometry} attach="geometry" />
        <meshBasicMaterial color="#9bb7cf" wireframe transparent opacity={0.28} />
      </mesh>
      <mesh scale={[1, 0.62, 1]} rotation={[Math.PI / 2, 0, activeStep * 0.13]}>
        <torusGeometry args={[loopRadius, 0.028, 8, 96]} />
        <meshBasicMaterial color="#e1b499" transparent opacity={0.92} />
      </mesh>
      <mesh scale={0.04 + parameter * 0.06}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#ead58f" />
      </mesh>
    </RotatingRig>
  );
}

function PnpField({ parameter, activeStep, playing }) {
  const maze = useMemo(() => {
    const size = Math.max(4, Math.round(parameter));
    const random = randomFactory(1971 + size);
    const spread = 3.8;
    const step = spread / (size - 1);
    const offset = spread / 2;
    const edges = [];
    const path = [];

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const x = col * step - offset;
        const y = row * step - offset;
        if (col < size - 1 && random() > 0.18) {
          edges.push(x, y, 0, x + step, y, 0);
        }
        if (row < size - 1 && random() > 0.18) {
          edges.push(x, y, 0, x, y + step, 0);
        }
      }
    }

    for (let row = 0; row < size; row += 1) {
      const forward = row % 2 === 0;
      const start = forward ? 0 : size - 1;
      const end = forward ? size - 1 : 0;
      for (
        let col = start;
        forward ? col < end : col > end;
        col += forward ? 1 : -1
      ) {
        const x = col * step - offset;
        const nextX = (col + (forward ? 1 : -1)) * step - offset;
        const y = row * step - offset;
        path.push(x, y, 0.04, nextX, y, 0.04);
      }
      if (row < size - 1) {
        const x = end * step - offset;
        const y = row * step - offset;
        path.push(x, y, 0.04, x, y + step, 0.04);
      }
    }

    return {
      edges: new Float32Array(edges),
      path: new Float32Array(path),
      size,
    };
  }, [parameter]);

  return (
    <RotatingRig playing={playing} speed={0.045} rotation={[-0.58, 0, 0.08]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[maze.edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#789bc5" transparent opacity={0.34} />
      </lineSegments>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[maze.path, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={activeStep >= 1 ? "#d77b7c" : "#d4bc8c"}
          transparent
          opacity={0.88}
        />
      </lineSegments>
      <mesh position={[-1.9, -1.9, 0.08]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshBasicMaterial color="#ead58f" />
      </mesh>
      <mesh position={[1.9, 1.9, 0.08]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshBasicMaterial color="#d77b7c" />
      </mesh>
    </RotatingRig>
  );
}

function SceneContent({ theoryId, parameter, activeStep, playing }) {
  if (theoryId === "riemann") {
    return <RiemannField parameter={parameter} activeStep={activeStep} playing={playing} />;
  }
  if (theoryId === "godel") {
    return <GodelField parameter={parameter} activeStep={activeStep} playing={playing} />;
  }
  if (theoryId === "mandelbrot") {
    return <MandelbrotField parameter={parameter} activeStep={activeStep} playing={playing} />;
  }
  if (theoryId === "poincare") {
    return <PoincareField parameter={parameter} activeStep={activeStep} playing={playing} />;
  }
  return <PnpField parameter={parameter} activeStep={activeStep} playing={playing} />;
}

export function TheoryScene({ theoryId, parameter, activeStep, playing }) {
  return (
    <Canvas
      dpr={[1, 1.65]}
      camera={{ position: [0.1, 0.05, theoryId === "mandelbrot" ? 5.6 : 5.15], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#101d32"]} />
      <fog attach="fog" args={["#101d32", 5.2, 9.4]} />
      <ambientLight intensity={1.65} />
      <directionalLight position={[3, 4, 4]} intensity={1.25} color="#a9c4df" />
      <Suspense fallback={null}>
        <SceneContent
          theoryId={theoryId}
          parameter={parameter}
          activeStep={activeStep}
          playing={playing}
        />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={3.4}
        maxDistance={7.2}
      />
    </Canvas>
  );
}
