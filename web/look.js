import { BAR_Y, GOAL_HALF_W, XWIDTH, YMAX, SPOT_Z, BALL_R } from "./pitch.js";
import {
  TAKER,
  KEEPER_Z,
  CAMERA,
  KITS,
  CROWD_ROWS,
  crowdSeat,
  shirtAt,
} from "./layout.js";

function hex(B, s) {
  const n = Number.parseInt(s.slice(1), 16);
  return new B.Color3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function paint(B, scene, name, color, extra) {
  const m = new B.StandardMaterial(name, scene);
  m.diffuseColor = typeof color === "string" ? hex(B, color) : color;
  m.specularColor = extra?.spec ?? new B.Color3(0.07, 0.07, 0.07);
  if (extra?.emissive) m.emissiveColor = hex(B, extra.emissive);
  if (extra?.alpha != null) {
    m.alpha = extra.alpha;
    m.transparencyMode = B.Material.MATERIAL_ALPHABLEND;
  }
  return m;
}

function joint(B, scene, name, parent, x, y, z) {
  const n = new B.TransformNode(name, scene);
  n.parent = parent;
  n.position = new B.Vector3(x, y, z);
  return n;
}

function cyl(B, scene, name, parent, height, diameter, material, y) {
  const m = B.MeshBuilder.CreateCylinder(name, {
    height,
    diameter,
    tessellation: 10,
  }, scene);
  m.material = material;
  m.parent = parent;
  m.position.y = y;
  return m;
}

function box(B, scene, name, parent, w, h, d, material, x, y, z) {
  const m = B.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
  m.material = material;
  m.parent = parent;
  m.position = new B.Vector3(x, y, z);
  return m;
}

function kitMats(B, scene, prefix, kit) {
  return {
    shirt: paint(B, scene, prefix + "shirt", kit.shirt, { spec: new B.Color3(0.12, 0.12, 0.1) }),
    shorts: paint(B, scene, prefix + "shorts", kit.shorts),
    socks: paint(B, scene, prefix + "socks", kit.socks),
    skin: paint(B, scene, prefix + "skin", kit.skin, { spec: new B.Color3(0.04, 0.03, 0.03) }),
    hair: paint(B, scene, prefix + "hair", kit.hair),
    boots: paint(B, scene, prefix + "boots", kit.boots, { spec: new B.Color3(0.18, 0.18, 0.18) }),
    gloves: paint(B, scene, prefix + "gloves", kit.gloves),
  };
}

export function makeHumanoid(B, scene, name, kit, pose, opts) {
  const simple = opts?.simple === true;
  const mats = kitMats(B, scene, name, kit);
  const root = new B.TransformNode(name, scene);

  const hips = joint(B, scene, name + "Hips", root, 0, 0.94, 0);
  box(B, scene, name + "Pelvis", hips, 0.3, 0.16, 0.2, mats.shorts, 0, 0, 0);

  const spine = joint(B, scene, name + "Spine", hips, 0, 0.1, 0);
  spine.rotation.x = pose.lean;
  box(B, scene, name + "Torso", spine, 0.4, 0.5, 0.24, mats.shirt, 0, 0.28, 0);
  cyl(B, scene, name + "Shoulders", spine, 0.44, 0.15, mats.shirt, 0.5).rotation.z = Math.PI / 2;

  const neck = joint(B, scene, name + "Neck", spine, 0, 0.54, 0);
  cyl(B, scene, name + "NeckMesh", neck, 0.09, 0.1, mats.skin, 0.04);
  const head = B.MeshBuilder.CreateSphere(name + "Head", { diameter: 0.23, segments: simple ? 7 : 12 }, scene);
  head.material = mats.skin;
  head.parent = neck;
  head.position.y = 0.18;
  const hair = B.MeshBuilder.CreateSphere(name + "Hair", { diameter: 0.24, segments: simple ? 6 : 10 }, scene);
  hair.material = mats.hair;
  hair.parent = head;
  hair.position.y = 0.05;
  hair.scaling.y = 0.58;

  if (!simple) {
    const eyeL = B.MeshBuilder.CreateSphere(name + "EyeL", { diameter: 0.035, segments: 6 }, scene);
    eyeL.material = paint(B, scene, name + "eye", "#1a1410");
    eyeL.parent = head;
    eyeL.position = new B.Vector3(-0.05, 0.02, -0.1);
    const eyeR = eyeL.clone(name + "EyeR");
    eyeR.position.x = 0.05;
  }

  function arm(side, sign, armPose) {
    const sh = joint(B, scene, name + "Sh" + side, spine, sign * 0.23, 0.5, 0);
    sh.rotation.z = armPose.out;
    sh.rotation.x = armPose.fwd;
    cyl(B, scene, name + "UArm" + side, sh, 0.3, 0.09, mats.shirt, -0.15);
    const el = joint(B, scene, name + "El" + side, sh, 0, -0.3, 0);
    el.rotation.x = armPose.bend;
    cyl(B, scene, name + "FArm" + side, el, 0.28, 0.075, mats.skin, -0.14);
    const hand = box(B, scene, name + "Hand" + side, el, 0.08, 0.1, 0.05, mats.gloves, 0, -0.3, 0);
    return { sh, el, hand };
  }

  function leg(side, sign, legPose) {
    const hp = joint(B, scene, name + "Hp" + side, hips, sign * 0.11, 0, 0);
    hp.rotation.x = legPose.fwd;
    hp.rotation.z = legPose.out;
    cyl(B, scene, name + "Thigh" + side, hp, 0.4, 0.13, mats.shorts, -0.2);
    const kn = joint(B, scene, name + "Kn" + side, hp, 0, -0.4, 0);
    kn.rotation.x = legPose.bend;
    cyl(B, scene, name + "Shin" + side, kn, 0.28, 0.1, mats.socks, -0.14);
    cyl(B, scene, name + "Calf" + side, kn, 0.12, 0.1, mats.skin, -0.34);
    box(B, scene, name + "Boot" + side, kn, 0.11, 0.08, 0.22, mats.boots, 0, -0.46, -0.05);
    return { hp, kn };
  }

  arm("L", -1, pose.lArm);
  arm("R", 1, pose.rArm);
  leg("L", -1, pose.lLeg);
  leg("R", 1, pose.rLeg);

  const meshes = root.getChildMeshes();
  return { root, meshes };
}

const TAKER_POSE = {
  lean: 0.12,
  lArm: { out: 0.55, fwd: -0.35, bend: 0.45 },
  rArm: { out: -0.25, fwd: 0.55, bend: 0.7 },
  lLeg: { out: 0.04, fwd: -0.18, bend: 0.12 },
  rLeg: { out: -0.08, fwd: 0.28, bend: 0.2 },
};

const KEEPER_POSE = {
  lean: 0.06,
  lArm: { out: 1.15, fwd: -0.15, bend: 0.55 },
  rArm: { out: -1.15, fwd: -0.15, bend: 0.55 },
  lLeg: { out: 0.16, fwd: -0.42, bend: 0.7 },
  rLeg: { out: -0.16, fwd: -0.42, bend: 0.7 },
};

function crowdPose(i, stand) {
  const sway = ((i * 17) % 9) * 0.03 - 0.12;
  const arm = stand ? 0.25 + ((i * 13) % 5) * 0.18 : 1.35;
  const raise = stand && i % 7 === 0 ? -1.1 : 0.15;
  return {
    lean: stand ? 0.04 : 0.35,
    lArm: { out: arm, fwd: raise, bend: 0.35 },
    rArm: { out: -arm - sway, fwd: i % 5 === 0 ? -0.9 : 0.1, bend: 0.4 },
    lLeg: { out: 0.08, fwd: stand ? 0.02 : -1.15, bend: stand ? 0.08 : 1.4 },
    rLeg: { out: -0.08, fwd: stand ? 0.02 : -1.15, bend: stand ? 0.08 : 1.4 },
  };
}

function dressPitch(B, scene) {
  const grass = new B.DynamicTexture("grass", { width: 512, height: 512 }, scene, false);
  const g = grass.getContext();
  g.fillStyle = "#1c8a3c";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) {
    g.fillStyle = i % 2 === 0 ? "#187836" : "#1f9342";
    g.fillRect(0, (i / 14) * 512, 512, 512 / 14 + 1);
  }
  for (let n = 0; n < 900; n++) {
    g.fillStyle = n % 2 ? "rgba(255,255,255,0.03)" : "rgba(0,40,0,0.05)";
    g.fillRect((n * 37) % 512, (n * 91) % 512, 3, 2);
  }
  grass.update();
  const pitchMat = new B.StandardMaterial("pitchMat", scene);
  pitchMat.diffuseTexture = grass;
  pitchMat.specularColor = new B.Color3(0.03, 0.03, 0.03);
  const pitch = B.MeshBuilder.CreateGround("pitch", { width: 28, height: 36 }, scene);
  pitch.position.z = 7;
  pitch.material = pitchMat;
  pitch.receiveShadows = true;
  pitch.isPickable = false;

  const lineMat = paint(B, scene, "lineMat", "#f4f1e8", { emissive: "#2a2a26" });
  const line = (name, w, d, x, z) => {
    const m = B.MeshBuilder.CreateBox(name, { width: w, height: 0.028, depth: d }, scene);
    m.position = new B.Vector3(x, 0.018, z);
    m.material = lineMat;
    return m;
  };
  line("goalLine", 12.2, 0.09, 0, 0.02);
  line("boxL", 0.08, 16.5, -5.5, 8.25);
  line("boxR", 0.08, 16.5, 5.5, 8.25);
  line("boxB", 11.08, 0.08, 0, 16.5);
  line("sixL", 0.08, 5.5, -2.75, 2.75);
  line("sixR", 0.08, 5.5, 2.75, 2.75);
  line("sixB", 5.58, 0.08, 0, 5.5);
  const spot = B.MeshBuilder.CreateCylinder("spot", { height: 0.02, diameter: 0.28 }, scene);
  spot.position = new B.Vector3(0, 0.016, SPOT_Z);
  spot.material = lineMat;

  const arc = B.MeshBuilder.CreateTorus("penArc", {
    diameter: 9.15,
    thickness: 0.07,
    tessellation: 36,
  }, scene);
  arc.position = new B.Vector3(0, 0.015, SPOT_Z);
  arc.scaling.z = 0.42;
  arc.material = lineMat;

  return pitch;
}

