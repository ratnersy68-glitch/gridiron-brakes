import * as THREE from 'three';
import { getItem } from '../data/cosmetics.js';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08, ...opts });
}

// Low-poly stylized shooter. Named sub-groups are exposed for animation
// (windup, deke sway, celebration) by the effects/attempt systems.
export function buildShooterModel(loadout) {
  const jersey = getItem('jersey', loadout.jersey) || { color: 0x1a4fa0, trim: 0xffffff };
  const pants = getItem('pants', loadout.pants) || { color: 0x1a2230 };
  const gloves = getItem('gloves', loadout.gloves) || { color: 0x333333 };
  const skates = getItem('skates', loadout.skates) || { color: 0x222222 };
  const stick = getItem('stick', loadout.stick) || { color: 0x3a2a1a };

  const root = new THREE.Group();
  root.name = 'shooter';

  const hips = new THREE.Group();
  hips.position.y = 0.55;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.42, 4, 8), mat(jersey.color));
  torso.position.y = 0.42;
  torso.castShadow = true;
  hips.add(torso);

  const trimStripe = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.03, 6, 16), mat(jersey.trim));
  trimStripe.position.y = 0.28;
  trimStripe.rotation.x = Math.PI / 2;
  hips.add(trimStripe);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(jersey.trim, { roughness: 0.3 }));
  helmet.position.y = 0.86;
  helmet.castShadow = true;
  hips.add(helmet);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.04), mat(0x111111, { metalness: 0.6, roughness: 0.2 }));
  visor.position.set(0, 0.83, 0.14);
  hips.add(visor);

  const pantsMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.16, 4, 8), mat(pants.color));
  pantsMesh.position.y = 0.1;
  hips.add(pantsMesh);

  function leg(sign) {
    const g = new THREE.Group();
    g.position.set(sign * 0.11, -0.02, 0);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 4, 6), mat(0x141414));
    shin.position.y = -0.2;
    g.add(shin);
    const skate = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.28), mat(skates.color, { metalness: 0.3 }));
    skate.position.set(0, -0.4, 0.05);
    g.add(skate);
    return g;
  }
  const legL = leg(-1); const legR = leg(1);
  hips.add(legL, legR);

  function arm(sign) {
    const g = new THREE.Group();
    g.position.set(sign * 0.28, 0.55, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 6), mat(jersey.color));
    upper.position.y = -0.12;
    g.add(upper);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat(gloves.color));
    glove.position.y = -0.32;
    g.add(glove);
    return g;
  }
  const armL = arm(-1); const armR = arm(1);
  hips.add(armL, armR);

  const stickGroup = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.95, 8), mat(stick.color));
  shaft.position.y = -0.28;
  shaft.rotation.z = 0.18;
  stickGroup.add(shaft);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.02), mat(stick.color));
  blade.position.set(0.15, -0.76, 0.04);
  blade.rotation.z = 0.3;
  stickGroup.add(blade);
  stickGroup.position.copy(armR.position);
  stickGroup.position.y -= 0.02;
  hips.add(stickGroup);

  root.userData.parts = { hips, torso, armL, armR, legL, legR, stickGroup, helmet };
  return root;
}

export function buildGoalieModel(loadout) {
  const maskItem = getItem('goalieMask', loadout?.goalieMask) || { color: 0xf0f0f0 };
  const root = new THREE.Group();
  root.name = 'goalie';

  const hips = new THREE.Group();
  hips.position.y = 0.5;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.4, 4, 8), mat(0x111111));
  torso.position.y = 0.46;
  torso.castShadow = true;
  hips.add(torso);
  const chestPad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.24), mat(0xdddddd));
  chestPad.position.y = 0.5;
  hips.add(chestPad);

  const mask = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), mat(maskItem.color, { roughness: 0.35 }));
  mask.position.y = 0.94;
  mask.castShadow = true;
  hips.add(mask);
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.03), mat(0x222222, { metalness: 0.7, roughness: 0.3 }));
  cage.position.set(0, 0.9, 0.17);
  hips.add(cage);

  function pad(sign) {
    const g = new THREE.Group();
    g.position.set(sign * 0.17, -0.02, 0);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.62, 0.16), mat(0xf2f2f2));
    p.position.y = -0.28;
    p.castShadow = true;
    g.add(p);
    return g;
  }
  const padL = pad(-1); const padR = pad(1);
  hips.add(padL, padR);

  const blockerArm = new THREE.Group();
  blockerArm.position.set(0.4, 0.55, 0);
  const bUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.2, 4, 6), mat(0x111111));
  bUpper.position.y = -0.1;
  blockerArm.add(bUpper);
  const blocker = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.05), mat(0xdd2222));
  blocker.position.y = -0.28;
  blockerArm.add(blocker);
  hips.add(blockerArm);

  const gloveArm = new THREE.Group();
  gloveArm.position.set(-0.4, 0.55, 0);
  const gUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.2, 4, 6), mat(0x111111));
  gUpper.position.y = -0.1;
  gloveArm.add(gUpper);
  const trapper = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(0xdd2222));
  trapper.position.y = -0.28;
  gloveArm.add(trapper);
  hips.add(gloveArm);

  const stickGroup = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), mat(0x3a2a1a));
  shaft.rotation.z = 0.05;
  shaft.position.set(0.06, -0.5, 0.06);
  stickGroup.add(shaft);
  hips.add(stickGroup);

  root.userData.parts = { hips, torso, padL, padR, blockerArm, gloveArm, mask, stickGroup };
  return root;
}
