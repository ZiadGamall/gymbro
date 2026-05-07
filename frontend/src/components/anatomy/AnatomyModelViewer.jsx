import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { detectMuscleGroup } from "../../data/anatomyExerciseMap";

const BASE_COLOR = new THREE.Color("#7c4f43");
const HOVER_COLOR = new THREE.Color("#d37f67");
const SELECT_COLOR = new THREE.Color("#f2a66e");

function inferMuscleGroupFromNormalized(xRel, yRel, zRel) {
  const absX = Math.abs(xRel);
  const absZ = Math.abs(zRel);
  const frontBias = zRel > 0.08;
  const backBias = zRel < -0.08;

  if (yRel > 0.72) {
    return absX > 0.38 ? "deltoids" : "trapezius";
  }

  if (yRel > 0.45) {
    if (absX > 0.58) {
      return frontBias ? "biceps_brachii" : "triceps_brachii";
    }
    if (absX > 0.3) {
      return backBias ? "latissimus_dorsi" : "deltoids";
    }
    return frontBias ? "pectoralis_major" : "trapezius";
  }

  if (yRel > 0.2) {
    if (absX > 0.68) return "forearms";
    if (absX > 0.4) {
      return backBias ? "latissimus_dorsi" : "obliques";
    }
    return frontBias ? "rectus_abdominis" : "erector_spinae";
  }

  if (yRel > -0.08) {
    if (absX > 0.34) {
      return backBias ? "gluteus_maximus" : "quadriceps";
    }
    return backBias ? "gluteus_maximus" : "rectus_abdominis";
  }

  if (yRel > -0.52) {
    if (backBias || absZ < 0.08) return "hamstrings";
    return "quadriceps";
  }

  if (yRel <= -0.52) return "gastrocnemius";

  return null;
}

function inferMuscleGroupFromPosition(mesh, bodyBox) {
  if (!bodyBox || bodyBox.isEmpty()) return null;

  const meshBox = new THREE.Box3().setFromObject(mesh);
  if (meshBox.isEmpty()) return null;

  const center = meshBox.getCenter(new THREE.Vector3());
  const bodySize = bodyBox.getSize(new THREE.Vector3());
  const bodyCenter = bodyBox.getCenter(new THREE.Vector3());

  const xRel = (center.x - bodyCenter.x) / Math.max(bodySize.x / 2, 0.001);
  const yRel = (center.y - bodyCenter.y) / Math.max(bodySize.y / 2, 0.001);
  const zRel = (center.z - bodyCenter.z) / Math.max(bodySize.z / 2, 0.001);

  return inferMuscleGroupFromNormalized(xRel, yRel, zRel);
}

function inferMuscleGroupFromWorldPoint(point, bodyBox) {
  if (!bodyBox || bodyBox.isEmpty() || !point) return null;

  const bodySize = bodyBox.getSize(new THREE.Vector3());
  const bodyCenter = bodyBox.getCenter(new THREE.Vector3());

  const xRel = (point.x - bodyCenter.x) / Math.max(bodySize.x / 2, 0.001);
  const yRel = (point.y - bodyCenter.y) / Math.max(bodySize.y / 2, 0.001);
  const zRel = (point.z - bodyCenter.z) / Math.max(bodySize.z / 2, 0.001);

  return inferMuscleGroupFromNormalized(xRel, yRel, zRel);
}