function dressGoal(B, scene) {
  const postMat = paint(B, scene, "postMat", "#f6f3ea", { spec: new B.Color3(0.35, 0.35, 0.32) });
  const post = (name, x) => {
    const p = B.MeshBuilder.CreateCylinder(name, { height: BAR_Y, diameter: 0.14, tessellation: 12 }, scene);
    p.position = new B.Vector3(x, BAR_Y / 2, 0);
    p.material = postMat;
    return p;
  };
  const posts = [post("postL", -GOAL_HALF_W), post("postR", GOAL_HALF_W)];
  const bar = B.MeshBuilder.CreateCylinder("bar", {
    height: GOAL_HALF_W * 2 + 0.14,
    diameter: 0.14,
    tessellation: 12,
  }, scene);
  bar.rotation.z = Math.PI / 2;
  bar.position = new B.Vector3(0, BAR_Y, 0);
  bar.material = postMat;

  const netTex = new B.DynamicTexture("netTex", { width: 256, height: 128 }, scene, true);
  const nctx = netTex.getContext();
  nctx.clearRect(0, 0, 256, 128);
  nctx.strokeStyle = "rgba(236,232,220,0.7)";
  nctx.lineWidth = 2;
  for (let i = 0; i <= 20; i++) {
    nctx.beginPath();
    nctx.moveTo((i / 20) * 256, 0);
    nctx.lineTo((i / 20) * 256, 128);
    nctx.stroke();
  }
  for (let j = 0; j <= 10; j++) {
    nctx.beginPath();
    nctx.moveTo(0, (j / 10) * 128);
    nctx.lineTo(256, (j / 10) * 128);
    nctx.stroke();
  }
  netTex.update();
  const netMat = new B.StandardMaterial("netMat", scene);
  netMat.diffuseTexture = netTex;
  netMat.diffuseTexture.hasAlpha = true;
  netMat.useAlphaFromDiffuseTexture = true;
  netMat.backFaceCulling = false;
  netMat.specularColor = new B.Color3(0, 0, 0);
  const netW = GOAL_HALF_W * 2 + 0.18;
  const back = B.MeshBuilder.CreatePlane("netBack", { width: netW, height: BAR_Y }, scene);
  back.position = new B.Vector3(0, BAR_Y / 2 - 0.04, -1.15);
  back.rotation.x = 0.08;
  back.material = netMat;
  const top = B.MeshBuilder.CreatePlane("netTop", { width: netW, height: 1.2 }, scene);
  top.position = new B.Vector3(0, BAR_Y - 0.02, -0.58);
  top.rotation.x = Math.PI / 2 - 0.18;
  top.material = netMat;
  const side = (name, x) => {
    const p = B.MeshBuilder.CreatePlane(name, { width: 1.2, height: BAR_Y }, scene);
    p.position = new B.Vector3(x, BAR_Y / 2, -0.58);
    p.rotation.y = Math.PI / 2;
    p.material = netMat;
    return p;
  };
  side("netL", -GOAL_HALF_W);
  side("netR", GOAL_HALF_W);
  return posts.concat([bar]);
}

