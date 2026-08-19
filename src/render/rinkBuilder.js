import * as THREE from 'three';
import { makeIceTexture, makeNettingTexture } from './textures.js';

// World layout: net/goal-line sits at z=0, x=0 is rink centerline.
// Positive z runs toward the shooter (puck starts around z=15.5).
// Negative z is behind the net. Positive x = goalie's left glove side.
export const NET_HALF_WIDTH = 0.92;
export const NET_HEIGHT = 1.22;
export const CREASE_Z = 1.7;
export const PUCK_START_Z = 10.5;

function crowdTexture(colors, cols = 46, rows = 10) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, c.width, c.height);
  const cw = c.width / cols, ch = c.height / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      const jx = (Math.random() - 0.5) * cw * 0.3;
      const jy = (Math.random() - 0.5) * ch * 0.3;
      ctx.beginPath();
      ctx.arc(col * cw + cw / 2 + jx, r * ch + ch / 2 + jy, Math.min(cw, ch) * 0.38, 0, Math.PI * 2);
      ctx.fill();
      if (Math.random() < 0.06) {
        ctx.fillStyle = '#ffd76b';
        ctx.beginPath();
        ctx.arc(col * cw + cw / 2 + jx, r * ch + ch / 2 + jy - ch * 0.5, cw * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function buildRink(scene, arena) {
  const group = new THREE.Group();
  scene.background = new THREE.Color(arena.sky);
  scene.fog = new THREE.FogExp2(arena.fog, arena.fogDensity);

  // Ice
  const iceTex = makeIceTexture(arena.iceColor);
  const iceGeo = new THREE.PlaneGeometry(28, 46);
  const iceMat = new THREE.MeshStandardMaterial({ map: iceTex, roughness: 0.25, metalness: 0.05 });
  const ice = new THREE.Mesh(iceGeo, iceMat);
  ice.rotation.x = -Math.PI / 2;
  ice.position.set(0, 0, 5);
  ice.receiveShadow = true;
  group.add(ice);

  // Boards (perimeter)
  const boardMat = new THREE.MeshStandardMaterial({ color: arena.boardColor, roughness: 0.6 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0 });
  function boardWall(w, h, x, z, rotY) {
    const g = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), boardMat);
    board.position.y = h / 2;
    g.add(board);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, 0.05), glassMat);
    glass.position.y = h + 0.7;
    g.add(glass);
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    return g;
  }
  group.add(boardWall(28.4, 1.1, 0, -18, 0));
  group.add(boardWall(28.4, 1.1, 0, 28, 0));
  group.add(boardWall(46.4, 1.1, -14, 5, Math.PI / 2));
  group.add(boardWall(46.4, 1.1, 14, 5, Math.PI / 2));

  // Net
  const netGroup = buildNet();
  netGroup.position.set(0, 0, 0);
  group.add(netGroup);

  // Crowd stands
  const crowdGroup = new THREE.Group();
  const tex = crowdTexture(arena.crowdColors);
  const rows = Math.max(1, arena.crowdRows);
  for (let r = 0; r < rows; r++) {
    const seg = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 2.4),
      new THREE.MeshBasicMaterial({ map: tex, transparent: false })
    );
    seg.position.set(0, 2.2 + r * 2.15, -19.5 - r * 1.6);
    seg.rotation.x = -0.12;
    crowdGroup.add(seg);
    if (arena.crowdDensity > 0.3) {
      const side1 = new THREE.Mesh(new THREE.PlaneGeometry(48, 2.2), new THREE.MeshBasicMaterial({ map: tex }));
      side1.position.set(-15.6 - r * 1.4, 2.1 + r * 2.05, 5);
      side1.rotation.y = Math.PI / 2; side1.rotation.x = -0.1;
      crowdGroup.add(side1);
      const side2 = side1.clone();
      side2.position.x = 15.6 + r * 1.4;
      side2.rotation.y = -Math.PI / 2;
      crowdGroup.add(side2);
    }
  }
  group.add(crowdGroup);

  // Lighting
  const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, arena.ambientIntensity);
  group.add(hemi);
  const key = new THREE.DirectionalLight(arena.lightColor, arena.lightIntensity);
  key.position.set(6, 14, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -16; key.shadow.camera.right = 16;
  key.shadow.camera.top = 16; key.shadow.camera.bottom = -16;
  group.add(key);
  const rim = new THREE.DirectionalLight(arena.lightColor, arena.lightIntensity * 0.4);
  rim.position.set(-8, 6, -6);
  group.add(rim);

  const spotlights = [];
  if (arena.hasSpotlights) {
    for (const x of [-10, 10]) {
      const spot = new THREE.SpotLight(0xffffff, 1.4, 60, Math.PI / 7, 0.4, 1.2);
      spot.position.set(x, 18, 8);
      spot.target.position.set(0, 0, 2);
      group.add(spot); group.add(spot.target);
      spotlights.push(spot);
    }
  }

  scene.add(group);
  return { group, netGroup, crowdGroup, spotlights, hemi, key };
}