function AnatomyModel({
  url,
  hoveredGroup,
  selectedGroup,
  onHover,
  onLeave,
  onSelect,
  onModelReady,
  controlsRef,
  customAliases,
}) {
  const { scene } = useGLTF(url);
  const rootRef = useRef();
  const { camera } = useThree();
  const [hoverPoint, setHoverPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const bodyBox = useMemo(() => new THREE.Box3().setFromObject(scene), [scene]);

  const mappingStats = useMemo(() => {
    let total = 0;
    let mapped = 0;
    const unmatched = new Set();

    scene.traverse((child) => {
      if (!child.isMesh) return;
      total += 1;
      const nameMapped = detectMuscleGroup(child.name, customAliases);
      const group = nameMapped || inferMuscleGroupFromPosition(child, bodyBox);
      child.userData.muscleGroup = group;
      if (group) {
        mapped += 1;
      } else {
        unmatched.add(child.name || "unnamed_mesh");
      }
    });

    return {
      totalMeshes: total,
      mappedMeshes: mapped,
      unmatchedNames: Array.from(unmatched).slice(0, 50),
      lowGranularity: total <= 3,
    };
  }, [scene, customAliases, bodyBox]);

  useEffect(() => {
    if (!mappingStats.lowGranularity || !rootRef.current) return;

    // For low-granularity assets (single/few meshes), avoid mesh-wide labels.
    rootRef.current.traverse((child) => {
      if (!child.isMesh) return;
      child.userData.muscleGroup = null;
    });
  }, [mappingStats.lowGranularity]);

  useEffect(() => {
    onModelReady?.(mappingStats);
  }, [mappingStats, onModelReady]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = Math.max(4, maxDim * 1.85);

    camera.position.set(center.x, center.y + maxDim * 0.08, center.z + distance);
    camera.near = Math.max(0.01, maxDim / 200);
    camera.far = Math.max(100, maxDim * 60);
    camera.updateProjectionMatrix();

    if (controlsRef?.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, [scene, camera, controlsRef]);

  useFrame(() => {
    if (!rootRef.current) return;

    rootRef.current.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const group = child.userData.muscleGroup;
      const isHovered = hoveredGroup && group === hoveredGroup;
      const isSelected = selectedGroup && group === selectedGroup;

      const canTintByMesh = !mappingStats.lowGranularity;
      const target = canTintByMesh
        ? isSelected
          ? SELECT_COLOR
          : isHovered
            ? HOVER_COLOR
            : BASE_COLOR
        : BASE_COLOR;

      child.material.color.lerp(target, 0.16);
      child.material.emissive = child.material.emissive || new THREE.Color("#000000");
      child.material.emissive.lerp(
        isSelected || isHovered ? new THREE.Color("#00ffe1") : new THREE.Color("#000000"),
        0.16,
      );
      child.material.emissiveIntensity = isSelected ? 0.42 : isHovered ? 0.25 : 0;
      child.material.roughness = 0.58;
      child.material.metalness = 0.02;
      child.material.transparent = true;
      child.material.opacity = 0.98;
    });
  });

  return (
    <group
      ref={rootRef}
      onPointerMove={(event) => {
        event.stopPropagation();
        const pointGroup = inferMuscleGroupFromWorldPoint(event.point, bodyBox);
        const meshGroup = event.object?.userData?.muscleGroup || null;
        const muscleGroup = mappingStats.lowGranularity ? pointGroup : meshGroup || pointGroup;
        setHoverPoint(event.point?.clone?.() || null);
        onHover(muscleGroup);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHoverPoint(null);
        onLeave();
      }}
      onClick={(event) => {
        event.stopPropagation();
        const pointGroup = inferMuscleGroupFromWorldPoint(event.point, bodyBox);
        const meshGroup = event.object?.userData?.muscleGroup || null;
        const muscleGroup = mappingStats.lowGranularity ? pointGroup : meshGroup || pointGroup;
        const meshName = event.object?.name || "unnamed_mesh";
        setSelectedPoint(event.point?.clone?.() || null);
        onSelect({ muscleGroup, meshName });
      }}
    >
      <primitive object={scene} />

      {hoverPoint && (
        <mesh position={hoverPoint}>
          <sphereGeometry args={[0.03, 14, 14]} />
          <meshStandardMaterial color="#63f6de" emissive="#63f6de" emissiveIntensity={0.8} />
        </mesh>
      )}

      {selectedPoint && (
        <mesh position={selectedPoint}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="#f2a66e" emissive="#f2a66e" emissiveIntensity={0.85} />
        </mesh>
      )}
    </group>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
        Loading anatomical model...
      </div>
    </Html>
  );
}

export default function AnatomyModelViewer({
  modelUrl,
  hoveredGroup,
  selectedGroup,
  onHover,
  onLeave,
  onSelect,
  onModelReady,
  customAliases,
}) {
  const controlsRef = useRef(null);

  return (
    <div className="h-[700px] rounded-2xl border border-[var(--border)] bg-[linear-gradient(165deg,#0f181f,#0a1116)] overflow-hidden">
      <Canvas camera={{ position: [0, 1.4, 8], fov: 50 }} shadows>
        <color attach="background" args={["#0b1218"]} />
        <ambientLight intensity={0.6} />
        <directionalLight intensity={1.2} position={[3, 5, 2]} castShadow />
        <directionalLight intensity={0.5} position={[-3, 2, -2]} />
        <Suspense fallback={<Loader />}>
          <AnatomyModel
            url={modelUrl}
            hoveredGroup={hoveredGroup}
            selectedGroup={selectedGroup}
            onHover={onHover}
            onLeave={onLeave}
            onSelect={onSelect}
            onModelReady={onModelReady}
            controlsRef={controlsRef}
            customAliases={customAliases}
          />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={0.75}
          maxDistance={42}
          minPolarAngle={Math.PI / 2.8}
          maxPolarAngle={Math.PI / 1.95}
          rotateSpeed={0.85}
          zoomSpeed={0.95}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/human-muscular-system.glb");
