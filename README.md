# Bend Penalty Kick

A 2D penalty shootout. You aim left and right, shoot, and try to beat a simple AI keeper and taker. Best of 5 kicks each side.

Play it at [https://SuperRich.github.io/bend-penalty-kick/](https://SuperRich.github.io/bend-penalty-kick/).

This token cannot turn Pages on (`gh api` and Actions both get 403). In the repo on GitHub, open Settings, then Pages. Set source to Deploy from a branch, branch `main`, folder `/docs`. The same files also sit on the `gh-pages` branch at its root if you prefer that source.

## How to play

1. Open the page.
2. Move the mouse, drag, or use the arrow keys to aim.
3. Click, tap, or press Space to shoot.
4. After Goal, Saved, or Miss, click or press Space for the next kick.
5. You and the AI each take up to 5 kicks. The match ends early when one side cannot catch up.
6. Press Play again, or R, after the match.

High shots go over the bar. Wide shots miss the posts. A shot between the posts and under the bar is a Goal unless the keeper dives the same way.

## Bend laws

Bend 2.0.16 owns the rules. `game.bend` defines the types and functions. `LAWS.bend` states the claims. `PROOF.bend` proves them.

The four laws are:

- A shot between the posts and under the bar, with no save, is a Goal.
- A side's score never goes past 5.
- One kick cannot be both Goal and Saved.
- The kickoff phase is always Aiming, Ball in flight, Goal, Saved, Miss, or Match over.

The browser does not run Bend. `docs/laws.js` is a hand-copied twin of `game.bend`. Same constructor names, same `resolve` table. The canvas loop calls that module and does not invent a second outcome.

## Local check

Install Bend:

```
curl -fsSL https://bend-lang.com/install.sh | sh
export PATH="$HOME/.bend/bin:$PATH"
```

Then:

```
bend PROOF.bend
node docs/test_laws.mjs
```

`bend PROOF.bend` must print `All terms check.`

To play locally, serve `docs/`:

```
python3 -m http.server --directory docs 8765
```