function dressStands(B, scene) {
  const conc = paint(B, scene, "conc", "#5a5d63", { spec: new B.Color3(0.04, 0.04, 0.04) });
  const dark = paint(B, scene, "standDark", "#2c3036");
  const rail = paint(B, scene, "rail", "#c5c8ce", { spec: new B.Color3(0.25, 0.25, 0.25) });
  const steps = [
    { z: -2.2, y: 0.45, w: 18, d: 1.4, h: 0.9 },
    { z: -3.4, y: 0.85, w: 19.4, d: 1.4, h: 1.1 },
    { z: -4.6, y: 1.3, w: 20.8, d: 1.4, h: 1.2 },
    { z: -5.8, y: 1.8, w: 22.2, d: 1.4, h: 1.3 },
    { z: -7.1, y: 2.35, w: 23.6, d: 1.6, h: 1.4 },
  ];
  for (const s of steps) {
    const m = B.MeshBuilder.CreateBox("step" + s.z, { width: s.w, height: s.h, depth: s.d }, scene);
    m.position = new B.Vector3(0, s.y, s.z);
    m.material = conc;
  }
  const wall = B.MeshBuilder.CreateBox("backWall", { width: 24.4, height: 4.2, depth: 0.45 }, scene);
  wall.position = new B.Vector3(0, 3.4, -8.05);
  wall.material = dark;
  const fascia = B.MeshBuilder.CreateBox("fascia", { width: 24.6, height: 0.35, depth: 0.7 }, scene);
  fascia.position = new B.Vector3(0, 5.55, -7.7);
  fascia.material = paint(B, scene, "fascia", "#0f1720");
  const railBar = B.MeshBuilder.CreateBox("frontRail", { width: 17.4, height: 0.06, depth: 0.06 }, scene);
  railBar.position = new B.Vector3(0, 1.55, -1.85);
  railBar.material = rail;
  const ads = ["#c81e1e", "#1d4ed8", "#f4f1e8", "#111827", "#15803d"];
  ads.forEach((c, i) => {
    const a = B.MeshBuilder.CreateBox("ad" + i, { width: 3.2, height: 0.7, depth: 0.08 }, scene);
    a.position = new B.Vector3(-6.4 + i * 3.2, 0.55, -1.55);
    a.material = paint(B, scene, "adMat" + i, c, { emissive: c });
  });
}

