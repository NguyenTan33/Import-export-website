"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { StowedBoxCoordinate, CenterOfGravity } from "@/types";
import {
  RotateCcw,
  Eye,
  Maximize2,
  Play,
  Pause,
  Layers,
  Box as BoxIcon,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Container3DCanvasProps {
  containerType: "20GP" | "40GP" | "40HC";
  stowedBoxes?: StowedBoxCoordinate[];
  centerOfGravity?: CenterOfGravity | null;
  totalCbm: number;
  capacityCbm: number;
  grossWeightKg: number;
  weightLimitKg: number;
}

export const Container3DCanvas: React.FC<Container3DCanvasProps> = ({
  containerType,
  stowedBoxes = [],
  centerOfGravity,
  totalCbm,
  capacityCbm,
  grossWeightKg,
  weightLimitKg,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const isVi = language === "vi";

  // State
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [hoveredBox, setHoveredBox] = useState<StowedBoxCoordinate | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedLayer, setSelectedLayer] = useState<number | "ALL">("ALL");
  const [showWireframeOnly, setShowWireframeOnly] = useState<boolean>(false);
  const [showDoors, setShowDoors] = useState<boolean>(true);

  // References to Three.js instances for dynamic camera presets
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // ISO Container standard dimensions (meters)
  const dimensions = useMemo(() => {
    switch (containerType) {
      case "20GP":
        return { length: 5.9, width: 2.35, height: 2.39, name: "20ft General Purpose" };
      case "40GP":
        return { length: 12.03, width: 2.35, height: 2.39, name: "40ft General Purpose" };
      case "40HC":
      default:
        return { length: 12.03, width: 2.35, height: 2.69, name: "40ft High Cube" };
    }
  }, [containerType]);

  // Max layer index in stowedBoxes
  const maxLayer = useMemo(() => {
    if (!stowedBoxes || stowedBoxes.length === 0) return 0;
    return Math.max(...stowedBoxes.map((b) => b.layerIndex || 0));
  }, [stowedBoxes]);

  // Filtered boxes based on selected layer
  const filteredBoxes = useMemo(() => {
    if (!stowedBoxes) return [];
    if (selectedLayer === "ALL") return stowedBoxes;
    return stowedBoxes.filter((b) => b.layerIndex <= selectedLayer);
  }, [stowedBoxes, selectedLayer]);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    // 1. Scene, Camera, Renderer
    const width = mountEl.clientWidth || 800;
    const height = mountEl.clientHeight || 520;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f1d); // Deep Maritime Blue

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    const L = dimensions.length;
    const H = dimensions.height;
    const W = dimensions.width;

    // Initial camera position (Iso view)
    camera.position.set(L * 0.95, H * 2.2, W * 2.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountEl.appendChild(renderer.domElement);

    // 2. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't flip below ground
    controls.minDistance = 3;
    controls.maxDistance = 45;
    controls.target.set(0, H * 0.45, 0);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(L, H * 3, W * 2);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x90caf9, 0.7);
    dirLight2.position.set(-L, H * 2, -W * 2);
    scene.add(dirLight2);

    // 4. Ground Grid & Reflection Plane
    const gridHelper = new THREE.GridHelper(Math.max(24, L * 2), 24, 0x1e3a8a, 0x112240);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // 5. Container Structure Group
    const containerGroup = new THREE.Group();
    scene.add(containerGroup);

    // Floor (Wooden Container Planks)
    const floorGeo = new THREE.BoxGeometry(L, 0.06, W);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x4e342e,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, 0.03, 0);
    floorMesh.receiveShadow = true;
    containerGroup.add(floorMesh);

    // Container Steel Outer Frame (Edges & Posts)
    const frameGeo = new THREE.BoxGeometry(L, H, W);
    const frameEdges = new THREE.EdgesGeometry(frameGeo);
    const frameLine = new THREE.LineSegments(
      frameEdges,
      new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 2 }) // Cyan neon edge
    );
    frameLine.position.set(0, H / 2, 0);
    containerGroup.add(frameLine);

    // Semi-Transparent Corrugated Side Panels (Left & Right)
    const sideWallGeo = new THREE.BoxGeometry(L, H, 0.03);
    const sideWallMat = new THREE.MeshStandardMaterial({
      color: 0x0d47a1,
      transparent: true,
      opacity: 0.2,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });

    const leftWall = new THREE.Mesh(sideWallGeo, sideWallMat);
    leftWall.position.set(0, H / 2, -W / 2);
    containerGroup.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, sideWallMat);
    rightWall.position.set(0, H / 2, W / 2);
    containerGroup.add(rightWall);

    // Front Wall (Bulkhead)
    const frontWallGeo = new THREE.BoxGeometry(0.04, H, W);
    const frontWallMat = new THREE.MeshStandardMaterial({
      color: 0x0a2472,
      roughness: 0.5,
      metalness: 0.3,
    });
    const frontWall = new THREE.Mesh(frontWallGeo, frontWallMat);
    frontWall.position.set(-L / 2, H / 2, 0);
    containerGroup.add(frontWall);

    // Roof (Top panel)
    const roofGeo = new THREE.BoxGeometry(L, 0.02, W);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x0d47a1,
      transparent: true,
      opacity: 0.15,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, H, 0);
    containerGroup.add(roofMesh);

    // Open Rear Doors
    if (showDoors) {
      const doorWidth = W / 2 - 0.02;
      const doorGeo = new THREE.BoxGeometry(0.04, H - 0.04, doorWidth);
      const doorMat = new THREE.MeshStandardMaterial({
        color: 0x1565c0,
        metalness: 0.5,
        roughness: 0.4,
      });

      // Left door open at 115 degrees
      const leftDoorPivot = new THREE.Group();
      leftDoorPivot.position.set(L / 2, H / 2, -W / 2);
      const leftDoor = new THREE.Mesh(doorGeo, doorMat);
      leftDoor.position.set(0, 0, doorWidth / 2);
      leftDoorPivot.add(leftDoor);
      leftDoorPivot.rotation.y = -Math.PI * 0.65;
      containerGroup.add(leftDoorPivot);

      // Right door open at 115 degrees
      const rightDoorPivot = new THREE.Group();
      rightDoorPivot.position.set(L / 2, H / 2, W / 2);
      const rightDoor = new THREE.Mesh(doorGeo, doorMat);
      rightDoor.position.set(0, 0, -doorWidth / 2);
      rightDoorPivot.add(rightDoor);
      rightDoorPivot.rotation.y = Math.PI * 0.65;
      containerGroup.add(rightDoorPivot);
    }

    // 6. Render Stowed Cargo Boxes
    const boxesGroup = new THREE.Group();
    scene.add(boxesGroup);

    const boxMeshes: THREE.Mesh[] = [];

    filteredBoxes.forEach((b, index) => {
      const geo = new THREE.BoxGeometry(b.lengthM, b.heightM, b.widthM);
      const hexColor = parseInt(b.colorHex.replace("#", "0x"), 16) || 0x0e4b94;

      const mat = new THREE.MeshStandardMaterial({
        color: hexColor,
        roughness: 0.65,
        metalness: 0.1,
        wireframe: showWireframeOnly,
      });

      const mesh = new THREE.Mesh(geo, mat);

      const posX = ((b as any).x ?? (b as any).X ?? 0) - L / 2 + b.lengthM / 2;
      const posY = ((b as any).y ?? (b as any).Y ?? 0) + b.heightM / 2 + 0.06;
      const posZ = ((b as any).z ?? (b as any).Z ?? 0) - W / 2 + b.widthM / 2;

      mesh.position.set(posX, posY, posZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { box: b, index };

      // High-contrast box edges
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeLine = new THREE.LineSegments(
        edgeGeo,
        new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })
      );
      mesh.add(edgeLine);

      boxesGroup.add(mesh);
      boxMeshes.push(mesh);
    });

    // 7. Center of Gravity (CoG) 3D Marker
    if (centerOfGravity) {
      const cogGroup = new THREE.Group();
      const cogSphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const cogColor =
        centerOfGravity.balanceStatus === "BALANCED_SAFE" ? 0x00e676 : 0xff1744;
      const cogMat = new THREE.MeshBasicMaterial({ color: cogColor });
      const cogSphere = new THREE.Mesh(cogSphereGeo, cogMat);

      // Target position
      const posX = centerOfGravity.centerXM - L / 2;
      const posY = centerOfGravity.centerYM + 0.06;
      const posZ = centerOfGravity.centerZM - W / 2;

      cogSphere.position.set(posX, posY, posZ);
      cogGroup.add(cogSphere);

      // Plumb line down to floor
      const lineMat = new THREE.LineDashedMaterial({
        color: cogColor,
        dashSize: 0.1,
        gapSize: 0.05,
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(posX, posY, posZ),
        new THREE.Vector3(posX, 0.06, posZ),
      ]);
      const plumbLine = new THREE.Line(lineGeo, lineMat);
      plumbLine.computeLineDistances();
      cogGroup.add(plumbLine);

      // Target ring on floor
      const ringGeo = new THREE.RingGeometry(0.15, 0.35, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cogColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(posX, 0.07, posZ);
      cogGroup.add(ring);

      scene.add(cogGroup);
    }

    // 8. Raycasting for carton inspection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      setMousePos({ x: e.clientX, y: e.clientY });

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(boxMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        setHoveredBox(hit.userData.box as StowedBoxCoordinate);
      } else {
        setHoveredBox(null);
      }
    };

    renderer.domElement.addEventListener("mousemove", onPointerMove);

    // 9. Resize Observer
    const handleResize = () => {
      if (!mountEl) return;
      const newW = mountEl.clientWidth;
      const newH = mountEl.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    // 10. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.2;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", onPointerMove);
      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [dimensions, filteredBoxes, centerOfGravity, autoRotate, showDoors, showWireframeOnly]);

  // View Preset Handlers
  const setViewPreset = (view: "iso" | "top" | "side" | "rear") => {
    if (!cameraRef.current || !controlsRef.current) return;
    const L = dimensions.length;
    const H = dimensions.height;
    const W = dimensions.width;

    switch (view) {
      case "iso":
        cameraRef.current.position.set(L * 0.95, H * 2.2, W * 2.6);
        break;
      case "top":
        cameraRef.current.position.set(0, H * 3.8, 0.01);
        break;
      case "side":
        cameraRef.current.position.set(0, H * 0.7, W * 3.4);
        break;
      case "rear":
        cameraRef.current.position.set(L * 1.6, H * 0.6, 0);
        break;
    }
    controlsRef.current.target.set(0, H * 0.45, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative border-2 border-black bg-neutral-950 rounded overflow-hidden select-none shadow-xl">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-[520px] cursor-grab active:cursor-grabbing" />

      {/* Top Overlay: Container Specs & Capacity Gauge */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="bg-black/85 backdrop-blur-md border border-neutral-700 px-3.5 py-2 rounded text-xs font-mono text-white pointer-events-auto shadow-md">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <strong className="text-cyan-300 uppercase">{dimensions.name}</strong>
            <span className="text-neutral-400">|</span>
            <span>
              {dimensions.length}m × {dimensions.width}m × {dimensions.height}m
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-neutral-300">
            <span>
              {isVi ? "Sức chứa:" : "Capacity:"} <strong className="text-white">{capacityCbm} CBM</strong>
            </span>
            <span>•</span>
            <span>
              {isVi ? "Đã xếp:" : "Loaded:"}{" "}
              <strong className="text-cyan-300">{stowedBoxes.length} {isVi ? "thùng" : "ctns"}</strong> (
              {totalCbm.toFixed(2)} m³)
            </span>
          </div>
        </div>

        {/* Center of Gravity Status HUD Badge */}
        {centerOfGravity && (
          <div
            className={`pointer-events-auto border px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-2 backdrop-blur-md shadow-md ${
              centerOfGravity.balanceStatus === "BALANCED_SAFE"
                ? "bg-emerald-950/85 border-emerald-500 text-emerald-300"
                : "bg-red-950/85 border-red-500 text-red-300"
            }`}
          >
            {centerOfGravity.balanceStatus === "BALANCED_SAFE" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <div>
              <span>{isVi ? centerOfGravity.statusTextVi : centerOfGravity.statusTextEn}</span>
              <span className="block text-[10px] font-normal text-neutral-300">
                CoG: ({centerOfGravity.centerXM}m, {centerOfGravity.centerYM}m, {centerOfGravity.centerZM}m)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Tooltip for Hovered Cargo Box */}
      {hoveredBox && (
        <div
          className="fixed z-50 pointer-events-none bg-black/90 backdrop-blur-md border border-cyan-400/70 p-3 rounded text-white text-xs font-mono shadow-2xl space-y-1"
          style={{
            left: `${mousePos.x + 16}px`,
            top: `${mousePos.y + 16}px`,
          }}
        >
          <div className="flex items-center gap-2 font-bold text-cyan-300 border-b border-neutral-700 pb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: hoveredBox.colorHex }}
            />
            <span>{hoveredBox.itemName}</span>
          </div>
          <div className="text-[11px] text-neutral-300">
            <div>SKU: <strong className="text-white">{hoveredBox.sku}</strong></div>
            <div>
              {isVi ? "Kích thước:" : "Dimensions:"}{" "}
              <strong className="text-white">
                {(hoveredBox.lengthM * 100).toFixed(0)} × {(hoveredBox.widthM * 100).toFixed(0)} ×{" "}
                {(hoveredBox.heightM * 100).toFixed(0)} cm
              </strong>
            </div>
            <div>
              {isVi ? "Trọng lượng:" : "Weight:"} <strong className="text-white">{hoveredBox.weightKg} kg</strong>
            </div>
            <div>
              {isVi ? "Tầng xếp hàng:" : "Stowage Layer:"}{" "}
              <strong className="text-cyan-300">#{hoveredBox.layerIndex + 1}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Control Bar: View Presets, Auto-Rotate & Layer Peeling Slider */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* View Angles Presets */}
        <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-neutral-700 p-1.5 rounded pointer-events-auto">
          <button
            type="button"
            onClick={() => setViewPreset("iso")}
            className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-white hover:bg-neutral-800 rounded transition-colors"
          >
            3D Iso
          </button>
          <button
            type="button"
            onClick={() => setViewPreset("top")}
            className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            {isVi ? "Nóc (Top)" : "Top"}
          </button>
          <button
            type="button"
            onClick={() => setViewPreset("side")}
            className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            {isVi ? "Mạn (Side)" : "Side"}
          </button>
          <button
            type="button"
            onClick={() => setViewPreset("rear")}
            className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            {isVi ? "Cửa cont" : "Doors"}
          </button>
        </div>

        {/* Center: Layer Peeling Controls */}
        {maxLayer > 0 && (
          <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md border border-neutral-700 px-3 py-1.5 rounded text-xs font-mono text-white pointer-events-auto">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-neutral-400">{isVi ? "Lớp:" : "Layer:"}</span>
            <button
              type="button"
              onClick={() => setSelectedLayer("ALL")}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                selectedLayer === "ALL" ? "bg-cyan-500 text-black" : "bg-neutral-800 text-white"
              }`}
            >
              {isVi ? "Toàn bộ" : "All"}
            </button>
            <input
              type="range"
              min="0"
              max={maxLayer}
              value={selectedLayer === "ALL" ? maxLayer : selectedLayer}
              onChange={(e) => setSelectedLayer(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="text-cyan-300 font-bold">
              {selectedLayer === "ALL" ? `${maxLayer + 1}/${maxLayer + 1}` : `${(selectedLayer as number) + 1}/${maxLayer + 1}`}
            </span>
          </div>
        )}

        {/* Right: Quick Toggles (Auto Rotate & Wireframe) */}
        <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-neutral-700 p-1.5 rounded pointer-events-auto">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded text-xs transition-colors ${
              autoRotate ? "bg-cyan-500 text-black font-bold" : "text-neutral-300 hover:bg-neutral-800"
            }`}
            title={isVi ? "Tự động xoay 360°" : "Auto Rotate 360°"}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setShowWireframeOnly(!showWireframeOnly)}
            className={`p-1.5 rounded text-xs transition-colors ${
              showWireframeOnly ? "bg-cyan-500 text-black font-bold" : "text-neutral-300 hover:bg-neutral-800"
            }`}
            title={isVi ? "Chế độ lưới khung (Wireframe)" : "Wireframe Mode"}
          >
            <BoxIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewPreset("iso")}
            className="p-1.5 rounded text-neutral-300 hover:bg-neutral-800 text-xs transition-colors"
            title={isVi ? "Đặt lại góc nhìn ban đầu" : "Reset Camera View"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