function buildNet() {
  const g = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0xdd2222, metalness: 0.3, roughness: 0.4 });
  const postGeo = new THREE.CylinderGeometry(0.045, 0.045, NET_HEIGHT, 12);
  const left = new THREE.Mesh(postGeo, postMat);
  left.position.set(-NET_HALF_WIDTH, NET_HEIGHT / 2, 0);
  left.castShadow = true;
  const right = left.clone();
  right.position.x = NET_HALF_WIDTH;
  const crossbarGeo = new THREE.CylinderGeometry(0.045, 0.045, NET_HALF_WIDTH * 2, 12);
  const crossbar = new THREE.Mesh(crossbarGeo, postMat);
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position.set(0, NET_HEIGHT, 0);
  crossbar.castShadow = true;
  g.add(left, right, crossbar);

  // back frame (tapered net depth)
  const depth = 1.0;
  const backTopZ = -depth;
  const backHalfWidth = NET_HALF_WIDTH * 0.72;
  const backLeft = new THREE.Mesh(postGeo.clone(), postMat);
  backLeft.geometry = new THREE.CylinderGeometry(0.035, 0.035, NET_HEIGHT * 0.9, 8);
  backLeft.position.set(-backHalfWidth, NET_HEIGHT * 0.45, backTopZ);
  const backRight = backLeft.clone();
  backRight.position.x = backHalfWidth;
  g.add(backLeft, backRight);

  const nettingTex = makeNettingTexture();
  const netMat = new THREE.MeshBasicMaterial({ map: nettingTex, color: 0xffffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide });

  // back panel (angled)
  const backPanelShape = new THREE.PlaneGeometry(backHalfWidth * 2, Math.hypot(depth, NET_HEIGHT * 0.9));
  const backPanel = new THREE.Mesh(backPanelShape, netMat);
  backPanel.position.set(0, NET_HEIGHT * 0.45, backTopZ * 0.5);
  const angle = Math.atan2(depth, NET_HEIGHT * 0.9);
  backPanel.rotation.x = Math.PI / 2 - angle;
  g.add(backPanel);

  // side panels
  function sidePanel(sign) {
    const w = Math.hypot(depth, NET_HALF_WIDTH - backHalfWidth);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, NET_HEIGHT * 0.95), netMat);
    panel.position.set(sign * (NET_HALF_WIDTH + backHalfWidth) / 2, NET_HEIGHT * 0.47, backTopZ / 2);
    panel.rotation.y = sign * (Math.PI / 2 - Math.atan2(depth, NET_HALF_WIDTH - backHalfWidth));
    return panel;
  }
  g.add(sidePanel(1), sidePanel(-1));

  // top back panel
  const topPanel = new THREE.Mesh(new THREE.PlaneGeometry(backHalfWidth * 2, Math.hypot(depth, NET_HEIGHT - NET_HEIGHT * 0.9)), netMat);
  topPanel.position.set(0, NET_HEIGHT * 0.96, backTopZ * 0.5);
  topPanel.rotation.x = Math.PI / 2 + angle * 0.3;
  g.add(topPanel);

  return g;
}