function dressCrowd(B, scene) {
  const skins = ["#e6b48a", "#c68642", "#8d5524", "#f1c27d", "#d1a37a"];
  const hairs = ["#1a120c", "#3b2a1a", "#6b3a1f", "#111111", "#c4a574"];
  const people = [];
  let n = 0;
  for (const row of CROWD_ROWS) {
    for (let i = 0; i < row.count; i++) {
      const kit = {
        shirt: shirtAt(n),
        shorts: n % 3 === 0 ? "#1a1d24" : "#f3efe4",
        socks: shirtAt(n + 3),
        skin: skins[n % skins.length],
        hair: hairs[n % hairs.length],
        boots: "#141414",
        gloves: skins[n % skins.length],
      };
      const { root, meshes } = makeHumanoid(B, scene, "crowd" + n, kit, crowdPose(n, row.stand), { simple: true });
      const seat = crowdSeat(row, i);
      root.position = new B.Vector3(seat.x, seat.y, seat.z);
      root.scaling = new B.Vector3(0.92, 0.92, 0.92);
      root.rotation.y = Math.PI + ((n % 5) - 2) * 0.04;
      people.push(...meshes);
      n += 1;
    }
  }
  return people;
}

function dressLights(B, scene) {
  scene.clearColor = new B.Color4(0.38, 0.58, 0.82, 1);
  scene.fogMode = B.Scene.FOGMODE_LINEAR;
  scene.fogStart = 24;
  scene.fogEnd = 52;
  scene.fogColor = new B.Color3(0.5, 0.66, 0.84);

  const hemi = new B.HemisphericLight("hemi", new B.Vector3(0.12, 1, 0.28), scene);
  hemi.intensity = 0.72;
  hemi.groundColor = new B.Color3(0.18, 0.22, 0.16);
  const sun = new B.DirectionalLight("sun", new B.Vector3(0.55, -1.2, 0.28), scene);
  sun.position = new B.Vector3(-10, 18, 12);
  sun.intensity = 0.95;
  const flood = (name, x, z) => {
    const l = new B.SpotLight(name, new B.Vector3(x, 7.2, z), new B.Vector3(-x * 0.08, -1, 0.35), 1.1, 8, scene);
    l.intensity = 0.45;
    l.diffuse = new B.Color3(1, 0.95, 0.82);
  };
  flood("floodL", -8.5, -6.2);
  flood("floodR", 8.5, -6.2);
  return sun;
}

