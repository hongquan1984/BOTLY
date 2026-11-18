import * as THREE from 'three';

export interface CameraControllerResult {
  camera: THREE.PerspectiveCamera;
  resetView: () => void;
  setOverviewView: () => void;
  setCloseView: (target?: THREE.Vector3) => void;
  focusOn: (target: THREE.Vector3, offset?: [number, number, number]) => void;
  update: (delta: number) => void;
  handlePointerDown: (e: PointerEvent) => void;
  handlePointerMove: (e: PointerEvent) => void;
  handlePointerUp: (e: PointerEvent) => void;
  handleWheel: (e: WheelEvent) => void;
}

export function createCameraController(
  canvas: HTMLCanvasElement
): CameraControllerResult {
  const camera = new THREE.PerspectiveCamera(
    48,
    window.innerWidth / window.innerHeight,
    0.5,
    600
  );

  // Initial cinematic overview diorama angle
  // Elevated isometric-style diagonal view overlooking the castle & village
  const defaultTarget = new THREE.Vector3(0, 2.2, 0);
  const defaultOffset = new THREE.Vector3(28, 24, 28);

  const currentTarget = defaultTarget.clone();
  const desiredTarget = defaultTarget.clone();

  // Spherical coordinates for smooth orbit
  let radius = defaultOffset.length();
  let theta = Math.atan2(defaultOffset.x, defaultOffset.z);
  let phi = Math.acos(defaultOffset.y / radius);

  let desiredRadius = radius;
  let desiredTheta = theta;
  let desiredPhi = phi;

  // Limits to prevent going underground or losing the floating island
  const minRadius = 12.0;
  const maxRadius = 95.0;
  const minPhi = 0.25; // ~14 deg above horizon
  const maxPhi = 1.38; // ~79 deg (high angle down, never underground)

  // Pointer tracking
  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;
  let activePointers: { id: number; x: number; y: number }[] = [];
  let prevPinchDist = 0;

  function updateCameraPosition() {
    const sinPhi = Math.sin(phi);
    camera.position.x = currentTarget.x + radius * sinPhi * Math.sin(theta);
    camera.position.y = currentTarget.y + radius * Math.cos(phi);
    camera.position.z = currentTarget.z + radius * sinPhi * Math.cos(theta);
    camera.lookAt(currentTarget);
  }

  updateCameraPosition();

  function resetView() {
    desiredTarget.copy(defaultTarget);
    desiredRadius = defaultOffset.length();
    desiredTheta = Math.atan2(defaultOffset.x, defaultOffset.z);
    desiredPhi = Math.acos(defaultOffset.y / desiredRadius);
  }

  function setOverviewView() {
    // Panoramic overview angle framing the floating village in the lower/mid area, leaving the sky open for dialogue
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait) {
      // By looking higher at Y = 5.8, the 3D island is pushed DOWN into the lower-middle screen!
      desiredTarget.set(0, 5.8, 0);
      desiredRadius = 79.0;
      desiredTheta = Math.PI / 4;
      desiredPhi = 1.04; // Steeper angle to see all buildings cleanly
    } else {
      desiredTarget.set(0, 4.2, 0);
      desiredRadius = 50.0;
      desiredTheta = Math.PI / 4;
      desiredPhi = 0.98;
    }
  }

  function setCloseView(target?: THREE.Vector3) {
    if (target) {
      desiredTarget.copy(target);
    }
    desiredRadius = 14.5;
    desiredPhi = 1.05;
  }

  function focusOn(target: THREE.Vector3, offset?: [number, number, number]) {
    desiredTarget.copy(target);
    if (offset) {
      const offVec = new THREE.Vector3(...offset);
      desiredRadius = offVec.length();
      desiredTheta = Math.atan2(offVec.x, offVec.z);
      desiredPhi = Math.acos(offVec.y / desiredRadius);
    } else {
      desiredRadius = 18.0;
      desiredPhi = 0.85;
    }
  }

  function handlePointerDown(e: PointerEvent) {
    activePointers.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
    if (activePointers.length === 1) {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    } else if (activePointers.length === 2) {
      isDragging = false;
      const dx = activePointers[0].x - activePointers[1].x;
      const dy = activePointers[0].y - activePointers[1].y;
      prevPinchDist = Math.hypot(dx, dy);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    const idx = activePointers.findIndex((p) => p.id === e.pointerId);
    if (idx !== -1) {
      activePointers[idx].x = e.clientX;
      activePointers[idx].y = e.clientY;
    }

    if (activePointers.length === 2) {
      // Two-finger pinch to zoom on mobile
      const dx = activePointers[0].x - activePointers[1].x;
      const dy = activePointers[0].y - activePointers[1].y;
      const dist = Math.hypot(dx, dy);
      if (prevPinchDist > 0) {
        const factor = prevPinchDist / dist;
        desiredRadius = Math.max(minRadius, Math.min(maxRadius, desiredRadius * factor));
      }
      prevPinchDist = dist;
      return;
    }

    if (!isDragging || activePointers.length !== 1) return;

    const deltaX = e.clientX - prevPointerX;
    const deltaY = e.clientY - prevPointerY;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;

    const rotSpeed = 0.0055;
    desiredTheta -= deltaX * rotSpeed;
    desiredPhi -= deltaY * rotSpeed;
    desiredPhi = Math.max(minPhi, Math.min(maxPhi, desiredPhi));
  }

  function handlePointerUp(e: PointerEvent) {
    activePointers = activePointers.filter((p) => p.id !== e.pointerId);
    if (activePointers.length === 0) {
      isDragging = false;
      prevPinchDist = 0;
    } else if (activePointers.length === 1) {
      isDragging = true;
      prevPointerX = activePointers[0].x;
      prevPointerY = activePointers[0].y;
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    desiredRadius = Math.max(minRadius, Math.min(maxRadius, desiredRadius * zoomFactor));
  }

  return {
    camera,
    resetView,
    setOverviewView,
    setCloseView,
    focusOn,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    update: (delta: number) => {
      // Smooth interpolation (lerp) toward target parameters
      const t = Math.min(1.0, delta * 5.0);
      radius += (desiredRadius - radius) * t;
      theta += (desiredTheta - theta) * t;
      phi += (desiredPhi - phi) * t;
      currentTarget.lerp(desiredTarget, t);

      updateCameraPosition();
    },
  };
}
