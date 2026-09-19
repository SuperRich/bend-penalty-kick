# Bend Penalty Kick

A 3D penalty shootout. You aim and shoot. A simple AI keeps and takes. Best of 5 kicks each side.

Play it at [https://SuperRich.github.io/bend-penalty-kick/](https://SuperRich.github.io/bend-penalty-kick/).

The pitch is a Babylon.js scene (CDN `babylon.js`, not Three.js). Click the canvas once if the browser blocks audio.

This token cannot turn Pages on. `gh api` and Actions both get 403. In the repo on GitHub, open Settings, then Pages. Set source to Deploy from a branch, branch `main`, folder `/docs`.

## How to play

1. Open the page.
2. Click the pitch once to start sound.
3. Move the mouse, drag, or use the arrow keys to aim.
4. Click, tap, or press Space to shoot.
5. After Goal, Saved, or Miss, click or press Space for the next kick.
6. You and the AI each take up to 5 kicks. The match ends early when the other side cannot catch up.
7. Press Play again, or R, after the match.

High shots go over the bar. Wide shots miss the posts. A shot between the posts and under the bar is a Goal unless the keeper dives the same way.

## Sounds

Web Audio API, procedural. No audio files.

- Kick: low thump plus filtered noise
- Goal: band-pass cheer plus rising tones
- Save: low thud
- Miss: high falling whistle

## Bend laws

Bend 2.0.16 owns the rules. `game.bend` defines the types and functions. `LAWS.bend` states the claims. `PROOF.bend` proves them.

The four laws are:

- A shot between the posts and under the bar, with no save, is a Goal.
- A side's score never goes past 5.
- One kick cannot be both Goal and Saved.
- The kickoff phase is always `PhaseAiming`, `PhaseFlight`, `PhaseGoal`, `PhaseSaved`, `PhaseMiss`, or `PhaseOver`.

`web/game.js` imports `game.bend`. `bend web/index.html -o docs` compiles that import into a static chunk. The scene calls `Game.resolve` and `Goals.apply`. It does not keep a second outcome table.

## Local check

Install Bend:

```
curl -fsSL https://bend-lang.com/install.sh | sh
export PATH="$HOME/.bend/bin:$PATH"
```

Then:

```
bend PROOF.bend
node web/test_shell.mjs
bend web/index.html -o docs
```

`bend PROOF.bend` must print `All terms check.`

To play locally, serve `docs/`:

```
python3 -m http.server --directory docs 8765
```