function dressCamera(B, scene) {
  const camera = new B.FreeCamera("cam", new B.Vector3(CAMERA.x, CAMERA.y, CAMERA.z), scene);
  camera.minZ = 0.08;
  camera.fov = CAMERA.fov;
  camera.setTarget(new B.Vector3(CAMERA.targetX, CAMERA.targetY, CAMERA.targetZ));
  return camera;
}

export function buildStage(B, scene) {
  dressCamera(B, scene);
  const sun = dressLights(B, scene);
  const pitch = dressPitch(B, scene);
  const goalMeshes = dressGoal(B, scene);
  dressStands(B, scene);
  dressCrowd(B, scene);

  const ballMat = paint(B, scene, "ballMat", "#f5f5f2", { spec: new B.Color3(0.28, 0.28, 0.28) });
  const ball = B.MeshBuilder.CreateSphere("ball", { diameter: BALL_R * 2, segments: 16 }, scene);
  ball.material = ballMat;

  const keeper = makeHumanoid(B, scene, "keeper", KITS.keeper, KEEPER_POSE, {});
  keeper.root.position = new B.Vector3(0, 0, KEEPER_Z);
  const taker = makeHumanoid(B, scene, "taker", KITS.taker, TAKER_POSE, {});
  taker.root.position = new B.Vector3(TAKER.x, 0, TAKER.z);

  const aimMat = paint(B, scene, "aimMat", "#ffe082", { emissive: "#5a480c" });
  const aimDot = B.MeshBuilder.CreateSphere("aimDot", { diameter: 0.16, segments: 8 }, scene);
  aimDot.material = aimMat;
  const aimPlane = B.MeshBuilder.CreatePlane("aimPlane", { width: XWIDTH, height: YMAX }, scene);
  aimPlane.position = new B.Vector3(0, YMAX / 2, 0.04);
  aimPlane.isVisible = false;
  aimPlane.isPickable = true;

  const shadow = new B.ShadowGenerator(1536, sun);
  shadow.useBlurExponentialShadowMap = true;
  shadow.setDarkness(0.38);
  shadow.addShadowCaster(ball);
  for (const m of keeper.meshes) shadow.addShadowCaster(m);
  for (const m of taker.meshes) shadow.addShadowCaster(m);
  for (const m of goalMeshes) shadow.addShadowCaster(m);

  return {
    pitch,
    ball,
    keeperRoot: keeper.root,
    takerRoot: taker.root,
    aimDot,
    aimPlane,
  };
}
